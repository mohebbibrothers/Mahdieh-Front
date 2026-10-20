import * as z from "zod/mini";
import type { components } from "./schema";

/**
 * اعتبارسنجی زمان اجرا در مرز API (API-04): نوع‌های تولیدی از OpenAPI فقط زمان کامپایل‌اند؛
 * zod تضمین می‌کند پاسخ واقعی همان است. ‎`satisfies`‎ هم‌خوانی طرحِ zod با OpenAPI را
 * در زمان کامپایل قفل می‌کند (هر تغییر قرارداد بک‌اند ⇒ خطای typecheck).
 */
type S = components["schemas"];

export const cellStatus = z.enum(["free", "occupied", "buffer", "blocked", "past"]);
export type CellStatus = z.infer<typeof cellStatus>;

const calendarCell = z.object({
  index: z.int(),
  kind: z.enum(["day", "night"]),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  status: cellStatus,
  detail: z.string(),
}) satisfies z.ZodMiniType<S["CalendarCell"]>;

const calendarUnit = z.object({
  code: z.string(),
  title: z.string(),
  floor_number: z.int(),
  unit_type: z.string(),
  capacity_total: z.int(),
  cells: z.array(calendarCell),
}) satisfies z.ZodMiniType<S["CalendarUnit"]>;

const calendarDay = z.object({
  day: z.string(),
  date_jalali: z.string(),
  weekday: z.string(),
  is_weekend: z.boolean(),
  demand_level: z.string(),
  occupancy_rate: z.number(),
  free_cells: z.int(),
  total_cells: z.int(),
  units: z.array(calendarUnit),
}) satisfies z.ZodMiniType<S["CalendarDay"]>;

export const calendarSchema = z.object({
  days: z.array(calendarDay),
  max_cells: z.int(),
  min_cells: z.int(),
  horizon_days: z.int(),
  lattice: z.record(z.string(), z.number()),
}) satisfies z.ZodMiniType<S["Calendar"]>;
export type Calendar = z.infer<typeof calendarSchema>;
export type CalendarCell = z.infer<typeof calendarCell>;

const unitFeature = z.object({
  code: z.string(),
  title: z.string(),
  icon: z.exactOptional(z.string()),
  is_highlight: z.exactOptional(z.boolean()),
}) satisfies z.ZodMiniType<S["UnitFeature"]>;

const unit = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  unit_type: z.enum(["suite", "large_room"]),
  type_label: z.string(),
  floor_number: z.int(),
  capacity_adults: z.exactOptional(z.int()),
  capacity_children: z.exactOptional(z.int()),
  capacity_total: z.int(),
  cleaning_buffer_minutes: z.exactOptional(z.nullable(z.int())),
  features: z.array(unitFeature),
}) satisfies z.ZodMiniType<S["Unit"]>;
export type Unit = z.infer<typeof unit>;

export const propertySchema = z.array(
  z.object({
    number: z.int(),
    title: z.string(),
    description: z.exactOptional(z.string()),
    accessibility_notes: z.exactOptional(z.string()),
    units: z.array(unit),
  }) satisfies z.ZodMiniType<S["Floor"]>,
);
export type Floor = z.infer<typeof propertySchema>[number];

const policy = z.object({ key: z.string(), value: z.unknown(), label: z.string(), description: z.string() });
export const configSchema = z.object({
  schema_version: z.number(),
  site: z.object({
    name: z.string(),
    timezone: z.string(),
    support_phone: z.string(),
    support_address: z.string(),
  }),
  features: z.record(z.string(), z.boolean()),
  auth: z.record(z.string(), z.number()),
  lattice: z.record(z.string(), z.number()),
  policies: z.array(policy),
  units: z.array(z.record(z.string(), z.unknown())),
  provinces: z.array(z.record(z.string(), z.unknown())),
  countries: z.array(z.record(z.string(), z.unknown())),
  labels: z.record(z.string(), z.unknown()),
  status_groups: z.record(z.string(), z.unknown()),
}) satisfies z.ZodMiniType<S["Config"]>;
export type SiteConfig = z.infer<typeof configSchema>;

export const occasionsSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(["holiday", "religious", "seasonal", "custom"]),
    date_gregorian: z.string(),
    date_jalali: z.exactOptional(z.string()),
    demand_level: z.exactOptional(z.enum(["normal", "high", "peak"])),
    description: z.exactOptional(z.string()),
    is_peak: z.boolean(),
  }) satisfies z.ZodMiniType<S["Occasion"]>,
);
export type Occasion = z.infer<typeof occasionsSchema>[number];

export const profileSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  phone_masked: z.string(),
  is_profile_complete: z.boolean(),
  is_staff_member: z.boolean(),
  role: z.string(),
  city: z.string(),
  date_joined: z.string(),
  id_document_type: z.enum(["national_id", "passport"]),
  national_id_masked: z.string(),
  nationality: z.string(),
  nationality_title: z.string(),
  province: z.string(),
  province_title: z.string(),
}) satisfies z.ZodMiniType<S["Profile"]>;
export type Profile = z.infer<typeof profileSchema>;

