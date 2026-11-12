import { queryOptions } from "@tanstack/react-query";
import { z } from "zod/mini";
import { ApiError, api, toApiError, unwrap } from "./client";
import type { components } from "./schema";
import { reservationStatus, standingSchema, stayLifecycleShape } from "./schemas";

/**
 * میز پذیرش (P-06) — فقط کارکنانِ گذشته از سد عامل دوم.
 * همهٔ پاسخ‌ها با zod و نگهبان ‎satisfies‎ به قرارداد OpenAPI قفل‌اند تا هر تغییر بک‌اند همین‌جا
 * (در زمان کامپایل یا نخستین ‎parse‎) آشکار شود، نه وسط شیفت در دست خادم.
 * هیچ پاسخی شمارهٔ کامل تلفن ندارد؛ نمایش شماره فقط با ‎revealPhone‎ (تأیید تازه + هدف ثبت‌شده).
 */
type S = components["schemas"];

const nullableString = z.nullable(z.string());

export const deskFlagsSchema = z.object({
  lane: z.enum(["expected", "delayed", "checked_in", "overstay", "checked_out", "no_show", "cancelled"]),
  lane_label: z.string(),
  due_at: z.string(),
  due_label: z.string(),
  start_label: z.string(),
  end_label: z.string(),
  check_in_opens_at: z.string(),
  can_check_in: z.boolean(),
  can_check_out: z.boolean(),
  no_show_from: z.string(),
  can_no_show: z.boolean(),
  can_cancel: z.boolean(),
  can_move: z.boolean(),
  is_overstay: z.boolean(),
  guest_city: z.string(),
  guest_national_id_masked: z.string(),
  guest_document: z.string(),
  short_code: z.string(),
}) satisfies z.ZodMiniType<S["DeskFlags"]>;
export type DeskFlags = z.infer<typeof deskFlagsSchema>;
export type Lane = DeskFlags["lane"];

const staffReservationShape = {
  id: z.string(),
  code: z.string(),
  unit_code: z.string(),
  unit_title: z.string(),
  floor_number: z.int(),
  status: z.exactOptional(reservationStatus),
  status_label: z.string(),
  is_active: z.boolean(),
  start: z.string(),
  end: z.string(),
  date_jalali: z.string(),
  weekday: z.string(),
  cells_count: z.int(),
  duration_label: z.string(),
  guests_count: z.int(),
  guest_note: z.exactOptional(z.string()),
  expected_arrival: nullableString,
  vehicle_plate: z.string(),
  can_cancel: z.boolean(),
  free_cancel_until: z.string(),
  hold_expires_at: nullableString,
  feedback_url: nullableString,
  feedback_rating: z.nullable(z.int()),
  is_late_cancel: z.boolean(),
  details_editable: z.boolean(),
  created_at: z.string(),
  guest_id: z.string(),
  guest_name: z.string(),
  guest_phone_masked: z.string(),
  guest_nationality: z.string(),
  staff_note: z.exactOptional(z.string()),
  source: z.exactOptional(z.enum(["web", "phone", "desk", "admin", "waitlist"])),
  source_label: z.string(),
  version: z.exactOptional(z.int()),
  superseded_by_code: z.nullable(z.string()),
  cancelled_at: z.exactOptional(nullableString),
  cancel_reason_kind: z.exactOptional(
    z.enum(["guest_request", "maintenance", "overbooking", "duplicate", "no_show", "other", ""]),
  ),
  cancel_reason: z.exactOptional(z.string()),
  ...stayLifecycleShape,
  no_show_at: z.exactOptional(nullableString),
};

export const staffReservationSchema = z.object(staffReservationShape) satisfies z.ZodMiniType<S["StaffReservation"]>;
export type StaffReservation = z.infer<typeof staffReservationSchema>;

export const deskRowSchema = z.object({ ...staffReservationShape, desk: deskFlagsSchema }) satisfies z.ZodMiniType<
  S["DeskRow"]
>;
export type DeskRow = z.infer<typeof deskRowSchema>;

