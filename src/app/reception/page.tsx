import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import { Reception } from "@/widgets/reception/ReceptionDesk";

export const metadata: Metadata = {
  title: "میز پذیرش خادمان",
  description: "پیشخوان پذیرش، تحویل کلید و مدیریت واحدهای زائرسرای مهدیه — ویژهٔ کارکنان.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/**
 * P-06 میز پذیرش — فقط کارکنان. پوستهٔ ایستا را سرور فقط به کارمند می‌دهد (دیگران ‎404‎ واقعی)؛
 * هیچ پیوند عمومی به این مسیر نیست و نوار پایین موبایل زائر هم نمایش داده نمی‌شود.
 */
export default function ReceptionRoute() {
  return (
    <>
      <SiteHeader current="/reception/" />
      <main id="main-content" tabIndex={-1} className="rc-main">
        <div className="page-shell">
          <Suspense fallback={<div className="skeleton rc-sk-hero" aria-hidden="true" />}>
            <Reception />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
