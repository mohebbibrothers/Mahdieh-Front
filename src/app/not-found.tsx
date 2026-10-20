import type { Metadata } from "next";
import { SITE } from "@/shared/config/site";
import { Icon } from "@/shared/ui/Icon";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

/** ۴۰۴ با هویت مهدیه (پیش‌فرض Next استایل درون‌خطی دارد و CSP را نقض می‌کند). */
export default function NotFound() {
  return (
    <>
      <SiteHeader current="" />
      <main id="main-content" tabIndex={-1} className="page-shell not-found">
        <p className="not-found__code" aria-hidden="true">
          ۴۰۴
        </p>
        <h1>این نشانی در مهدیه پیدا نشد.</h1>
        <p>شاید پیوند قدیمی است یا اشتباه تایپ شده. از یکی از این راه‌ها ادامه دهید:</p>
        <div className="not-found__actions">
          <a className="btn btn-primary" href={SITE.routes.home}>
            صفحهٔ نخست <Icon name="arrow-left" size={18} />
          </a>
          <a className="btn btn-secondary" href={SITE.routes.calendar}>
            <Icon name="calendar" size={18} /> زمان‌های آزاد
          </a>
          <a className="btn btn-secondary" href={SITE.routes.help}>
            <Icon name="compass" size={18} /> راهنمای زائر
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
