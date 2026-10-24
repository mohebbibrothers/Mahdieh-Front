import { destHref } from "@/shared/config/destinations";
import { SITE } from "@/shared/config/site";
import type { IconName } from "@/shared/ui/Icon";

/**
 * ناوبری عمومی — پذیرش (P-06) فقط کارکنان است و اینجا پیوندی ندارد.
 * مقصدها از نقشهٔ مرکزی (destinations.ts): تا ساخت هر صفحه، بخش متناظر همین صفحه؛ با انتشار
 * صفحه، خودکار همان صفحه. هیچ پیوندی به قالب‌های قدیمی جنگو نمی‌رود.
 */
type NavItem = { href: string; label: string; short: string; icon: IconName };

/** منوی طراح: شش مقصد؛ هر صفحه با انتشارش (‎ready‎) خودکار در منو ظاهر می‌شود — نه زودتر. */
const booking = destHref("bookingNav");

export const NAV: NavItem[] = [
  { href: SITE.routes.home, label: "صفحهٔ نخست", short: "خانه", icon: "home" },
  { href: destHref("units"), label: "واحدهای اقامتی", short: "واحدها", icon: "building" },
  { href: destHref("calendar"), label: "تقویم زمان‌های آزاد", short: "تقویم", icon: "calendar" },
  ...(booking ? [{ href: booking, label: "تکمیل و صدور رزرو", short: "صدور رزرو", icon: "ticket" as const }] : []),
  { href: destHref("guide"), label: "راهنمای زائر", short: "راهنما", icon: "compass" },
];
