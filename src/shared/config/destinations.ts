/**
 * نقشهٔ مقصدها — تنها جای تعیین مقصد پیوندهای میان‌صفحه‌ای سایت.
 *
 * هر «قصد» ناوبری (تقویم کامل، راهنمای کامل، ادامهٔ رزرو…) از همین حالا به صفحهٔ نهایی طراح
 * (P-02…P-08) نسبت داده شده است. تا صفحه‌ای ساخته نشده (`ready: false`):
 *   · پیوندهای ناوبری عمومی به بخش متناظر صفحهٔ خانه می‌روند (`fallback`)؛
 *   · دکمه‌هایی که جایگزین درون‌صفحه‌ای ندارند (`fallback: null`) اصلاً نمایش داده نمی‌شوند
 *     — نه پیوند مرده، نه بازگشت بی‌معنا به همین صفحه، نه صفحه‌های قدیمی جنگو.
 * با ساخت هر صفحه فقط `ready: true` (و در صورت نیاز مسیر) عوض می‌شود و همهٔ پیوندها و دکمه‌های
 * آن در کل سایت یک‌جا وصل می‌شوند. آزمون واحد همین پرونده و آزمون نگهبان e2e مراقب‌اند.
 *
 * یادداشت مسیرها: همه با اسلش پایانی (خروجی ایستا با ‎trailingSlash‎ و جنگو فقط همین مسیر دقیق
 * را از ‎routes.json‎ سرو می‌کند؛ بی‌اسلش ⇒ ۳۰۱ بک‌اند). قالب‌های قدیمی جنگو ‎/units/‎، ‎/calendar/‎،
 * ‎/help/‎ و ‎/book/‎ را دارند؛ هنگام فعال‌سازی هر صفحه، مسیر قدیمی متناظر بازنشسته و آزمون نگهبان
 * به‌روز می‌شود.
 * پذیرش (P-06) فقط کارکنان است و عمداً اینجا نیست.
 */
import type { Route } from "next";

export type PageId = "P-02" | "P-03" | "P-04" | "P-05" | "P-07" | "P-08";

export type PageInfo = {
  /** عنوان صفحه (برای پیام‌ها و گزارش) */
  title: string;
  /** مسیر فرانت؛ ‎{code}‎ با کد واحد جایگزین می‌شود */
  path: string;
  /** ساخته، تأییدشده و منتشرشده؟ */
  ready: boolean;
};

export const PAGES: Record<PageId, PageInfo> = {
  "P-02": { title: "واحدهای اقامتی", path: "/units/", ready: true },
  "P-03": { title: "جزئیات واحد", path: "/units/{code}/", ready: true },
  "P-04": { title: "تقویم موجودی", path: "/calendar/", ready: true },
  "P-05": { title: "تکمیل و صدور رزرو", path: "/booking/", ready: true },
  "P-07": { title: "پرتال زائر و پیگیری", path: "/portal/", ready: true },
  "P-08": { title: "راهنمای زائر و احکام", path: "/guide/", ready: false },
};

type Intent = {
  page: PageId;
  /** لنگر درون صفحهٔ مقصد (بی «#») */
  hash?: string;
  /** مقصد موقت تا آماده شدن صفحه؛ ‎null‎ = تا آن زمان نمایش داده نشود */
  fallback: string | null;
};

export const DEST = {
  /** منو و پانویس: «واحدهای اقامتی» */
  units: { page: "P-02", fallback: "/#units" },
  /** پنجرهٔ واحد: «مقایسه با سایر واحدها» (طراح P-01 ← P-02) */
  unitsCompare: { page: "P-02", fallback: null },
  /** منو و پانویس: «تقویم زمان‌های آزاد» */
  calendar: { page: "P-04", fallback: "/#availability" },
  /** بخش تقویم و انتخابگر تاریخ: «تقویم کامل ۹۰ روز آینده» */
  calendarFull: { page: "P-04", fallback: null },
  /** منو و پانویس: «راهنمای زائر» */
  guide: { page: "P-08", fallback: "/#rules" },
  /** بخش پرسش‌ها: «پرسش دیگری دارید؟ راهنمای کامل زائر» */
  guideFull: { page: "P-08", fallback: null },
  /** «اطلاعات تماس» (طراح ← P-08#contact-desk) */
  contact: { page: "P-08", hash: "contact-desk", fallback: null },
  /** «رزروهای من»، «پرتال زائر» (منو، نوار پایین، پانویس، پنجرهٔ حساب) */
  portal: { page: "P-07", fallback: null },
  /** «بازرسی گواهی با مشخصات چاپی و کد کوتاه» */
  verifyOffline: { page: "P-07", hash: "verify", fallback: null },
  /** «انتخاب این واحد و ادامه» (طراح ← P-05 با پارامترهای انتخاب) */
  booking: { page: "P-05", fallback: null },
  /** منوی اصلی: «تکمیل و صدور رزرو» (بی‌پارامتر ⇒ نمای «از کجا شروع کنم» و رزروهای پیش‌رو) */
  bookingNav: { page: "P-05", fallback: null },
  /** «جزئیات رزرو / گواهی» با کد پیگیری (‎?code=‎) — کارت شاخص پرتال؛ صدور تازه همچنان در P-05 نمایش داده می‌شود */
  reservation: { page: "P-07", fallback: null },
} as const satisfies Record<string, Intent>;

