"use client";
import { useSearchParams } from "next/navigation";

/**
 * پارامترهای نشانی صفحهٔ صدور (‎unit‎، ‎code‎) به‌شکل حالت React — از خود مسیریاب Next:
 * پیوندهای ‎<Link>‎ (کارت رزرو، منوی بالا، بنرها)، بازگشت/جلوی مرورگر و ‎setSearch‎ همه یک منبع‌اند.
 * (Next ≥۱۴٫۱ فراخوانی‌های بومی ‎history.pushState/replaceState‎ با ‎state=null‎ را با ‎useSearchParams‎
 * همگام می‌کند؛ ‎state‎ دارای ‎__NA‎ را «داخلی» می‌انگارد و نادیده می‌گیرد ⇒ همیشه ‎null‎ بدهید.)
 * مصرف‌کننده باید درون ‎<Suspense>‎ باشد (خروجی ایستا).
 */
export function useSearch(): string {
  const query = useSearchParams().toString();
  return query ? `?${query}` : "";
}

/** به‌روزرسانی پارامترها (‎null‎ = حذف) بی‌بارگذاری دوباره؛ ‎push‎ برای گام‌هایی که «بازگشت» معنا دارد. */
export function setSearch(patch: Record<string, string | null>, mode: "replace" | "push" = "replace"): void {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  if (url.href === window.location.href) return;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}
