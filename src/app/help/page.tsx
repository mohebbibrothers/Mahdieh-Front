import type { Metadata } from "next";
import { Suspense } from "react";
import { HelpPage } from "@/widgets/help-page/HelpPage";
import { AccountBanners, OfflineBanner } from "@/widgets/banners/Banners";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "راهنمای زائر و پرسش‌های پرتکرار",
  description:
    "راهنمای کامل اقامت رایگان در زائرسرای مهدیه مشهد: ثبت‌نام با شمارهٔ همراه، رزرو سانس، لغو و جابه‌جایی، نوبت انتظار، پذیرش و تحویل کلید، قواعد زندهٔ اقامت، اوقات شرعی به افق حرم و راه‌های تماس.",
};

/** P-08 راهنمای زائر — جست‌وجو و دسته در نشانی (‎?q=&cat=‎) و هر پرسش با پیوند مستقیم ‎#item-slug‎. */
export default function HelpRoute() {
  return (
    <>
      <SiteHeader current="/help/" />
      <OfflineBanner />
      <AccountBanners />
      <main id="main-content" tabIndex={-1} className="hp-main">
        <Suspense>
          <HelpPage />
        </Suspense>
      </main>
      <SiteFooter />
      <MobileDock page="help" />
    </>
  );
}
