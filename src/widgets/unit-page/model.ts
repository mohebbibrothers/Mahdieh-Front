import { cellAt, type Period, type UnitTimeline } from "@/entities/slot/timeline";
import type { CalendarCell, Standing } from "@/shared/api/schemas";
import { addDays } from "@/shared/lib/fa";
import { slotState, type SlotState } from "@/widgets/calendar-page/model";
import type { Availability, Clock, Trip } from "@/widgets/units-page/model";

/**
 * منطق خالص صفحهٔ «جزئیات واحد» (P-03) — بی React، با آزمون واحد.
 *
 * داده‌ها همه از سرورند: جزئیات واحد (‎/units/{code}‎)، ساختار طبقات (‎/property‎)، ماتریس نیم‌روزها
 * (‎/calendar‎)، نخستین بازهٔ آزاد (‎/calendar/windows‎)، وضعیت حساب (‎/me/standing‎) و بررسی شخصی
 * (‎/reservations/quote‎). این‌جا فقط ترکیب آن‌ها برای نمایش و «کنش اصلی» صفحه است؛ حکم نهایی همیشه
 * با ثبت رزرو در P-05.
 */

/** کد واحد در نشانی ‎/units/A1/‎ — همان الگوی نگهبان بک‌اند (‎[A-Za-z0-9_-]{1,32}‎). */
export const UNIT_PATH = /^\/units\/([A-Za-z0-9_-]{1,32})\/?$/;

/** کد واحد از مسیر؛ «‎_‎» (قالب مشترک صادرشده) یا مسیر نامعتبر ⇒ ‎null‎. */
export function codeFromPath(pathname: string): string | null {
  const m = UNIT_PATH.exec(pathname);
  const raw = m?.[1];
  return raw && raw !== "_" ? raw.toUpperCase() : null;
}

/* ── هفتهٔ تقویم واحد ─────────────────────────────────────────────────── */

export const WEEK = 7;

/** نخستین روز هفتهٔ نمایش: روز سفر (اگر هست) وگرنه امروز؛ هرگز پیش از امروز یا بیرون از افق. */
export function weekStart(day: string | null, today: string, horizonDays: number): string {
  const max = addDays(today, Math.max(0, horizonDays - WEEK + 1));
  if (!day || day < today) return today;
  return day > max ? max : day;
}

export function shiftWeek(from: string, step: number, today: string, horizonDays: number): string {
  return weekStart(addDays(from, step * WEEK), today, horizonDays);
}

export const weekDays = (from: string): string[] => Array.from({ length: WEEK }, (_, i) => addDays(from, i));

/** نیم‌روزهای بازهٔ سفر در ردیف واحد (برای برجسته‌کردن در جدول هفته)؛ بی‌تاریخ ⇒ تهی. */
export function selectionIndexes(row: UnitTimeline | undefined, trip: Trip): Set<number> {
  if (!row || !trip.day) return new Set();
  const first = cellAt(row, trip.day, trip.period);
  if (!first) return new Set();
  return new Set(Array.from({ length: trip.cells }, (_, i) => first.index + i));
}

export type SlotView = {
  cell: CalendarCell;
  state: SlotState;
  selected: boolean;
  /** نیم‌روز انتخاب‌شده‌ای که آزاد نیست (مانع همان بازه) */
  conflict: boolean;
  /** نخستین نیم‌روز بازهٔ سفر */
  start: boolean;
  /** قابل انتخاب به‌عنوان آغاز؟ (گذشته و بیرون از افق ⇒ خیر) */
  pickable: boolean;
};

export function slotView(cell: CalendarCell, clock: Clock, selected: Set<number>, startIndex: number | null): SlotView {
  const state = slotState(cell, clock);
  const isSelected = selected.has(cell.index);
  return {
    cell,
    state,
    selected: isSelected,
    conflict: isSelected && state !== "free",
    start: cell.index === startIndex,
    pickable: state !== "past" && state !== "beyond",
  };
}

/* ── وضعیت حساب و کنش اصلی ────────────────────────────────────────────── */

export type AccountGate =
  | { kind: "guest" }
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "profile" }
  | { kind: "active"; limit: number }
  | { kind: "cooldown"; until: string }
  | { kind: "suspended"; until: string }
  | { kind: "quota"; message: string };

/** وضعیت حساب از ‎/me/standing‎ — به ترتیب اهمیت برای زائر (محرومیت، رزرو فعال، فاصله، سهمیه، پروفایل). */
export function accountGate(signedIn: boolean, standing: Standing | undefined, now: number): AccountGate {
  if (!signedIn) return { kind: "guest" };
  if (!standing) return { kind: "loading" };
  const future = (iso: string | null): iso is string => Boolean(iso && Date.parse(iso) > now);
  if (future(standing.suspended_until)) return { kind: "suspended", until: standing.suspended_until };
  if (standing.active.remaining <= 0) return { kind: "active", limit: standing.active.limit };
  if (future(standing.cooldown_until)) return { kind: "cooldown", until: standing.cooldown_until };
  if (standing.window.remaining <= 0 || standing.year.remaining <= 0) {
    const blocker = standing.blockers.find((b) => /quota|cells|window|year/i.test(b.code)) ?? standing.blockers[0];
    return { kind: "quota", message: blocker?.message ?? "سهمیهٔ نیم‌روزهای شما در این دوره تکمیل شده است." };
  }
  if (!standing.profile_complete) return { kind: "profile" };
  return { kind: "ok" };
}

