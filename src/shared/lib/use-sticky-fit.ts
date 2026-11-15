"use client";
import { useCallback, type RefCallback } from "react";

/**
 * کنارهٔ چسبانِ دوسویه — بی نوار پیمایش درونی.
 *
 * کنارهٔ بلندتر از پنجره (پنل رزرو P-03، پالایش P-02 در نمایشگرهای کوتاه) پیش‌تر با
 * ‎max-height + overflow:auto‎ نوار پیمایش جداگانه‌ای کنار خود می‌گرفت (دو اسکرول تودرتو). اکنون:
 *   · کناره در پنجره جا می‌شود ⇐ مثل همیشه زیر سرصفحه می‌چسبد؛
 *   · بلندتر است ⇐ «چسبان دوسویه»: با پیمایش رو به پایین همراه صفحه بالا می‌رود تا لبهٔ پایینش
 *     پیدا شود و همان‌جا می‌ایستد؛ با پیمایش رو به بالا برمی‌گردد تا سرش زیر سرصفحه پیدا شود.
 *     همهٔ محتوا با همان اسکرول اصلی صفحه در دسترس است و هیچ‌گاه بخشی دست‌نیافتنی نمی‌ماند.
 * فاصلهٔ چسبیدن در متغیر ‎--sticky-top‎ نوشته می‌شود (CSSOM؛ مجاز در CSP سایت برخلاف ویژگی
 * ‎style‎). تغییر ارتفاع محتوا (بازخورد، خطا، حالت آسان) با ‎ResizeObserver‎ و پیمایش/تغییر اندازه
 * با یک ‎requestAnimationFrame‎ در هر فریم دنبال می‌شود.
 *
 * @param gap فاصلهٔ کناره از زیر سرصفحه (همان فاصلهٔ طراح)
 * @param bottomGap فاصلهٔ لبهٔ پایین کنارهٔ بلند از پایین پنجره
 */
export function useStickyFit<T extends HTMLElement>(gap = 20, bottomGap = 20): RefCallback<T> {
  return useCallback(
    (el: T | null) => {
      if (!el) return;
      let top = Number.NaN;
      let lastY = window.scrollY;
      let frame = 0;
      const update = () => {
        frame = 0;
        const header =
          Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
        const max = header + gap;
        const min = Math.min(max, window.innerHeight - el.offsetHeight - bottomGap);
        const y = window.scrollY;
        const delta = y - lastY;
        lastY = y;
        top = Number.isNaN(top) ? max : Math.min(max, Math.max(min, top - delta));
        el.style.setProperty("--sticky-top", `${Math.round(top)}px`);
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      update();
      const ro = new ResizeObserver(schedule);
      ro.observe(el);
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        ro.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        el.style.removeProperty("--sticky-top");
      };
    },
    [gap, bottomGap],
  );
}
