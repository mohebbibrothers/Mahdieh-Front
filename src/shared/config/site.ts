/** ثابت‌های سراسری رابط — هر چیز وابسته به داده از API می‌آید، نه از اینجا. */
export const SITE = {
  name: "مهدیه",
  tagline: "خانه‌ای برای زائر",
  timeZone: "Asia/Tehran",
  /** نشانی صفحه‌های قدیمیِ سروشده با جنگو (تا ساخت صفحهٔ فرانت متناظر). */
  routes: {
    home: "/",
    units: "/units/",
    calendar: "/calendar/",
    help: "/help/",
    my: "/my/",
    login: "/login/",
    verify: "/verify/",
  },
} as const;

/** پیوند ورود که پس از موفقیت به همین صفحه برمی‌گردد. */
export function loginHref(next = "/"): string {
  return `${SITE.routes.login}?next=${encodeURIComponent(next)}`;
}
