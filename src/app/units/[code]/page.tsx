import type { Metadata } from "next";
import { AccountBanners, OfflineBanner } from "@/widgets/banners/Banners";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import { UnitPage } from "@/widgets/unit-page/UnitPage";

export const metadata: Metadata = {
  title: "جزئیات واحد",
  description:
    "معرفی کامل یک واحد زائرسرای مهدیه در مشهد مقدس: ظرفیت، طبقه و دسترسی، امکانات ثبت‌شده، زمان‌های آزاد همین واحد و ادامهٔ رزرو — اقامت کاملاً رایگان.",
};

/**
 * P-03 جزئیات واحد — یک قالب ایستا برای همهٔ واحدها (‎/units/_/‎). جنگو هر ‎/units/<code>/‎ را با
 * همین قالب پاسخ می‌دهد (نگهبان مسیر: کد ناموجود ⇒ ۴۰۴ واقعی، ‎/units/a1/‎ ⇒ ۳۰۱ به ‎/units/A1/‎)؛
 * کد واحد سمت کاربر از نشانی خوانده می‌شود.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ code: "_" }];
}

export default function UnitRoute() {
  return (
    <>
      <SiteHeader current="/units/" />
      <OfflineBanner />
      <AccountBanners />
      <main id="main-content" tabIndex={-1} className="ud-main">
        <UnitPage />
      </main>
      <SiteFooter />
      <MobileDock page="unit" />
    </>
  );
}
