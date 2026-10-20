import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

/**
 * کلاینت نوع‌دار API (هم‌مبدأ، کوکی نشست جنگو). برای درخواست‌های تغییر‌دهنده توکن CSRF
 * از نقطهٔ ‎/auth/csrf‎ گرفته و در هدر مقرر همان پاسخ فرستاده می‌شود (نام کوکی/هدر از
 * بک‌اند می‌آید، نه حدس فرانت).
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let csrf: Promise<{ token: string; header: string }> | null = null;
async function csrfToken(): Promise<{ token: string; header: string }> {
  csrf ??= fetch("/api/v1/auth/csrf", { credentials: "same-origin", headers: { Accept: "application/json" } })
    .then(async (r) => {
      if (!r.ok) throw new ApiError(r.status, "csrf_unavailable", "توکن امنیتی دریافت نشد.", null);
      const body = (await r.json()) as { csrf_token: string; header_name: string };
      return { token: body.csrf_token, header: body.header_name.replace(/^HTTP_/, "").replaceAll("_", "-") };
    })
    .catch((e: unknown) => {
      csrf = null;
      throw e;
    });
  return csrf;
}

/** جنگو هنگام ورود/خروج توکن CSRF را می‌چرخاند ⇒ پس از هر دو، توکن کش‌شده دور ریخته می‌شود. */
export function resetCsrf(): void {
  csrf = null;
}

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set("Accept", "application/json");
    if (SAFE.has(request.method)) return request;
    const { token, header } = await csrfToken();
    request.headers.set(header, token);
    return request;
  },
};

export const api = createClient<paths>({ baseUrl: "", credentials: "same-origin" });
api.use(csrfMiddleware);

/** بدنهٔ Problem Details بک‌اند ⇒ ApiError با پیام فارسیِ خود سرور. */
export function toApiError(status: number, body: unknown): ApiError {
  const problem = (body ?? {}) as { code?: string; detail?: string };
  return new ApiError(status, problem.code ?? "error", problem.detail ?? "ارتباط با سامانه ممکن نشد.", body);
}

/** باز کردن نتیجهٔ openapi-fetch: دادهٔ اعتبارسنجی‌شده یا خطای نوع‌دار. */
export async function unwrap<T>(
  call: Promise<{ data?: unknown; error?: unknown; response: Response }>,
  parse: (raw: unknown) => T,
): Promise<T> {
  const { data, error, response } = await call;
  if (!response.ok || error !== undefined) throw toApiError(response.status, error);
  return parse(data);
}