const deskBlock = z.object({
  id: z.string(),
  kind: z.string(),
  kind_label: z.string(),
  reason: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  ends_label: z.string(),
}) satisfies z.ZodMiniType<S["DeskBlock"]>;
export type DeskBlock = z.infer<typeof deskBlock>;

const housekeepingTask = z.object({
  id: z.string(),
  assignee: z.string(),
  note: z.string(),
  reservation_code: z.string(),
  started_at: z.string(),
  started_label: z.string(),
  due_at: z.string(),
  due_label: z.string(),
  percent: z.int(),
  overdue: z.boolean(),
  remaining_minutes: z.int(),
}) satisfies z.ZodMiniType<S["Housekeeping"]>;
export type HousekeepingTask = z.infer<typeof housekeepingTask>;

export const unitState = z.enum(["occupied", "expected", "ready", "buffer", "maintenance"]);
export type UnitState = z.infer<typeof unitState>;
export const keyLocation = z.enum(["guest", "cabinet", "housekeeping", "facilities"]);
export type KeyLocation = z.infer<typeof keyLocation>;

export const deskUnitSchema = z.object({
  code: z.string(),
  title: z.string(),
  type_label: z.string(),
  floor_number: z.int(),
  floor_title: z.string(),
  capacity_adults: z.int(),
  capacity_children: z.int(),
  capacity_total: z.int(),
  state: unitState,
  state_label: z.string(),
  key_location: keyLocation,
  key_label: z.string(),
  current: z.nullable(deskRowSchema),
  arrival: z.nullable(deskRowSchema),
  block: z.nullable(deskBlock),
  housekeeping: z.nullable(housekeepingTask),
}) satisfies z.ZodMiniType<S["DeskUnit"]>;
export type DeskUnit = z.infer<typeof deskUnitSchema>;

const deskEvent = z.object({
  at: z.string(),
  clock: z.string(),
  kind: z.string(),
  text: z.string(),
  actor: z.string(),
  unit_code: z.string(),
  reservation_code: z.string(),
  tone: z.enum(["neutral", "success", "info", "warning", "danger"]),
}) satisfies z.ZodMiniType<S["DeskEvent"]>;
export type DeskEvent = z.infer<typeof deskEvent>;

const choice = z.object({ value: z.string(), label: z.string() }) satisfies z.ZodMiniType<S["ChoiceItem"]>;
export type Choice = z.infer<typeof choice>;

export const deskSchema = z.object({
  now: z.string(),
  day: z.string(),
  day_label: z.string(),
  shift: z.object({
    slot: z.enum(["morning", "night"]),
    label: z.string(),
    hours_label: z.string(),
    starts_at: z.string(),
    ends_at: z.string(),
    report_from: z.string(),
    report_to: z.string(),
  }),
  officer: z.object({
    display_name: z.string(),
    initials: z.string(),
    role: z.string(),
    role_label: z.string(),
    is_manager: z.boolean(),
  }),
  mfa: z.object({
    verified: z.boolean(),
    method: z.string(),
    step_up_valid_until: nullableString,
    step_up_seconds: z.int(),
    recovery_codes_remaining: z.int(),
  }),
  units: z.array(deskUnitSchema),
  kpis: z.object({
    occupied: z.int(),
    ready: z.int(),
    buffer: z.int(),
    expected: z.int(),
    maintenance: z.int(),
    guests_in_house: z.int(),
    arrivals_pending: z.int(),
    delayed: z.int(),
    departures_today: z.int(),
    checked_in_today: z.int(),
  }),
  ledger: z.array(deskRowSchema),
  events: z.array(deskEvent),
  waitlist: z.object({ waiting: z.int(), offered: z.int(), open_offers: z.int(), expiring_soon: z.int() }),
  rules: z.object({ checkin_early_hours: z.int(), no_show_grace_hours: z.int(), late_minutes: z.int() }),
  housekeeping: z.object({
    presets: z.array(z.int()),
    default_minutes: z.int(),
    min_minutes: z.int(),
    max_minutes: z.int(),
    suggestions: z.array(z.string()),
  }),
  block_kinds: z.array(choice),
  cancel_reasons: z.array(choice),
  poll_seconds: z.int(),
}) satisfies z.ZodMiniType<S["Desk"]>;
export type Desk = z.infer<typeof deskSchema>;

