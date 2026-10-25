import type { Metadata } from "next";
import { Suspense } from "react";
import { OfflineBanner } from "@/widgets/banners/Banners";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { Portal } from "@/widgets/portal/Portal";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "پرتال زائر و پیگیری رزروها",
  description:
    "پیگیری رزرو، گواهی رسمی اقامت، اعلام ساعت رسیدن و پلاک خودرو، صف انتظار، سابقهٔ سفرها و استعلام اصالت گواهی در زائرسرای وقفی مهدیه مشهد مقدس.",
  robots: { index: false, follow: true },
};

/** P-07 پرتال زائر — پوستهٔ ایستا؛ داده‌ها پس از بارگذاری از نشست و ‎?code=‎ ساخته می‌شوند. */
export default function PortalPage() {
  return (
    <>
      <SiteHeader current="/portal/" />
      <OfflineBanner />
      <main id="main-content" tabIndex={-1} className="portal-main">
        <div className="page-shell">
          <Suspense fallback={<div className="skeleton pt-deck-skel" aria-hidden="true" />}>
            <Portal />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <MobileDock page="portal" />
    </>
  );
}
