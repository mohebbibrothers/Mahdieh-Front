import { queryOptions } from "@tanstack/react-query";
import { ApiError, api, toApiError, unwrap } from "./client";
import {
  calendarSchema,
  configSchema,
  helpSchema,
  metaSchema,
  occasionsSchema,
  propertySchema,
  quoteSchema,
  reservationListSchema,
  otpRequestResultSchema,
  sessionResultSchema,
  sessionStateSchema,
  standingSchema,
  verificationSchema,
  type SessionState,
} from "./schemas";

/**
 * کارخانهٔ کوئری‌ها — یک منبع برای کلید، تابع و سیاست تازگی هر نقطهٔ پایانی.
 * تازگی‌ها با هدرهای کش بک‌اند هم‌سوست (config: max-age 60؛ calendar: must-revalidate).
 */
export const qk = {
  config: ["config"] as const,
  meta: ["meta"] as const,
  property: ["property"] as const,
  calendar: (days: number) => ["calendar", days] as const,
  occasions: (from: string, to: string) => ["occasions", from, to] as const,
  help: ["help"] as const,
  session: ["session"] as const,
  standing: ["me", "standing"] as const,
  reservations: (scope: "upcoming" | "past" | "all") => ["me", "reservations", scope] as const,
};

export const configQuery = queryOptions({
  queryKey: qk.config,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/config", { signal }), (d) => configSchema.parse(d)),
  staleTime: 60_000,
});

export const metaQuery = queryOptions({
  queryKey: qk.meta,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/meta", { signal }), (d) => metaSchema.parse(d)),
  staleTime: 5 * 60_000,
});

export const propertyQuery = queryOptions({
  queryKey: qk.property,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/property", { signal }), (d) => propertySchema.parse(d)),
  staleTime: 10 * 60_000,
});

/** موجودی زنده: کوتاه‌عمر، بازخوانی هنگام برگشت به زبانه و هر ۶۰ ثانیه وقتی صفحه دیده می‌شود. */
export const calendarQuery = (days: number) =>
  queryOptions({
    queryKey: qk.calendar(days),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/calendar", { params: { query: { days } }, signal }), (d) => calendarSchema.parse(d)),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

export const occasionsQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: qk.occasions(from, to),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/occasions", { params: { query: { from, to } }, signal }), (d) =>
        occasionsSchema.parse(d),
      ),
    staleTime: 30 * 60_000,
  });

export const helpQuery = queryOptions({
  queryKey: qk.help,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/help", { signal }), (d) => helpSchema.parse(d)),
  staleTime: 10 * 60_000,
});

/** نشست: ۴۰۱ یعنی مهمان (null)، نه خطا. */
/**
 * وضعیت نشست — ‎`/auth/session` برای مهمان هم ۲۰۰ است (نه ۴۰۱)، پس کنسول تمیز می‌ماند.
 * خروجی همان پروفایل یا null است تا مصرف‌کننده‌ها فقط «وارد شده؟» را بپرسند.
 */
const SESSION_STALE_MS = 60_000;
const fetchSession = ({ signal }: { signal: AbortSignal }) =>
  unwrap(api.GET("/api/v1/auth/session", { signal }), (d) => sessionStateSchema.parse(d));
const retryUnlessClientError = (count: number, e: Error) => !(e instanceof ApiError && e.status < 500) && count < 2;

export const sessionQuery = queryOptions({
  queryKey: qk.session,
  queryFn: fetchSession,
  staleTime: SESSION_STALE_MS,
  retry: retryUnlessClientError,
});

/** همان کش نشست؛ فقط پروفایل (یا null برای مهمان) را برمی‌گرداند. */
export const meQuery = queryOptions({
  queryKey: qk.session,
  queryFn: fetchSession,
  staleTime: SESSION_STALE_MS,
  retry: retryUnlessClientError,
  select: (s: SessionState) => s.profile,
});

export const standingQuery = queryOptions({
  queryKey: qk.standing,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/me/standing", { signal }), (d) => standingSchema.parse(d)),
  staleTime: 30_000,
});

export const reservationsQuery = (scope: "upcoming" | "past" | "all") =>
  queryOptions({
    queryKey: qk.reservations(scope),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/reservations", { params: { query: { scope } }, signal }), (d) =>
        reservationListSchema.parse(d),
      ),
    staleTime: 30_000,
  });

export function fetchQuote(body: { unit_code: string; start: string; end: string; guests_count: number }) {
  return unwrap(api.POST("/api/v1/reservations/quote", { body }), (d) => quoteSchema.parse(d));
}

export function verifyCertificate(token: string, signal?: AbortSignal) {
  return unwrap(
    api.GET("/api/v1/certificates/verify/{token}", { params: { path: { token } }, ...(signal ? { signal } : {}) }),
    (d) => verificationSchema.parse(d),
  );
}

/** ورود با کد یک‌بارمصرف — پاسخ برای همهٔ شماره‌ها یکسان است (ضد شمارش کاربران). */
export function requestOtp(phone: string) {
  return unwrap(api.POST("/api/v1/auth/otp/request", { body: { phone } }), (d) => otpRequestResultSchema.parse(d));
}

export function verifyOtp(phone: string, code: string) {
  return unwrap(api.POST("/api/v1/auth/otp/verify", { body: { phone, code } }), (d) => sessionResultSchema.parse(d));
}

export async function logout(): Promise<void> {
  const { response } = await api.POST("/api/v1/auth/logout");
  // ۴۰۱ یعنی نشست پیش‌تر تمام شده — نتیجهٔ مطلوب همان است.
  if (!response.ok && response.status !== 401) throw toApiError(response.status, null);
}
