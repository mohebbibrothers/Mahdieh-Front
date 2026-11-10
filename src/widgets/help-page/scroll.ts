/** پیمایش نرم به یک بخش (با احترام به «کاهش حرکت») و سپردن فوکوس به سرتیتر آن برای صفحه‌خوان. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const heading = el.querySelector<HTMLElement>("h2, [data-focus-target]");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}