export const lookupSchema = z.object({
  kind: z.enum(["empty", "certificate", "code", "short_code", "national_id", "query"]),
  kind_label: z.string(),
  matches: z.array(deskRowSchema),
  certificate: z.nullable(
    z.object({ valid: z.boolean(), crypto_valid: z.boolean(), mismatch: z.boolean(), error: z.string() }),
  ),
}) satisfies z.ZodMiniType<S["DeskLookup"]>;
export type Lookup = z.infer<typeof lookupSchema>;

export const unitResponse = z.object({ unit: deskUnitSchema }) satisfies z.ZodMiniType<S["DeskUnitResponse"]>;

const guestRow = z.object({
  id: z.string(),
  display_name: z.string(),
  phone_masked: z.string(),
  nationality: z.string(),
  nationality_title: z.string(),
  province_title: z.string(),
  city: z.string(),
  is_profile_complete: z.boolean(),
  reservations_count: z.int(),
  no_show_count: z.int(),
  last_stay_end: nullableString,
  date_joined: z.string(),
}) satisfies z.ZodMiniType<S["GuestRow"]>;

export const guestDetailSchema = z.object({
  guest: guestRow,
  national_id_masked: z.string(),
  id_document_type: z.string(),
  standing: standingSchema,
  recent_reservations: z.array(staffReservationSchema),
}) satisfies z.ZodMiniType<S["GuestDetail"]>;
export type GuestDetail = z.infer<typeof guestDetailSchema>;

const staffEvent = z.object({
  id: z.string(),
  kind: z.enum([
    "created",
    "confirmed",
    "cancelled",
    "moved",
    "checked_in",
    "checked_out",
    "no_show",
    "expired",
    "settled",
    "note",
    "details",
  ]),
  kind_label: z.string(),
  from_status: z.exactOptional(z.string()),
  to_status: z.exactOptional(z.string()),
  at: z.string(),
  actor_label: z.exactOptional(z.string()),
  reason: z.exactOptional(z.string()),
  metadata: z.exactOptional(z.unknown()),
});
export const staffEventsSchema = z.object({ results: z.array(staffEvent) });
export type StaffEvent = z.infer<typeof staffEvent>;

const staffOffer = z.object({
  id: z.string(),
  status: z.string(),
  unit_code: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  expires_at: z.string(),
  seconds_left: z.int(),
  entry_id: z.string(),
  guest_name: z.string(),
}) satisfies z.ZodMiniType<S["StaffOffer"]>;
export type StaffOffer = z.infer<typeof staffOffer>;

const staffQueueEntry = z.object({
  id: z.string(),
  status: z.string(),
  status_label: z.string(),
  unit_code: nullableString,
  unit_title: nullableString,
  starts_at: z.string(),
  ends_at: z.string(),
  cells_count: z.int(),
  guests_count: z.int(),
  offers_sent: z.int(),
  position: z.int(),
  created_at: z.string(),
  open_offer: z.nullable(
    z.object({
      id: z.string(),
      status: z.string(),
      unit_code: z.string(),
      starts_at: z.string(),
      ends_at: z.string(),
      expires_at: z.string(),
      seconds_left: z.int(),
      entry_id: z.string(),
    }),
  ),
  guest_id: z.string(),
  guest_name: z.string(),
  guest_phone_masked: z.string(),
}) satisfies z.ZodMiniType<S["StaffWaitlistEntry"]>;
export type StaffQueueEntry = z.infer<typeof staffQueueEntry>;

export const staffWaitlistSchema = z.object({
  queue: z.array(staffQueueEntry),
  open_offers: z.array(staffOffer),
  stats: z.object({
    waiting: z.int(),
    offered: z.int(),
    converted: z.int(),
    unfulfilled: z.int(),
    open_offers: z.int(),
    expiring_soon: z.int(),
    acceptance_rate: z.number(),
    next_offer: z.nullable(staffOffer),
  }),
  overview: z.object({
    waiting: z.int(),
    offered: z.int(),
    converted: z.int(),
    unfulfilled: z.int(),
    conversion_rate: z.number(),
  }),
}) satisfies z.ZodMiniType<S["StaffWaitlist"]>;
export type StaffWaitlist = z.infer<typeof staffWaitlistSchema>;