export const sessionStateSchema = z.object({
  authenticated: z.boolean(),
  profile: z.nullable(profileSchema),
  mfa_pending: z.boolean(),
}) satisfies z.ZodMiniType<S["SessionState"]>;
export type SessionState = z.infer<typeof sessionStateSchema>;

const quota = z.object({
  limit: z.number(),
  remaining: z.number(),
  used: z.number(),
  window_days: z.nullable(z.number()),
}) satisfies z.ZodMiniType<S["Quota"]>;
const violation = z.object({ code: z.string(), message: z.string() }) satisfies z.ZodMiniType<S["Violation"]>;
export const standingSchema = z.object({
  can_book: z.boolean(),
  profile_complete: z.boolean(),
  blockers: z.array(violation),
  active: quota,
  window: quota,
  year: quota,
  cooldown_until: z.nullable(z.string()),
  next_eligible_at: z.nullable(z.string()),
  suspended_until: z.nullable(z.string()),
}) satisfies z.ZodMiniType<S["Standing"]>;
export type Standing = z.infer<typeof standingSchema>;

const reservation = z.object({
  id: z.string(),
  code: z.string(),
  status: z.exactOptional(
    z.enum([
      "hold",
      "confirmed",
      "checked_in",
      "completed",
      "cancelled_by_guest",
      "cancelled_by_staff",
      "no_show",
      "expired",
      "superseded",
    ]),
  ),
  status_label: z.string(),
  is_active: z.boolean(),
  unit_code: z.string(),
  unit_title: z.string(),
  floor_number: z.int(),
  start: z.string(),
  end: z.string(),
  date_jalali: z.string(),
  weekday: z.string(),
  cells_count: z.int(),
  duration_label: z.string(),
  guests_count: z.int(),
  can_cancel: z.boolean(),
  free_cancel_until: z.string(),
  created_at: z.string(),
  guest_note: z.exactOptional(z.string()),
}) satisfies z.ZodMiniType<S["Reservation"]>;
export const reservationListSchema = z.object({
  results: z.array(reservation),
  meta: z.record(z.string(), z.unknown()),
});
export type Reservation = z.infer<typeof reservation>;

const alternative = z.object({
  date_jalali: z.string(),
  start: z.string(),
  end: z.string(),
  unit_code: z.string(),
  unit_title: z.string(),
  floor_number: z.int(),
  is_same_unit: z.boolean(),
}) satisfies z.ZodMiniType<S["Alternative"]>;
export const quoteSchema = z.object({
  allowed: z.boolean(),
  is_available: z.boolean(),
  alternatives: z.array(alternative),
  violations: z.array(violation),
  notes: z.array(z.string()),
  cells: z.int(),
  capacity_total: z.int(),
  guests_count: z.int(),
  duration_label: z.string(),
  start: z.nullable(z.string()),
  end: z.nullable(z.string()),
  unit: z.object({ code: z.string(), title: z.string() }),
}) satisfies z.ZodMiniType<S["Quote"]>;
export type Quote = z.infer<typeof quoteSchema>;

const helpItem = z.object({
  slug: z.string(),
  question: z.string(),
  answer: z.string(),
  steps: z._default(z.array(z.string()), []),
  tags: z._default(z.array(z.string()), []),
  action: z.exactOptional(z.nullable(z.object({ label: z.string(), target: z.string() }))),
  related: z._default(z.array(z.string()), []),
});
export const helpSchema = z.object({
  categories: z.array(
    z.object({ slug: z.string(), title: z.string(), icon: z.string(), summary: z.string(), items: z.array(helpItem) }),
  ),
  quick_steps: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string(), target: z.string() })),
  contact: z.record(z.string(), z.string()),
  note: z.string(),
});
export type Help = z.infer<typeof helpSchema>;
export type HelpItem = z.infer<typeof helpItem>;

export const metaSchema = z.object({
  service: z.string(),
  environment: z.string(),
  schema_version: z.string(),
  today_jalali: z.string(),
  timezone: z.string(),
  contact: z.exactOptional(z.nullable(z.object({ phone: z.string(), address: z.string() }))),
}) satisfies z.ZodMiniType<S["Meta"]>;

export const verificationSchema = z.object({
  valid: z.boolean(),
  crypto_valid: z.boolean(),
  mismatch: z.boolean(),
  error: z.string(),
  checked_at: z.string(),
  reservation_status: z.nullable(z.string()),
  payload: z.record(z.string(), z.unknown()),
}) satisfies z.ZodMiniType<S["CertificateVerification"]>;
export type Verification = z.infer<typeof verificationSchema>;

export const otpRequestResultSchema = z.object({
  expires_in: z.number(),
  resend_after: z.number(),
  delivery_status: z.string(),
}) satisfies z.ZodMiniType<S["OtpRequestResult"]>;
export type OtpRequestResult = z.infer<typeof otpRequestResultSchema>;

export const sessionResultSchema = z.object({
  profile: profileSchema,
  is_new_user: z.boolean(),
  next_step: z.enum(["complete_profile", "home"]),
}) satisfies z.ZodMiniType<S["SessionResult"]>;
export type SessionResult = z.infer<typeof sessionResultSchema>;
