"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * کدام بخش صفحه «اکنون» زیر چشم کاربر است (scroll-spy).
 *
 * یک نوار باریک در میانهٔ نما (‎rootMargin‎) معیار است: بخشی که از این نوار بگذرد فعال
 * می‌شود؛ اگر هیچ‌کدام نگذرد، ‎fallback‎ برمی‌گردد. با ‎useSyncExternalStore‎ ⇒ بی‌رندرِ اضافه،
 * سازگار با SSR (‎fallback‎ در سرور) و بدون setState داخل effect.
 */
const BAND = "-45% 0px -50% 0px";

export function useActiveSection<T extends string>(ids: readonly T[], fallback: T): T {
  const key = ids.join("|");
  // اشتراک فقط با تغییر فهرست بخش‌ها نو می‌شود، نه در هر رندر.
  const sub = useCallback((notify: () => void) => subscribe(key, key.split("|"), notify), [key]);
  return useSyncExternalStore(
    sub,
    () => (current.get(key) as T | undefined) ?? fallback,
    () => fallback,
  );
}

const current = new Map<string, string | undefined>();

function subscribe(key: string, ids: readonly string[], notify: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const inBand = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inBand.add(e.target.id);
        else inBand.delete(e.target.id);
      }
      // ترتیب ‎ids‎ اولویت را تعیین می‌کند (بخش پایین‌تر در صفحه، دیرتر در فهرست).
      const next = [...ids].reverse().find((id) => inBand.has(id));
      if (next !== current.get(key)) {
        current.set(key, next);
        notify();
      }
    },
    { rootMargin: BAND },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
  return () => {
    io.disconnect();
    current.delete(key);
  };
}