export type MainAction = {
  label: string;
  /** continue: پنجرهٔ تحویل به P-05 · time: شرایط سفر · switch: فهرست واحدها · none: غیرفعال */
  kind: "continue" | "time" | "switch" | "none";
  disabled: boolean;
};

export type ActionInput = {
  capacity: number;
  /** بزرگ‌ترین ظرفیت میان همهٔ واحدها (برای «واحد بزرگ‌تر ببینم») */
  maxCapacity: number;
  trip: Trip;
  availability: Availability;
  online: boolean;
  /** داده‌های زمان دریافت نشده یا در حال تازه‌شدن پس از تغییر سفر */
  timesReady: boolean;
  gate: AccountGate;
  /** بررسی شخصی سرور برای بازهٔ آزاد: ‎false‎ ⇒ قاعده‌ای مانع است */
  quoteAllowed: boolean | null;
};

/** کنش اصلی پنل رزرو (همان ترتیب طراح: اتصال ⇒ حساب ⇒ ظرفیت ⇒ زمان ⇒ آزادی ⇒ ادامه). */
export function mainAction(i: ActionInput): MainAction {
  if (!i.online) return { label: "نیازمند اتصال", kind: "none", disabled: true };
  if (i.gate.kind === "active") return { label: "یک رزرو فعال دارید", kind: "none", disabled: true };
  if (i.gate.kind === "cooldown" || i.gate.kind === "suspended" || i.gate.kind === "quota") {
    return { label: "فعلاً امکان ادامه نیست", kind: "none", disabled: true };
  }
  if (i.trip.guests > i.capacity) {
    return i.maxCapacity >= i.trip.guests
      ? { label: "واحد بزرگ‌تر ببینم", kind: "switch", disabled: false }
      : { label: "تغییر تعداد همسفران", kind: "time", disabled: false };
  }
  if (!i.trip.day) return { label: "انتخاب زمان اقامت", kind: "time", disabled: false };
  if (!i.timesReady) return { label: "نیازمند بررسی زمان‌ها", kind: "none", disabled: true };
  if (i.availability.kind !== "free") return { label: "بازهٔ دیگری بررسی کنیم", kind: "time", disabled: false };
  if (i.quoteAllowed === false) return { label: "این بازه برای حساب شما ممکن نیست", kind: "none", disabled: true };
  return {
    label: i.gate.kind === "profile" ? "ادامه و تکمیل پروفایل" : "ادامه با این انتخاب",
    kind: "continue",
    disabled: false,
  };
}

/* ── واحدهای مرتبط ────────────────────────────────────────────────────── */

type Relatable = { code: string; floor_number: number; capacity_total: number };

/** دو واحد دیگر: هم‌طبقه‌ها اول، سپس آن‌ها که گروه فعلی را جا می‌دهند، سپس ترتیب ثبت. */
export function relatedUnits<T extends Relatable>(all: T[], current: Relatable, guests: number, limit = 2): T[] {
  return all
    .filter((u) => u.code !== current.code)
    .map((u, order) => ({ u, order }))
    .sort(
      (a, b) =>
        Number(b.u.floor_number === current.floor_number) - Number(a.u.floor_number === current.floor_number) ||
        Number(b.u.capacity_total >= guests) - Number(a.u.capacity_total >= guests) ||
        a.order - b.order,
    )
    .slice(0, limit)
    .map((x) => x.u);
}

/* ── تصاویر ───────────────────────────────────────────────────────────── */

export type MediaView = "space" | "plan" | "photos";

type PhotoLike = { url: string | null; alt_text: string; is_cover: boolean; sort_order: number };

/** فقط تصاویر با نشانی امن (http/https یا نسبی همین دامنه)؛ شاخص اول، سپس ترتیب نمایش پنل. */
export function usablePhotos<T extends PhotoLike>(photos: T[], base: string): Array<T & { src: string }> {
  return photos
    .flatMap((p) => {
      if (!p.url) return [];
      try {
        const u = new URL(p.url, base);
        return u.protocol === "https:" || u.protocol === "http:" ? [{ ...p, src: u.href }] : [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
}

/** ساعت آغاز هر نوبت به قالب «۰۸:۰۰» بر پایهٔ شبکهٔ سرور. */
export function periodHour(period: Period, clock: Pick<Clock, "gridStartHour" | "cellHours">): number {
  return period === "day" ? clock.gridStartHour : (clock.gridStartHour + clock.cellHours) % 24;
}
