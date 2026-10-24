"use client";
import { useSyncExternalStore } from "react";

/**
 * پارامترهای نشانی صفحهٔ صدور (‎unit‎، ‎code‎) به‌شکل حالت React — بی‌نیاز از ‎useSearchParams‎
 * (که در خروجی ایستا مرز Suspense و رندر دوباره می‌خواهد). پیش‌نویس رزرو (‎day/period/cells/guests‎)
 * همگامی خودش را دارد و این دو هرگز پارامترهای یکدیگر را پاک نمی‌کنند.
 */
const EVENT = "mahdieh:search";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}

/** به‌روزرسانی پارامترها (‎null‎ = حذف) بی‌بارگذاری دوباره؛ ‎push‎ برای گام‌هایی که «بازگشت» معنا دارد. */
export function setSearch(patch: Record<string, string | null>, mode: "replace" | "push" = "replace"): void {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  if (url.href === window.location.href) return;
  if (mode === "push") window.history.pushState(window.history.state, "", url);
  else window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(EVENT));
}
