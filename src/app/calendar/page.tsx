import type { Metadata } from "next";
import { Suspense } from "react";
import { OfflineBanner } from "@/widgets/banners/Banners";
import { CalendarPage } from "@/widgets/calendar-page/CalendarPage";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "تقویم موجودی و کشف زمان‌های آزاد",
  description:
    "وضعیت زندهٔ نیم‌روزهای همهٔ واحدهای زائرسرای مهدیه در افق رزرو، نخستین زمان‌های آزاد هر واحد، مناسبت‌های پرتقاضا و صف انتظار — اقامت رایگان زائران در مشهد مقدس.",
};

/** P-04 تقویم موجودی — حالت صفحه (بازه، فیلتر، نما، انتخاب) در نشانی است و قابل اشتراک. */
export default function CalendarRoute() {
  return (
    <>
      <SiteHeader current="/calendar/" />
      <OfflineBanner />
      <main id="main-content" tabIndex={-1} className="cp-main">
        <Suspense>
          <CalendarPage />
        </Suspense>
      </main>
      <SiteFooter />
      <MobileDock page="calendar" />
    </>
  );
}
