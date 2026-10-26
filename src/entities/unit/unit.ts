import planA2 from "@/shared/assets/plan-A2.svg";
import planB2 from "@/shared/assets/plan-B2.svg";
import planB3 from "@/shared/assets/plan-B3.svg";
import planRoom from "@/shared/assets/plan-room.svg";
import planSuite from "@/shared/assets/plan-suite.svg";
import type { IconName } from "@/shared/ui/Icon";

/** نگاشت کد امکانات بک‌اند ⇒ آیکون طراح (کد ناشناخته ⇒ آیکون عمومی، نه خطا). */
const FEATURE_ICONS: Record<string, IconName> = {
  wifi: "wifi",
  "private-bath": "shower",
  kitchen: "kitchen",
  prayer: "prayer",
  parking: "parking",
  elevator: "elevator",
  fridge: "fridge",
  heating: "thermometer",
  laundry: "laundry",
  locker: "locker",
};
export const featureIcon = (code: string): IconName => FEATURE_ICONS[code] ?? "check";

/** برچسب کوتاه نوع واحد (تقویم موبایل: «سوئیت» + کد + طبقه به‌جای عنوان کامل). */
export const unitTypeLabel = (type: string): string => (type === "suite" ? "سوئیت" : "اتاق بزرگ");

export const unitTypeIcon = (type: string): IconName => (type === "suite" ? "suite" : "room");

type Asset = { src: string };
/** پلان‌های ویژهٔ طراح برای هر واحد (رنگ فرش/پس‌زمینه)؛ واحد تازه ⇒ پلان نوع خودش. */
const UNIT_PLANS: Record<string, Asset> = { A2: planA2 as Asset, B2: planB2 as Asset, B3: planB3 as Asset };

/** پلان مفهومی واحد (نه نقشهٔ واقعی): ویژهٔ کد اگر طراح کشیده باشد، وگرنه بر اساس نوع. */
export const unitPlan = (type: string, code?: string): string =>
  (code ? UNIT_PLANS[code.toUpperCase()] : undefined)?.src ?? ((type === "suite" ? planSuite : planRoom) as Asset).src;

const FLOOR_NAMES = ["همکف", "اول", "دوم", "سوم", "چهارم"];
export const floorLabel = (n: number) => `طبقهٔ ${FLOOR_NAMES[n] ?? n}`;
