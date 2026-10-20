import type { SiteConfig } from "./schemas";

/** خواندن نوع‌دار سیاست‌های زندهٔ بک‌اند (کلیدها از ‎/api/v1/config‎). */
export type Policies = {
  maxCells: number;
  minCells: number;
  horizonDays: number;
  minLeadHours: number;
  maxActive: number;
  cellsPerWindow: number;
  windowDays: number;
  cellsPerYear: number;
  cancelFreeHours: number;
  lateCancelCooldownHours: number;
  minGapHours: number;
  checkinEarlyHours: number;
  bufferMinutes: number;
  noShowGraceHours: number;
  noShowSuspensionDays: number;
  waitlistOfferMinutes: number;
  waitlistEnabled: boolean;
};

/** مقادیر پیش‌فرض = پیش‌فرض‌های بک‌اند؛ فقط تا رسیدن پاسخ ‎/config‎ به کار می‌روند. */
export const DEFAULT_POLICIES: Policies = {
  maxCells: 14,
  minCells: 1,
  horizonDays: 90,
  minLeadHours: 2,
  maxActive: 1,
  cellsPerWindow: 14,
  windowDays: 30,
  cellsPerYear: 60,
  cancelFreeHours: 24,
  lateCancelCooldownHours: 24,
  minGapHours: 24,
  checkinEarlyHours: 12,
  bufferMinutes: 0,
  noShowGraceHours: 6,
  noShowSuspensionDays: 7,
  waitlistOfferMinutes: 30,
  waitlistEnabled: true,
};

export function readPolicies(config: SiteConfig | undefined): Policies {
  if (!config) return DEFAULT_POLICIES;
  const map = new Map(config.policies.map((p) => [p.key, p.value]));
  const num = (key: string, fallback: number) => {
    const v = map.get(key);
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const bool = (key: string, fallback: boolean) => {
    const v = map.get(key);
    return typeof v === "boolean" ? v : fallback;
  };
  const d = DEFAULT_POLICIES;
  return {
    maxCells: num("reservation.max_cells", d.maxCells),
    minCells: num("reservation.min_cells", d.minCells),
    horizonDays: num("reservation.booking_horizon_days", d.horizonDays),
    minLeadHours: num("reservation.min_lead_time_hours", d.minLeadHours),
    maxActive: num("reservation.max_active_per_user", d.maxActive),
    cellsPerWindow: num("reservation.max_cells_per_window", d.cellsPerWindow),
    windowDays: num("reservation.cells_window_days", d.windowDays),
    cellsPerYear: num("reservation.max_cells_per_year", d.cellsPerYear),
    cancelFreeHours: num("reservation.cancel_free_before_hours", d.cancelFreeHours),
    lateCancelCooldownHours: num("reservation.late_cancel_cooldown_hours", d.lateCancelCooldownHours),
    minGapHours: num("reservation.min_gap_between_bookings_hours", d.minGapHours),
    checkinEarlyHours: num("reservation.checkin_early_hours", d.checkinEarlyHours),
    bufferMinutes: num("lattice.default_cleaning_buffer_minutes", d.bufferMinutes),
    noShowGraceHours: num("reservation.no_show_grace_hours", d.noShowGraceHours),
    noShowSuspensionDays: num("reservation.no_show_suspension_days", d.noShowSuspensionDays),
    waitlistOfferMinutes: num("waitlist.offer_window_minutes", d.waitlistOfferMinutes),
    waitlistEnabled: bool("waitlist.auto_offer_enabled", d.waitlistEnabled),
  };
}