export type DestKey = keyof typeof DEST;
/** قصدهایی که همیشه مقصد دارند (منو/پانویس) ⇒ نوع بازگشتی ‎string‎ */
type AlwaysKey = { [K in DestKey]: (typeof DEST)[K]["fallback"] extends string ? K : never }[DestKey];

/**
 * تنها نقطهٔ تبدیل به ‎Route‎: مسیرهای نوع‌دار Next صفحه‌های هنوز ساخته‌نشده را نمی‌شناسند؛ درستی
 * نشانی‌ها را آزمون واحد همین پرونده تضمین می‌کند و با ساخت هر صفحه مسیرش واقعاً وجود دارد.
 */
function asRoute(href: string): Route {
  return href as Route;
}

function build(page: PageInfo, hash: string | undefined, query?: Record<string, string>, code?: string): Route {
  const path = code ? page.path.replace("{code}", encodeURIComponent(code)) : page.path;
  const qs = query && Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : "";
  return asRoute(`${path}${qs}${hash ? `#${hash}` : ""}`);
}

/** مقصد یک قصد ناوبری: صفحهٔ آماده، وگرنه جایگزین موقت (یا ‎null‎ = نمایش نده). */
export function destHref(key: AlwaysKey, query?: Record<string, string>): Route;
export function destHref(key: DestKey, query?: Record<string, string>): Route | null;
export function destHref(key: DestKey, query?: Record<string, string>): Route | null {
  const intent: Intent = DEST[key];
  const page = PAGES[intent.page];
  if (page.ready) return build(page, intent.hash, query);
  return intent.fallback === null ? null : asRoute(intent.fallback);
}

/** جزئیات و گواهی یک رزرو با کد پیگیری — همیشه مقصد دارد (پرتال P-07؛ در نبود آن نمای رزرو P-05). */
export function reservationHref(code: string): Route {
  return destHref("reservation", { code }) ?? build(PAGES["P-05"], undefined, { code });
}

/** شرایط سفری که همراه پیوند واحد می‌رود (همان قرارداد پرس‌وجوی P-02/P-04/P-05). */
export type TripQuery = { day: string | null; period: "day" | "night"; cells: number; guests: number };

/**
 * صفحهٔ اختصاصی یک واحد (P-03) — با شرایط سفر جاری (اگر هست) تا همان بازه در صفحهٔ واحد سنجیده شود؛
 * صفحه آماده نباشد ⇒ ‎null‎ (جزئیات در پنجرهٔ همان صفحه).
 */
export function unitPageHref(code: string, trip?: TripQuery): Route | null {
  const page = PAGES["P-03"];
  if (!page.ready) return null;
  const query: Record<string, string> = {};
  if (trip?.day) Object.assign(query, { day: trip.day, period: trip.period });
  if (trip && (trip.day || trip.cells !== 4)) query.cells = String(trip.cells);
  if (trip && (trip.day || trip.guests !== 4)) query.guests = String(trip.guests);
  return build(page, undefined, query, code);
}

/** صفحه‌های ساخته‌نشده و قصدهای منتظرشان — برای گزارش و آزمون. */
export function pendingDestinations(): Array<{ page: PageId; title: string; intents: DestKey[] }> {
  return (Object.keys(PAGES) as PageId[])
    .filter((id) => !PAGES[id].ready)
    .map((id) => ({
      page: id,
      title: PAGES[id].title,
      intents: (Object.keys(DEST) as DestKey[]).filter((k) => DEST[k].page === id),
    }));
}