export const mfaStatusSchema = z.object({
  required: z.boolean(),
  enrolled: z.boolean(),
  verified: z.boolean(),
  verified_at: nullableString,
  step_up_valid_until: nullableString,
  step_up_seconds: z.int(),
  recovery_codes_remaining: z.int(),
  method: z.string(),
}) satisfies z.ZodMiniType<S["MfaStatus"]>;
export type MfaStatus = z.infer<typeof mfaStatusSchema>;

export const mfaEnrollmentSchema = z.object({
  secret: z.string(),
  secret_display: z.string(),
  otpauth_uri: z.string(),
  qr_svg: z.string(),
}) satisfies z.ZodMiniType<S["MfaEnrollment"]>;
export type MfaEnrollment = z.infer<typeof mfaEnrollmentSchema>;

// ── کلیدها و کوئری‌ها ────────────────────────────────────────────────────────
export const dk = {
  desk: ["staff", "desk"] as const,
  mfa: ["staff", "mfa"] as const,
  waitlist: ["staff", "waitlist"] as const,
  guest: (id: string) => ["staff", "guest", id] as const,
  events: (code: string) => ["staff", "events", code] as const,
};

/** ‎403‎ با این کدها یعنی «سد عامل دوم» — صفحه به‌جای خطا، دروازهٔ تأیید را نشان می‌دهد. */
export const isMfaGate = (e: unknown) =>
  e instanceof ApiError && e.status === 403 && (e.code === "mfa_required" || e.code === "mfa_enrollment_required");
export const isStepUp = (e: unknown) => e instanceof ApiError && e.status === 403 && e.code === "step_up_required";

const noRetryOnClientError = (count: number, e: Error) => count < 2 && !(e instanceof ApiError && e.status < 500);

export const deskQuery = queryOptions({
  queryKey: dk.desk,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/staff/desk", { signal }), (d) => deskSchema.parse(d)),
  retry: noRetryOnClientError,
  staleTime: 5_000,
});

export const mfaStatusQuery = queryOptions({
  queryKey: dk.mfa,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/auth/mfa/status", { signal }), (d) => mfaStatusSchema.parse(d)),
  retry: noRetryOnClientError,
  staleTime: 15_000,
});

export const staffWaitlistQuery = queryOptions({
  queryKey: dk.waitlist,
  queryFn: ({ signal }) => unwrap(api.GET("/api/v1/staff/waitlist", { signal }), (d) => staffWaitlistSchema.parse(d)),
  retry: noRetryOnClientError,
  staleTime: 10_000,
});

export const guestDetailQuery = (id: string) =>
  queryOptions({
    queryKey: dk.guest(id),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/staff/guests/{guest_id}", { params: { path: { guest_id: id } }, signal }), (d) =>
        guestDetailSchema.parse(d),
      ),
    retry: noRetryOnClientError,
    staleTime: 30_000,
  });

export const reservationEventsQuery = (code: string) =>
  queryOptions({
    queryKey: dk.events(code),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/v1/staff/reservations/{code}/events", { params: { path: { code } }, signal }), (d) =>
        staffEventsSchema.parse(d),
      ),
    retry: noRetryOnClientError,
    staleTime: 15_000,
  });

// ── کنش‌ها ───────────────────────────────────────────────────────────────────
export function lookup(q: string, signal?: AbortSignal) {
  return unwrap(
    api.GET("/api/v1/staff/desk/lookup", { params: { query: { q } }, ...(signal ? { signal } : {}) }),
    (d) => lookupSchema.parse(d),
  );
}

export type TransitionName = "check-in" | "check-out" | "no-show" | "note";
export function transition(code: string, action: TransitionName, body: S["TransitionRequestRequest"] = {}) {
  return unwrap(
    api.POST("/api/v1/staff/reservations/{code}/{action_name}", {
      params: { path: { code, action_name: action } },
      body,
    }),
    (d) => staffReservationSchema.parse(d),
  );
}

