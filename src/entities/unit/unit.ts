import planRoom from "@/shared/assets/plan-room.svg";
import planSuite from "@/shared/assets/plan-suite.svg";
import type { IconName } from "@/shared/ui/Icon";

/** نگاشت کد امکانات بک‌اند ⇒ آیکون طراح (کد ناشناخته ⇒ آیکون عمومی، نه خطا). */
const FEATURE_ICONS: Record<string, IconName> = {
  wifi: "wifi",
  "private-bath": "home",
  kitchen: "home",
  prayer: "prayer",
  parking: "map-pin",
  elevator: "building",
  fridge: "snowflake",
  heating: "sun",
  laundry: "refresh",
  locker: "lock",
};
export const featureIcon = (code: string): IconName => FEATURE_ICONS[code] ?? "check";

/** برچسب کوتاه نوع واحد (تقویم موبایل: «سوئیت» + کد + طبقه به‌جای عنوان کامل). */
export const unitTypeLabel = (type: string): string => (type === "suite" ? "سوئیت" : "اتاق بزرگ");

export const unitTypeIcon = (type: string): IconName => (type === "suite" ? "suite" : "room");

/** پلان مفهومی بر اساس نوع واحد (عکس واقعی هنوز نیست؛ UnitDetail.photos در صفحهٔ جزئیات). */
export const unitPlan = (type: string): string => ((type === "suite" ? planSuite : planRoom) as { src: string }).src;

const FLOOR_NAMES = ["همکف", "اول", "دوم", "سوم", "چهارم"];
export const floorLabel = (n: number) => `طبقهٔ ${FLOOR_NAMES[n] ?? n}`;
