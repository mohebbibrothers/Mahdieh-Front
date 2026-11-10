"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** وضعیت یک نوار پیمایش افقی: سرریز دارد؟ به آغاز/پایانش رسیده‌ایم؟ */
export type RailEdges = { overflow: boolean; atStart: boolean; atEnd: boolean };

const IDLE: RailEdges = { overflow: false, atStart: true, atEnd: true };

/** خواندن لبه‌ها مستقل از جهت: در RTL مقدار ‎scrollLeft‎ از صفر به منفی می‌رود. */
export function readEdges(el: HTMLElement): RailEdges {
  const max = el.scrollWidth - el.clientWidth;
  const pos = Math.abs(el.scrollLeft);
  return { overflow: max > 1, atStart: pos <= 1, atEnd: pos >= max - 1 };
}

/**
 * پیمایش «یک قاب» به جلو (‎dir = 1‎، در RTL یعنی به سمت چپ) یا عقب. هر بار ۸۰٪ پهنای دیدنی جابه‌جا
 * می‌شود تا آخرین آیتمِ دیده‌شده سرنخ ادامه بماند؛ کاهش حرکت ⇒ پرش بی‌انیمیشن.
 */
export function scrollRail(el: HTMLElement, dir: 1 | -1) {
  const rtl = getComputedStyle(el).direction === "rtl";
  const step = el.clientWidth * 0.8 * dir * (rtl ? -1 : 1);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollBy({ left: step, behavior: reduce ? "auto" : "smooth" });
}

/** آیتمِ نیمه‌پنهان زیر لبهٔ محو/دکمه ⇒ کامل به دید می‌آید (فقط افقی؛ صفحه عمودی نمی‌پرد). */
export function revealInRail(item: HTMLElement, gap = 56) {
  const rail = item.parentElement;
  if (!rail) return;
  const r = rail.getBoundingClientRect();
  const i = item.getBoundingClientRect();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduce ? "auto" : "smooth";
  if (i.left < r.left + gap) rail.scrollBy({ left: i.left - r.left - gap, behavior });
  else if (i.right > r.right - gap) rail.scrollBy({ left: i.right - r.right + gap, behavior });
}

/** خروجی ‎useScrollRail‎: [اتصال به نوار، لبه‌ها برای نمایش دکمه‌ها، فرمان پیمایش یک قاب]. */
export type ScrollRail<T extends HTMLElement> = [
  attach: (el: T | null) => void,
  edges: RailEdges,
  step: (dir: 1 | -1) => void,
];

/**
 * لبه‌های نوار افقی را زنده دنبال می‌کند (پیمایش، تغییر اندازهٔ قاب یا محتوا، بارگذاری فونت)
 * تا دکمه‌های پیمایش فقط وقتی دیده شوند که واقعاً جایی برای رفتن هست. «ref بازخوانی» است تا نواری
 * که دیرتر (پس از رسیدن داده) ساخته یا جایگزین می‌شود هم دنبال شود.
 */
export function useScrollRail<T extends HTMLElement>(): ScrollRail<T> {
  const node = useRef<T>(null);
  const [el, setEl] = useState<T | null>(null);
  const [edges, setEdges] = useState<RailEdges>(IDLE);
  const ref = useCallback((next: T | null) => {
    node.current = next;
    setEl(next);
  }, []);

  useEffect(() => {
    if (!el) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readEdges(el);
        setEdges((prev) =>
          prev.overflow === next.overflow && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
        );
      });
    };
    // ‎ResizeObserver‎ بلافاصله پس از observe یک بار فرا خوانده می‌شود ⇒ اندازه‌گیری نخست هم همین‌جاست.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    const mo = new MutationObserver(() => {
      for (const child of el.children) ro.observe(child);
      update();
    });
    mo.observe(el, { childList: true });
    el.addEventListener("scroll", update, { passive: true });
    void document.fonts?.ready.then(update);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [el]);

  const step = useCallback((dir: 1 | -1) => {
    if (node.current) scrollRail(node.current, dir);
  }, []);
  return [ref, el ? edges : IDLE, step];
}
