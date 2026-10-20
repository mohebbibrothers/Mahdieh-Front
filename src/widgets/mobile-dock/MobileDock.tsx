"use client";
import { AccountTrigger } from "@/features/session/AccountButton";
import { SITE } from "@/shared/config/site";
import { Icon } from "@/shared/ui/Icon";

/** موبایل: نوار فراخوان + چهار زبانهٔ پایینی (با فاصلهٔ امن iOS). */
export function MobileDock() {
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
        <a href={SITE.routes.home} aria-current="page">
          <Icon name="home" size={22} />
          <span>خانه</span>
        </a>
        <a href="#availability">
          <Icon name="calendar" size={22} />
          <span>زمان‌های آزاد</span>
        </a>
        <AccountTrigger guestReason="برای دیدن رزروهایتان با شمارهٔ همراه وارد شوید.">
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
