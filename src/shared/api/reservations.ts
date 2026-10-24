import { queryOptions } from "@tanstack/react-query";
import * as z from "zod/mini";
import { ApiError, api, unwrap } from "./client";
import {
  alternativeSchema,
  cancelPreviewSchema,
  certificateSchema,
  reservationEventsSchema,
  reservationSchema,
  violation,
  waitlistEntrySchema,
  type Alternative,
  type Violation,
} from "./schemas";

/**
 * چرخهٔ عمر یک رزرو از دید زائر: ثبت هم‌توان، جزئیات، گواهی، گاه‌شمار، پیش‌نمایش لغو، لغو و صف انتظار.
 * کلیدها زیر ‎["me", …]‎ هستند تا با خروج از حساب (‎removeQueries(["me"])‎) یک‌جا پاک شوند.
 */
export const rk = {
  reservation: (code: string) => ["me", "reservation", code] as const,
  certificate: (code: string) => ["me", "reservation", code, "certificate"] as const,
  timeline: (code: string) => ["me", "reservation", code, "timeline"] as const,
  cancelPreview: (code: string) => ["me", "reservation", code, "cancel-preview"] as const,
};

const path = (code: string) => ({ params: { path: { code } } });
const noRetryOnClientError = (count: number, e: Error) => !(e instanceof ApiError && e.status < 500) && count < 2;

export const reservationQuery = (code: string) =>
  queryOptions({
    queryKey: rk.reservation(code),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/reservations/{code}", { ...path(code), signal }), (d) => reservationSchema.parse(d)),
    staleTime: 15_000,
    retry: noRetryOnClientError,
  });

/** گواهی فقط برای رزرو قطعی/در اقامت/پایان‌یافته؛ ‎409‎ یعنی «هنوز/دیگر گواهی ندارد» (نه خطای شبکه). */
export const certificateQuery = (code: string) =>
  queryOptions({
    queryKey: rk.certificate(code),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/reservations/{code}/certificate", { ...path(code), signal }), (d) =>
        certificateSchema.parse(d),
      ),
    staleTime: 5 * 60_000,
    retry: noRetryOnClientError,
  });

export const timelineQuery = (code: string) =>
  queryOptions({
    queryKey: rk.timeline(code),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/reservations/{code}/timeline", { ...path(code), signal }), (d) =>
        reservationEventsSchema.parse(d),
      ),
    staleTime: 30_000,
    retry: noRetryOnClientError,
  });

/** پیش‌نمایش پیامد لغو همین لحظه (رایگان یا دیرهنگام با خنک‌شدن) — هر بار تازه. */
export const cancelPreviewQuery = (code: string) =>
  queryOptions({
    queryKey: rk.cancelPreview(code),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/reservations/{code}/cancel-preview", { ...path(code), signal }), (d) =>
        cancelPreviewSchema.parse(d),
      ),
    staleTime: 0,
    gcTime: 0,
    retry: noRetryOnClientError,
  });

export type CreateBody = {
  unit_code: string;
  start: string;
  end: string;
  guests_count: number;
  guest_note?: string;
  expected_arrival?: string | null;
  vehicle_plate?: string;
};

/** ثبت رزرو با ‎Idempotency-Key‎: ضربهٔ دوباره یا تلاش دوباره پس از قطع شبکه، همان رزرو را برمی‌گرداند. */
export function createReservation(body: CreateBody, idempotencyKey: string) {
  return unwrap(
    api.POST("/api/v1/reservations", { body, params: { header: { "Idempotency-Key": idempotencyKey } } }),
    (d) => reservationSchema.parse(d),
  );
}

export function cancelReservation(code: string, body: { reason_kind: string; reason?: string }) {
  return unwrap(api.POST("/api/v1/reservations/{code}/cancel", { ...path(code), body }), (d) =>
    reservationSchema.parse(d),
  );
}

export function joinWaitlist(body: {
  unit_code?: string;
  start: string;
  end: string;
  guests_count: number;
  note?: string;
}) {
  return unwrap(api.POST("/api/v1/waitlist", { body }), (d) => waitlistEntrySchema.parse(d));
}

/** پروندهٔ تقویم (ICS) — نشانی هم‌مبدأ؛ کوکی نشست همراه پیوند دانلود می‌رود. */
export const reservationIcsHref = (code: string) => `/api/v1/reservations/${encodeURIComponent(code)}/calendar.ics`;

/** بیرون کشیدن پیشنهادهای جایگزین و تخلف‌ها از بدنهٔ Problem Details خطای ثبت (۴۰۹/۴۲۲). */
export function problemExtras(error: unknown): { alternatives: Alternative[]; violations: Violation[] } {
  if (!(error instanceof ApiError) || typeof error.body !== "object" || error.body === null) {
    return { alternatives: [], violations: [] };
  }
  const body = error.body as { alternatives?: unknown; violations?: unknown };
  const alternatives = Array.isArray(body.alternatives)
    ? body.alternatives.flatMap((a) => {
        const p = alternativeSchema.safeParse(a);
        return p.success ? [p.data] : [];
      })
    : [];
  const violations = Array.isArray(body.violations)
    ? body.violations.flatMap((v) => {
        const p = violation.safeParse(v);
        return p.success ? [p.data] : [];
      })
    : [];
  return { alternatives, violations };
}

/* ── نظرسنجی پس از اقامت (پیوند امضاشده؛ بی‌نیاز از نشست) ───────────────── */
export const feedbackStateSchema = z.object({
  state: z.enum(["open", "submitted", "closed"]),
  reason: z.string(),
  rating_labels: z.record(z.string(), z.string()),
  subscores: z._default(z.array(z.object({ field: z.string(), label: z.string() })), []),
  comment_max_length: z.number(),
});
export type FeedbackState = z.infer<typeof feedbackStateSchema>;

/** ‎feedback_url‎ رزرو («/feedback/<token>/») ⇒ توکن؛ نشانی ناشناخته ⇒ ‎null‎. */
export function feedbackToken(url: string | null | undefined): string | null {
  const m = url ? /\/feedback\/([^/?#]+)\/?/.exec(url) : null;
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

export const feedbackStateQuery = (token: string) =>
  queryOptions({
    queryKey: ["me", "feedback", token] as const,
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/feedback/{token}", { params: { path: { token } }, signal }), (d) =>
        feedbackStateSchema.parse(d),
      ),
    staleTime: 60_000,
    retry: noRetryOnClientError,
  });

export type FeedbackBody = {
  rating: number;
  comment?: string;
  would_recommend?: boolean | null;
  scores?: Record<string, number | null>;
};

export function submitFeedback(token: string, body: FeedbackBody) {
  return unwrap(api.POST("/api/v1/feedback/{token}", { params: { path: { token } }, body }), (d) =>
    feedbackStateSchema.parse(d),
  );
}
