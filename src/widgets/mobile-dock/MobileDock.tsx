"use client";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/shared/api/queries";
import { SITE, loginHref } from "@/shared/config/site";
import { Icon } from "@/shared/ui/Icon";

/** موبایل: نوار فراخوان + چهار زبانهٔ پایینی (با فاصلهٔ امن iOS). */
export function MobileDock() {
  const me = useQuery(meQuery);
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
        <a href={me.data ? SITE.routes.my : loginHref(SITE.routes.my)}>
          <Icon name="ticket" size={22} />
          <span>رزروهای من</span>
        </a>
        <a href={SITE.routes.help}>
          <Icon name="compass" size={22} />
          <span>راهنما</span>
        </a>
      </nav>
    </>
  );
}
