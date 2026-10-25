/**
 * تقویم خورشیدی برای انتخاب‌گر تاریخ — میلادی ⇒ خورشیدی از همان ‎Intl‎ (تقویم ‎persian‎) که همهٔ سایت
 * با آن تاریخ نشان می‌دهد (یک منبع حقیقت، بی جدول کبیسهٔ دستی). خورشیدی ⇒ میلادی با تخمین
 * «نوروز ≈ ۲۱ مارس» و تصحیح چندروزه بر پایهٔ همان ‎Intl‎ (همیشه دقیق، حتی سال‌های کبیسهٔ ۳۳ساله).
 * روزها همه ‎ISO‎ «YYYY-MM-DD» (بی منطقهٔ زمانی؛ روز تقویمی تهران).
 */
export type JalaliDate = { jy: number; jm: number; jd: number };

const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const utc = (isoDay: string) => new Date(`${isoDay}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
function shift(isoDay: string, days: number): string {
  const d = utc(isoDay);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

/** «2026-10-29» ⇒ ‎{1405, 8, 7}‎ */
export function toJalali(isoDay: string): JalaliDate {
  const p = Object.fromEntries(parts.formatToParts(utc(isoDay)).map((x) => [x.type, x.value]));
  return { jy: Number.parseInt(p.year ?? "0", 10), jm: Number(p.month), jd: Number(p.day) };
}

const cmp = (a: JalaliDate, b: JalaliDate) => a.jy - b.jy || a.jm - b.jm || a.jd - b.jd;

/** ‎{1405, 8, 7}‎ ⇒ «2026-10-29»؛ تاریخ ناموجود (مثل ۳۰ اسفند سال غیرکبیسه) ⇒ ‎null‎. */
export function fromJalali(jy: number, jm: number, jd: number): string | null {
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
  const offset = jm <= 6 ? (jm - 1) * 31 : 186 + (jm - 7) * 30;
  const target = { jy, jm, jd };
  let guess = shift(`${jy + 621}-03-21`, offset + jd - 1);
  for (let i = 0; i < 4; i++) {
    const diff = cmp(target, toJalali(guess));
    if (diff === 0) return guess;
    guess = shift(guess, diff > 0 ? 1 : -1);
  }
  return cmp(target, toJalali(guess)) === 0 ? guess : null;
}

/** طول ماه خورشیدی (اسفند کبیسه ⇒ ۳۰). */
export function monthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return fromJalali(jy, 12, 30) ? 30 : 29;
}

/** ستون روز در هفتهٔ ایرانی (شنبه = ۰ … جمعه = ۶). */
export function weekColumn(isoDay: string): number {
  return (utc(isoDay).getUTCDay() + 1) % 7;
}

/** «1405/8/7» — همان قالب عددی‌ای که ‎certificateStamp‎ و سرور می‌پذیرند. */
export function jalaliNumeric(isoDay: string): string {
  const { jy, jm, jd } = toJalali(isoDay);
  return `${jy}/${jm}/${jd}`;
}

/** خانه‌های یک ماه برای جدول ۷ستونه: ‎null‎ = خانهٔ خالی پیش از روز نخست. */
export function monthGrid(jy: number, jm: number): Array<string | null> {
  const first = fromJalali(jy, jm, 1);
  if (!first) return [];
  const lead: Array<string | null> = Array.from({ length: weekColumn(first) }, () => null);
  const days = Array.from({ length: monthLength(jy, jm) }, (_, i) => shift(first, i));
  return [...lead, ...days];
}

/** ماه بعد/قبل: ‎{1405, 12} + 1 ⇒ {1406, 1}‎ */
export function addMonths(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  const n = jy * 12 + (jm - 1) + delta;
  return { jy: Math.floor(n / 12), jm: (n % 12) + 1 };
}

export const addDaysIso = shift;
