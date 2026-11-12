import type { Reservation, ReservationStatus, StayPhase } from "@/shared/api/schemas";
import { formatClock, formatDayLabel, tehranToday } from "@/shared/lib/fa";

/**
 * فاز زندهٔ اقامت — یک منبع حقیقت برای «فعال بودن» در همهٔ صفحه‌ها.
 *
 * وضعیت پرونده (تأییدشده/پذیرش‌شده) به‌تنهایی نمی‌گوید اقامت تمام شده یا نه: پرونده را پذیرش
 * می‌بندد (یا زمان‌بند، چند ساعت پس از پایان). پس «فعال» = پروندهٔ باز **و** اقامتی که هنوز تمام
 * نشده؛ هم‌معنا با سقف رزرو فعال بک‌اند (‎selectors.active_count‎).
 *
 * ‎now = 0‎ (پیش‌رندر و لحظهٔ hydration) ⇒ فاز لحظهٔ پاسخ سرور.
 */
const OPEN: ReadonlySet<ReservationStatus> = new Set(["hold", "confirmed", "checked_in"]);

type PhaseInput = Pick<Reservation, "status" | "start" | "end" | "phase">;

export function stayPhaseOf(r: PhaseInput, now: number): StayPhase {
  if (!OPEN.has(r.status ?? "confirmed")) return "closed";
  if (!now) return r.phase;
  if (now < Date.parse(r.start)) return "upcoming";
  if (now < Date.parse(r.end)) return "ongoing";
  return "settling";
}

/** پروندهٔ باز با اقامتی که هنوز تمام نشده (پیش رو یا در جریان). */
export function isLiveStay(r: PhaseInput, now: number): boolean {
  const phase = stayPhaseOf(r, now);
  return phase === "upcoming" || phase === "ongoing";
}

/** اقامت تمام شده ولی پرونده هنوز باز است (پذیرش تخلیه/عدم‌حضور را ثبت نکرده). */
export function isSettling(r: PhaseInput, now: number): boolean {
  return stayPhaseOf(r, now) === "settling";
}

/**
 * زمان گشایش دفتر دل‌نوشته برای پروندهٔ در حال بستن:
 * «امروز ساعت ۱۸:۳۰» / «فردا ساعت ۰۲:۰۰» / «۵ آبان، ساعت …» — یا ‎null‎ اگر سرور زمانی نداده یا گذشته.
 */
export function settleMoment(r: Pick<Reservation, "settles_at">, now: number): string | null {
  if (!r.settles_at) return null;
  const at = Date.parse(r.settles_at);
  if (!Number.isFinite(at) || (now && at <= now)) return null;
  const clock = formatClock(r.settles_at);
  if (!now) return `ساعت ${clock}`;
  const today = tehranToday(new Date(now));
  const day = tehranToday(new Date(at));
  if (day === today) return `امروز ساعت ${clock}`;
  const tomorrow = tehranToday(new Date(now + 86_400_000));
  if (day === tomorrow) return `فردا ساعت ${clock}`;
  return `${formatDayLabel(day)}، ساعت ${clock}`;
}

/** برچسب و لحن نشان وضعیت با درنظرگرفتن فاز (پروندهٔ «تأییدشده»ٔ گذشته، «تأییدشده» خوانده نمی‌شود). */
export function statusBadge(
  r: PhaseInput & Pick<Reservation, "status_label">,
  now: number,
): { label: string; settling: boolean } {
  if (isSettling(r, now)) return { label: "پایان اقامت · در حال بستن پرونده", settling: true };
  return { label: r.status_label, settling: false };
}
