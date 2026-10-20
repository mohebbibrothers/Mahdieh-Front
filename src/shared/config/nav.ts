import { navHref } from "@/shared/config/site";
import type { IconName } from "@/shared/ui/Icon";

/**
 * ناوبری عمومی — پذیرش (P-06) فقط کارکنان است و اینجا پیوندی ندارد.
 * تا ساخت هر صفحه، پیوندش به بخش هم‌ارز همین صفحهٔ نخست می‌رود (نه به صفحهٔ قدیمی).
 */
export const NAV: Array<{ href: string; label: string; short: string; icon: IconName }> = [
  { href: navHref("home"), label: "صفحهٔ نخست", short: "خانه", icon: "home" },
  { href: navHref("units"), label: "واحدهای اقامتی", short: "واحدها", icon: "building" },
  { href: navHref("calendar"), label: "تقویم زمان‌های آزاد", short: "تقویم", icon: "calendar" },
  { href: navHref("help"), label: "راهنمای زائر", short: "راهنما", icon: "compass" },
];
