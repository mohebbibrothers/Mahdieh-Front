import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { ApiError, api, unwrap } from "./client";
import {
  offerAcceptedSchema,
  offlineCheckSchema,
  reservationListSchema,
  reservationSchema,
  sessionListSchema,
  slotOfferSchema,
  waitlistEntrySchema,
  waitlistListSchema,
} from "./schemas";

/**
 * پرتال زائر (P-07) — مدیریت اقامت پس از ثبت: سابقهٔ اقامت با مکان‌نما، هماهنگی ورود، صف انتظار و
 * پیشنهادها، نشست‌های فعال و بازرسی آفلاین گواهی. کلیدهای کاربرمحور زیر ‎["me", …]‎ هستند تا خروج از
 * حساب (‎removeQueries(["me"])‎) همه را یک‌جا پاک کند.
 */
export const pk = {
  past: ["me", "reservations", "past", "infinite"] as const,
  waitlist: ["me", "waitlist"] as const,
  sessions: ["me", "sessions"] as const,
};

const noRetryOnClientError = (count: number, e: Error) => !(e instanceof ApiError && e.status < 500) && count < 2;

/** مکان‌نمای DRF از نشانی کامل ‎meta.next‎ (هم‌مبدأ یا مطلق) — بی‌اعتماد به ساختار نشانی. */
export function cursorOf(next: string | null | undefined): string | null {
  if (!next) return null;
  try {
    return new URL(next, "https://x.invalid").searchParams.get("cursor");
  } catch {
    return null;
  }
}

/** سابقهٔ اقامت — تازه‌ترین سفر نخست، صفحه‌های ۱۰تایی با «بیشتر» (شمارش کل در ‎meta.total‎). */
export const PAST_PAGE = 10;
export const pastStaysQuery = infiniteQueryOptions({
  queryKey: pk.past,
  initialPageParam: null as string | null,
  queryFn: ({ pageParam, signal }) =>
    unwrap(
      api.GET("/api/v1/reservations", {
        params: { query: { scope: "past", page_size: PAST_PAGE, ...(pageParam ? { cursor: pageParam } : {}) } },
        signal,
      }),
      (d) => reservationListSchema.parse(d),
    ),
  getNextPageParam: (last) => cursorOf(last.meta.next),
  staleTime: 60_000,
  retry: noRetryOnClientError,
});

export type ArrivalPatch = { expected_arrival?: string | null; vehicle_plate?: string; guest_note?: string };

/** «هماهنگی ورود» پس از ثبت — فقط تا پیش از پذیرش حضوری (‎details_editable‎)؛ پس از آن ‎409 details_locked‎. */
export function updateArrival(code: string, body: ArrivalPatch) {
  return unwrap(api.PATCH("/api/v1/reservations/{code}", { params: { path: { code } }, body }), (d) =>
    reservationSchema.parse(d),
  );
}

/** درخواست‌های در جریان صف انتظار (سقف پیش‌فرض یک درخواست) با پیشنهاد باز هر کدام. */
export const waitlistQuery = queryOptions({
  queryKey: pk.waitlist,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/waitlist", { signal }), (d) => waitlistListSchema.parse(d)),
  staleTime: 20_000,
  retry: noRetryOnClientError,
});

export function withdrawWaitlist(entryId: string, reasonKind: string) {
  return unwrap(
    api.POST("/api/v1/waitlist/{entry_id}/withdraw", {
      params: { path: { entry_id: entryId } },
      body: { reason_kind: reasonKind },
    }),
    (d) => waitlistEntrySchema.parse(d),
  );
}

export type OfferResult = { kind: "accepted"; code: string } | { kind: "declined" };

/** پاسخ به پیشنهاد سانس: پذیرش ⇒ ‎201‎ و رزرو تازه؛ رد ⇒ ‎200‎ و سانس به نفر بعد می‌رسد. */
export async function respondOffer(
  offerId: string,
  action: "accept" | "decline",
  reasonKind?: string,
): Promise<OfferResult> {
  return unwrap(
    api.POST("/api/v1/waitlist/offers/{offer_id}/respond", {
      params: { path: { offer_id: offerId } },
      body: { action, ...(reasonKind ? { reason_kind: reasonKind } : {}) },
    }),
    (d): OfferResult => {
      if (action === "accept") return { kind: "accepted", code: offerAcceptedSchema.parse(d).reservation_code };
      slotOfferSchema.parse(d);
      return { kind: "declined" };
    },
  );
}

/** دستگاه‌هایی که با این حساب وارد شده‌اند (پیشوند شبکه، نه آی‌پی کامل). */
export const sessionsQuery = queryOptions({
  queryKey: pk.sessions,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/me/sessions", { signal }), (d) => sessionListSchema.parse(d)),
  staleTime: 30_000,
  retry: noRetryOnClientError,
});

export function revokeSession(sessionId: string) {
  return unwrap(
    api.POST("/api/v1/me/sessions/{session_id}/revoke", { params: { path: { session_id: sessionId } } }),
    () => null,
  );
}

/** تقویم همهٔ اقامت‌های پیش‌رو (ICS) — هم‌مبدأ با کوکی نشست. */
export const myIcsHref = "/api/v1/me/calendar.ics";

export type OfflineFields = {
  code: string;
  holder: string;
  unit: string;
  floor: number;
  guests: number;
  starts: string;
  ends: string;
  short_code: string;
};

/** بازمحاسبهٔ کد کوتاه گواهی چاپی در سرور (HMAC کلیددار — جعل‌ناپذیر بی کلید سرور). */
export function checkOffline(body: OfflineFields) {
  return unwrap(api.POST("/api/v1/certificates/verify-offline", { body }), (d) => offlineCheckSchema.parse(d));
}
