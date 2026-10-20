import { latinDigits } from "@/shared/lib/fa";

/**
 * نرمال‌سازی سمت کاربر برای بازخورد فوری؛ داور نهایی بک‌اند است (همان قالب‌ها:
 * ۰۹…، ۹…، ‎+98…‎، ‎0098…‎ و ارقام فارسی/عربی).
 */
export function normalizeIranMobile(raw: string): string | null {
  const s = latinDigits(raw).replace(/[\s\-()\u200c]/g, "");
  const m = /^(?:\+98|0098|98|0)?(9\d{9})$/.exec(s);
  return m ? `0${m[1]}` : null;
}

/** نمایش خوانا: ‎0912 345 6789‎. */
export function formatMobile(n: string): string {
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}