export function moveReservation(code: string, body: S["MoveRequest"]) {
  return unwrap(api.POST("/api/v1/staff/reservations/{code}/move", { params: { path: { code } }, body }), (d) =>
    staffReservationSchema.parse(d),
  );
}

export function cancelReservation(code: string, body: S["CancelRequest"]) {
  return unwrap(api.POST("/api/v1/reservations/{code}/cancel", { params: { path: { code } }, body }), () => null);
}

export function createStaffReservation(body: S["StaffReservationCreateRequest"]) {
  return unwrap(api.POST("/api/v1/staff/reservations/create", { body }), (d) => staffReservationSchema.parse(d));
}

export function startHousekeeping(code: string, body: S["HousekeepingStartRequest"]) {
  return unwrap(api.POST("/api/v1/staff/units/{code}/housekeeping", { params: { path: { code } }, body }), (d) =>
    unitResponse.parse(d),
  );
}

export function completeHousekeeping(code: string) {
  return unwrap(api.POST("/api/v1/staff/units/{code}/housekeeping/complete", { params: { path: { code } } }), (d) =>
    unitResponse.parse(d),
  );
}

export function createBlock(body: S["BlockCreateRequest"]) {
  return unwrap(api.POST("/api/v1/blocks", { body }), () => null);
}

export function removeBlock(id: string, reason: string) {
  return unwrap(
    api.POST("/api/v1/blocks/{block_id}/remove", { params: { path: { block_id: id } }, body: { reason } }),
    () => null,
  );
}

export type RevealPurpose = S["RevealPhoneRequest"]["purpose"];
export function revealPhone(guestId: string, purpose: RevealPurpose, note: string) {
  return unwrap(
    api.POST("/api/v1/staff/guests/{guest_id}/reveal-phone", {
      params: { path: { guest_id: guestId } },
      body: { purpose, note },
    }),
    (d) => z.object({ phone: z.string() }).parse(d),
  );
}

export function verifyMfa(code: string) {
  return unwrap(api.POST("/api/v1/auth/mfa/verify", { body: { code } }), (d) =>
    z.object({ method: z.enum(["totp", "recovery"]), status: mfaStatusSchema }).parse(d),
  );
}

export function setupTotp() {
  return unwrap(api.POST("/api/v1/auth/mfa/totp/setup"), (d) => mfaEnrollmentSchema.parse(d));
}

export function confirmTotp(code: string) {
  return unwrap(api.POST("/api/v1/auth/mfa/totp/confirm", { body: { code } }), (d) =>
    z.object({ recovery_codes: z.array(z.string()), status: mfaStatusSchema }).parse(d),
  );
}

export function regenerateRecoveryCodes() {
  return unwrap(api.POST("/api/v1/auth/mfa/recovery-codes/regenerate"), (d) =>
    z.object({ recovery_codes: z.array(z.string()) }).parse(d),
  );
}

/**
 * اکسل دفتر شیفت (همان کارپوشهٔ هفت‌برگی گزارش مدیریتی سرور). با ‎fetch‎ دریافت می‌شود نه پیوند خام،
 * تا خطای ‎403 step_up_required/manager_only‎ به پنجرهٔ تأیید تازه یا پیام فارسی برسد، نه صفحهٔ JSON خام.
 */
export async function downloadReport(from: string, to: string, phones: boolean): Promise<{ blob: Blob; name: string }> {
  const q = new URLSearchParams({ from, to, phones: phones ? "full" : "masked" });
  const r = await fetch(`/api/v1/staff/reports/reservations.xlsx?${q.toString()}`, {
    credentials: "same-origin",
    headers: { Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json" },
  });
  if (!r.ok) {
    const body: unknown = await r.json().catch(() => null);
    throw toApiError(r.status, body);
  }
  const disposition = r.headers.get("Content-Disposition") ?? "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  const name = star ? decodeURIComponent(star) : (plain ?? `mahdieh-shift-${from}.xlsx`);
  return { blob: await r.blob(), name };
}
