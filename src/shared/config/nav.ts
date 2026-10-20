import { SITE } from "@/shared/config/site";
import type { IconName } from "@/shared/ui/Icon";

/** ناوبری عمومی — پذیرش (P-06) فقط کارکنان است و اینجا پیوندی ندارد. */
export const NAV: Array<{ href: string; label: string; short: string; icon: IconName }> = [
  { href: SITE.routes.home, label: "صفحهٔ نخست", short: "خانه", icon: "home" },
  { href: SITE.routes.units, label: "واحدهای اقامتی", short: "واحدها", icon: "building" },
  { href: SITE.routes.calendar, label: "تقویم زمان‌های آزاد", short: "تقویم", icon: "calendar" },
  { href: SITE.routes.help, label: "راهنمای زائر", short: "راهنما", icon: "compass" },
];
