import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountBanners, OfflineBanner } from "@/widgets/banners/Banners";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import { UnitsPage } from "@/widgets/units-page/UnitsPage";

export const metadata: Metadata = {
  title: "واحدهای اقامتی",
  description:
    "سوئیت‌ها و اتاق‌های بزرگ زائرسرای مهدیه در مشهد مقدس: ظرفیت، طبقه، دسترسی و امکانات هر واحد، زمان آزاد برای سفر شما و مقایسهٔ کنار هم — اقامت کاملاً رایگان.",
};

/** P-02 واحدهای اقامتی — سفر، فیلترها، ترتیب و مقایسه در نشانی است و قابل اشتراک. */
export default function UnitsRoute() {
  return (
    <>
      <SiteHeader current="/units/" />
      <OfflineBanner />
      <AccountBanners />
      <main id="main-content" tabIndex={-1} className="up-main">
        <Suspense>
          <UnitsPage />
        </Suspense>
      </main>
      <SiteFooter />
      <MobileDock page="units" />
    </>
  );
}
