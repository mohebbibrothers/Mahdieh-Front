import { SITE } from "@/shared/config/site";
import type { IconName } from "@/shared/ui/Icon";

/**
 * ناوبری عمومی — پذیرش (P-06) فقط کارکنان است و اینجا پیوندی ندارد.
 * تا ساخت صفحه‌های بعدی، هر مقصد بخش متناظرِ همین صفحه است («/#…» ⇒ در خانه فقط پیمایش، از صفحه‌های دیگر بازگشت به خانه)؛
 * هیچ پیوندی به قالب‌های قدیمی جنگو نمی‌رود.
 */
export const NAV: Array<{ href: string; label: string; short: string; icon: IconName }> = [
  { href: SITE.routes.home, label: "صفحهٔ نخست", short: "خانه", icon: "home" },
  { href: "/#units", label: "واحدهای اقامتی", short: "واحدها", icon: "building" },
  { href: "/#availability", label: "تقویم زمان‌های آزاد", short: "تقویم", icon: "calendar" },
  { href: "/#rules", label: "راهنمای زائر", short: "راهنما", icon: "compass" },
];
