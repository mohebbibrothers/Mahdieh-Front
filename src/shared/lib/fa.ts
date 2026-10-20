/**
 * قالب‌بندی فارسی: ارقام فارسی، تاریخ خورشیدی و ساعت به افق تهران.
 * ایران از ۱۴۰۱ ساعت تابستانی ندارد ⇒ اختلاف ثابت ‎+03:30؛ اما همه‌جا از Intl با
 * timeZone صریح استفاده می‌کنیم تا به منطقهٔ زمانی دستگاه کاربر وابسته نباشیم.
 */
const TZ = "Asia/Tehran";
const FA = "fa-IR-u-ca-persian-nu-arabext";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function faDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}
const COUNT_WORDS = ["صفر", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده"];
/** شمار کوچک در متن روان به حروف («پنج واحد»، مثل طراح)؛ بزرگ‌تر از ده با رقم فارسی. */
export function faCount(n: number): string {
  return Number.isInteger(n) && n >= 0 && n <= 10 ? (COUNT_WORDS[n] ?? faDigits(n)) : faDigits(n);
}

export function latinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
}

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(FA, { timeZone: TZ, ...options });
    cache.set(key, f);
  }
  return f;
}

/** «۱۴۰۵-۰۷-۲۸» از تاریخ ISO روز (YYYY-MM-DD) — نیم‌روزِ ظهر برای پرهیز از مرز روز. */
function noonOf(isoDay: string): Date {
  return new Date(`${isoDay}T12:00:00+03:30`);
}

export const formatWeekday = (isoDay: string) => fmt({ weekday: "long" }).format(noonOf(isoDay));
export const formatDayMonth = (isoDay: string) => fmt({ day: "numeric", month: "long" }).format(noonOf(isoDay));
export const formatDayNumber = (isoDay: string) => fmt({ day: "numeric" }).format(noonOf(isoDay));
export const formatMonth = (isoDay: string) => fmt({ month: "long" }).format(noonOf(isoDay));
// ICU برای fa-IR با «سال + روز هفته» ترتیبِ «۱۴۰۵ مهر ۲۸, سه‌شنبه» (با ویرگول لاتین) می‌دهد ⇒ ترکیب دستی.
export const formatFullDate = (isoDay: string) => `${formatDayLabel(isoDay)} ${formatYear(isoDay)}`;
/** «سه‌شنبه، ۲۸ مهر» */
export const formatDayLabel = (isoDay: string) => `${formatWeekday(isoDay)}، ${formatDayMonth(isoDay)}`;
export const formatYear = (isoDay: string) => fmt({ year: "numeric" }).format(noonOf(isoDay));

/** ساعت ۲۴ساعته به افق تهران از یک لحظهٔ ISO: «۰۸:۰۰». */
export function formatClock(isoInstant: string): string {
  return fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(isoInstant));
}
/** «سه‌شنبه ۲۸ مهر، ساعت ۲۰:۰۰» */
export function formatMoment(isoInstant: string): string {
  const d = new Date(isoInstant);
  const day = `${fmt({ weekday: "long" }).format(d)}، ${fmt({ day: "numeric", month: "long" }).format(d)}`;
  return `${day}، ساعت ${formatClock(isoInstant)}`;
}

/** تاریخ ISO امروز به افق تهران (YYYY-MM-DD). */
export function tehranToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
}
export function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** «۴ نیم‌روز» ⇒ عبارت انسانی: ۱ ⇒ «یک نیم‌روز»، ۲ ⇒ «یک شبانه‌روز»، ۵ ⇒ «۲ شبانه‌روز و نیم». */
export function durationLabel(cells: number): string {
  if (cells === 1) return "نیم‌روز";
  const days = Math.floor(cells / 2);
  const half = cells % 2 === 1;
  const base = days === 1 ? "یک شبانه‌روز" : `${faDigits(days)} شبانه‌روز`;
  return half ? `${base} و نیم` : base;
}
export const cellsLabel = (cells: number) => `${faDigits(cells)} نیم‌روز`;
export const guestsLabel = (n: number) => `${faDigits(n)} نفر`;
