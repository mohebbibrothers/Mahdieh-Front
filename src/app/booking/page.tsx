import type { Metadata } from "next";
import { OfflineBanner } from "@/widgets/banners/Banners";
import { BookingFlow } from "@/widgets/booking/BookingFlow";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "تکمیل و صدور رزرو",
  description:
    "ورود با شمارهٔ همراه، ثبت مشخصات سجلی، بررسی آنی سهمیه و صدور گواهی رسمی اقامت رایگان زائران در مهدیه مشهد مقدس.",
  robots: { index: false, follow: true },
};

/** P-05 تکمیل و صدور رزرو — گام‌ها از نشانی (‎unit/day/period/cells/guests‎ یا ‎code‎) و نشست ساخته می‌شوند. */
export default function BookingPage() {
  return (
    <>
      <SiteHeader current="/booking/" />
      <OfflineBanner />
      <main id="main-content" tabIndex={-1} className="booking-main">
        <BookingFlow />
      </main>
      <SiteFooter />
      <MobileDock page="booking" />
    </>
  );
}
