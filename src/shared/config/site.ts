/** ثابت‌های سراسری رابط — هر چیز وابسته به داده از API می‌آید، نه از اینجا. */
export const SITE = {
  name: "مهدیه",
  tagline: "خانه‌ای برای زائر",
  timeZone: "Asia/Tehran",
} as const;

/**
 * نقشهٔ صفحه‌های فرانت جدید — تنها منبع نشانی‌ها.
 *
 * قاعده: هیچ پیوندی نباید به صفحه‌های قدیمیِ سروشده با جنگو برسد. صفحه‌ای که هنوز ساخته
 * نشده (`ready: false`) یا به بخش هم‌ارزش در صفحهٔ نخست می‌رود (`fallback`) یا — اگر
 * هم‌ارزی ندارد — به‌جای پیوند، دکمه‌ای می‌شود که اعلانِ «به‌زودی» نشان می‌دهد
 * (‎PageLink‎). با ساخت هر صفحه فقط `ready` همان صفحه true می‌شود.
 * پذیرش (P-06) عمداً اینجا نیست: صفحهٔ کارکنان است و از رابط عمومی پیوندی ندارد.
 */
export type PageKey = "home" | "units" | "calendar" | "booking" | "portal" | "help" | "verify";

type Page = { path: string; title: string; ready: boolean; fallback?: string };

export const PAGES: Readonly<Record<PageKey, Page>> = {
  home: { path: "/", title: "صفحهٔ نخست", ready: true },
  units: { path: "/units/", title: "واحدهای اقامتی", ready: false, fallback: "/#units" },
  calendar: { path: "/calendar/", title: "تقویم جامع زمان‌های آزاد", ready: false, fallback: "/#availability" },
  booking: { path: "/book/", title: "تکمیل و صدور رزرو", ready: false },
  portal: { path: "/my/", title: "پرتال زائر و پیگیری", ready: false },
  help: { path: "/help/", title: "راهنمای زائر", ready: false, fallback: "/#faq" },
  verify: { path: "/verify/", title: "استعلام گواهی اقامت", ready: false },
};

/** نشانی قابل‌پیمایش صفحه: خودش، یا جایگزین درون صفحهٔ نخست، یا null (= «به‌زودی»). */
export function pageHref(key: PageKey): string | null {
  const p = PAGES[key];
  return p.ready ? p.path : (p.fallback ?? null);
}

/** نشانی پیمایش‌پذیر برای صفحه‌هایی که همیشه جایگزین دارند (ناوبری اصلی). */
export function navHref(key: "home" | "units" | "calendar" | "help"): string {
  return pageHref(key) ?? "/";
}
