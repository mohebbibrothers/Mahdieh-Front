import { destHref } from "@/shared/config/destinations";
import { SITE } from "@/shared/config/site";
import type { IconName } from "@/shared/ui/Icon";

/**
 * ناوبری عمومی — پذیرش (P-06) فقط کارکنان است و اینجا پیوندی ندارد.
 * مقصدها از نقشهٔ مرکزی (destinations.ts): تا ساخت هر صفحه، بخش متناظر همین صفحه؛ با انتشار
 * صفحه، خودکار همان صفحه. هیچ پیوندی به قالب‌های قدیمی جنگو نمی‌رود.
 */
export const NAV: Array<{ href: string; label: string; short: string; icon: IconName }> = [
  { href: SITE.routes.home, label: "صفحهٔ نخست", short: "خانه", icon: "home" },
  { href: destHref("units"), label: "واحدهای اقامتی", short: "واحدها", icon: "building" },
  { href: destHref("calendar"), label: "تقویم زمان‌های آزاد", short: "تقویم", icon: "calendar" },
  { href: destHref("guide"), label: "راهنمای زائر", short: "راهنما", icon: "compass" },
];
