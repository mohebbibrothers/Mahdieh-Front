import Link from "next/link";
import { PageLink } from "@/shared/ui/PageLink";
import { AccountTrigger } from "@/features/session/AccountButton";
import { VerifyCertificateButton } from "@/features/verify-certificate/VerifyCertificate";
import { SITE } from "@/shared/config/site";
import { Icon } from "@/shared/ui/Icon";
import { Mark } from "@/shared/ui/Mark";
import { NAV } from "@/shared/config/nav";
import { FooterContact, FooterYear } from "./FooterLive";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="footer-main">
          <div className="footer-about">
            <a href={SITE.routes.home} className="footer-brand" aria-label={SITE.name}>
              <Mark />
              <span className="brand-type">{SITE.name}</span>
            </a>
            <p className="footer-description">
              خانه‌ای برای زائران امام رضا (ع). میزبانی ساده و محترمانه، برای سفری که از دل آغاز می‌شود.
            </p>
          </div>
          <nav aria-labelledby="footer-nav">
            <h2 className="footer-heading" id="footer-nav">
              همراه شما
            </h2>
            <ul className="footer-links">
              {/* ترتیب طراح: خانه، واحدها، تقویم، تکمیل و صدور رزرو، پرتال زائر، راهنما */}
              {NAV.filter((n) => n.icon !== "compass").map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
              {NAV.some((n) => n.icon === "ticket") ? null : (
                <li>
                  <Link href="/#quick-search">انتخاب زمان اقامت</Link>
                </li>
              )}
              {/* وقتی «پرتال زائر» در فهرست هست، «رزروهای من» تکرار همان مقصد است */}
              {NAV.some((n) => n.icon === "user") ? null : (
                <li>
                  <AccountTrigger guestReason="برای دیدن رزروهایتان با شمارهٔ همراه وارد شوید." portal>
                    رزروهای من
                  </AccountTrigger>
                </li>
              )}
              {NAV.filter((n) => n.icon === "compass").map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="footer-heading">راهیِ مشهد</h2>
            <FooterContact />
            <VerifyCertificateButton className="section-link verify-link" />
            <PageLink to="contact" className="section-link contact-link">
              اطلاعات تماس <Icon name="arrow-left" size={16} />
            </PageLink>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © <FooterYear /> زائرسرای مهدیه · اقامت، با احترام.
          </span>
          <span>
            <Icon name="heart-hand" size={14} /> وقف عام ویژهٔ زائران حضرت ثامن‌الحجج (ع)
          </span>
        </div>
      </div>
    </footer>
  );
}
