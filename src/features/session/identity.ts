import { latinDigits } from "@/shared/lib/fa";

/**
 * آینهٔ سمت کاربرِ `normalize_phone` بک‌اند — فقط برای بازخورد فوری؛ داور نهایی سرور است.
 * ۰۹…، ۹…، ‎+۹۸…، ۰۰۹۸…، ۹۸… با ارقام فارسی/عربی، فاصله، خط تیره و پرانتز.
 * شمارهٔ خارجی (‎+کد کشور) فقط وقتی پرچم `international_phones` روشن است به سرور سپرده می‌شود.
 */
export type PhoneCheck = { ok: true; e164: string } | { ok: false; reason: "empty" | "invalid" | "foreign" };

export function checkPhone(raw: string, allowInternational = false): PhoneCheck {
  const compact = latinDigits(raw).replace(/[\s\-().\u200c\u200e\u200f]+/g, "");
  if (!compact) return { ok: false, reason: "empty" };
  const international = compact.startsWith("+") || compact.startsWith("00");
  let digits = compact.startsWith("00") ? compact.slice(2) : compact.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return { ok: false, reason: "invalid" };
  if (international && !digits.startsWith("98")) {
    return allowInternational && /^\d{8,15}$/.test(digits)
      ? { ok: true, e164: `+${digits}` }
      : { ok: false, reason: "foreign" };
  }
  for (const prefix of ["0098", "98"]) {
    if (digits.startsWith(prefix) && digits.length > 10) {
      digits = digits.slice(prefix.length);
      break;
    }
  }
  digits = digits.replace(/^0/, "");
  return /^9\d{9}$/.test(digits) ? { ok: true, e164: `+98${digits}` } : { ok: false, reason: "invalid" };
}

/** نمایش خوانای ‎+98 912 345 6789 (همیشه LTR و داخل <bdi>). */
export function prettyPhone(e164: string): string {
  const m = /^\+98(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+98 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** کد ملی ایران: ۱۰ رقم، نه همه یکسان، با رقم کنترل (هم‌ارز `validate_national_id`). */
export function isValidNationalId(raw: string): boolean {
  const d = latinDigits(raw).replace(/\D/g, "");
  if (!/^\d{10}$/.test(d) || /^(\d)\1{9}$/.test(d)) return false;
  const sum = [...d.slice(0, 9)].reduce((acc, ch, i) => acc + Number(ch) * (10 - i), 0);
  const r = sum % 11;
  const check = Number(d[9]);
  return r < 2 ? check === r : check === 11 - r;
}

/** «۰۱:۵۸» */
export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
