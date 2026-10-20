import { ApiError, api, resetCsrf, unwrap } from "./client";
import type { components } from "./schema";
import { profileSchema, type Profile } from "./schemas";
import { z } from "zod/mini";

/**
 * ورود با کد یک‌بارمصرف و پروفایل — فقط تابع‌های شبکه (بدون حالت رابط).
 * هر پاسخ با zod سنجیده می‌شود تا تغییر قرارداد بک‌اند همان‌جا آشکار شود.
 */
const otpRequested = z.object({
  expires_in: z.number(),
  resend_after: z.number(),
  delivery_status: z.string(),
});
export type OtpRequested = z.infer<typeof otpRequested>;

const sessionResult = z.object({
  profile: profileSchema,
  is_new_user: z.boolean(),
  next_step: z.enum(["complete_profile", "home"]),
});
export type SessionResult = z.infer<typeof sessionResult>;

export function requestOtp(phone: string) {
  return unwrap(api.POST("/api/v1/auth/otp/request", { body: { phone } }), (d) => otpRequested.parse(d));
}

export async function verifyOtp(phone: string, code: string) {
  const result = await unwrap(api.POST("/api/v1/auth/otp/verify", { body: { phone, code } }), (d) =>
    sessionResult.parse(d),
  );
  resetCsrf();
  return result;
}

export async function logout(everywhere = false) {
  const call = everywhere ? api.POST("/api/v1/auth/logout-all") : api.POST("/api/v1/auth/logout");
  try {
    await unwrap(call, () => null);
  } finally {
    resetCsrf();
  }
}

export type ProfileInput = {
  first_name: string;
  last_name: string;
  nationality: string;
  province: string;
  city: string;
  national_id: string;
  passport_number: string;
};

export function updateProfile(body: ProfileInput): Promise<Profile> {
  // استان از Combobox با مقادیر همان فهرست ‎/config‎ می‌آید؛ اعتبار نهایی با سرور است.
  const payload = body as components["schemas"]["PatchedProfileUpdateRequest"];
  return unwrap(api.PATCH("/api/v1/me/profile", { body: payload }), (d) => profileSchema.parse(d));
}

/** خطاهای فیلدبه‌فیلد Problem Details (ADR-0017) ⇒ نقشهٔ «فیلد ← نخستین پیام». */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError)) return {};
  const raw = (e.body as { errors?: Record<string, unknown> } | null)?.errors ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const first = Array.isArray(v) ? v[0] : v;
    if (typeof first === "string") out[k] = first;
  }
  return out;
}

/** ثانیه‌های «دوباره تلاش کنید» از بدنهٔ ۴۲۹ (یا null). */
export function retryAfter(e: unknown): number | null {
  if (!(e instanceof ApiError) || e.status !== 429) return null;
  const v = (e.body as { retry_after?: unknown } | null)?.retry_after;
  return typeof v === "number" && v > 0 ? Math.ceil(v) : null;
}

/** تلاش‌های باقی‌ماندهٔ کد اشتباه (یا null). */
export function remainingAttempts(e: unknown): number | null {
  if (!(e instanceof ApiError)) return null;
  const v = (e.body as { remaining_attempts?: unknown } | null)?.remaining_attempts;
  return typeof v === "number" ? v : null;
}
