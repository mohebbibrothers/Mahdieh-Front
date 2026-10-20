"use client";
import { AccountTrigger } from "@/features/session/AccountButton";
import { SITE } from "@/shared/config/site";
import { useActiveSection } from "@/shared/lib/use-active-section";
import { Icon } from "@/shared/ui/Icon";

const SPY = ["availability"] as const;

/**
 * موبایل: نوار فراخوان + چهار زبانهٔ پایینی (با فاصلهٔ امن iOS).
 * زبانهٔ فعال با اسکرول جابه‌جا می‌شود: «خانه» همیشه صفحهٔ جاری است (‎aria-current=page‎)،
 * و «زمان‌های آزاد» وقتی بخشش زیر چشم است ‎aria-current=location‎ می‌گیرد.
 */
export function MobileDock() {
  const section = useActiveSection(SPY, "home");
  return (
    <>
      <aside className="mobile-cta" aria-label="شروع رزرو">
        <p>
          <strong>مهمان ما باشید</strong>
          <span>اقامت کاملاً رایگان</span>
        </p>
        <a className="btn btn-primary" href="#quick-search">
          انتخاب زمان اقامت <Icon name="arrow-left" size={18} />
        </a>
      </aside>
      <nav className="mobile-bottom" aria-label="میان‌بُرها">
        <a href={SITE.routes.home} aria-current="page" data-active={section === "home" || undefined}>
          <Icon name="home" size={22} />
          <span>خانه</span>
        </a>
        <a
          href="#availability"
          aria-current={section === "availability" ? "location" : undefined}
          data-active={section === "availability" || undefined}
        >
          <Icon name="calendar" size={22} />
          <span>زمان‌های آزاد</span>
        </a>
        <AccountTrigger guestReason="برای دیدن رزروهایتان با شمارهٔ همراه وارد شوید." portal>
          <Icon name="ticket" size={22} />
          <span>رزروهای من</span>
        </AccountTrigger>
        <AccountTrigger>
          <Icon name="user" size={22} />
          <span>حساب</span>
        </AccountTrigger>
      </nav>
    </>
  );
}
