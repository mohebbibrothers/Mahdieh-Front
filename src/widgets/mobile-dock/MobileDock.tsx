"use client";
import Link from "next/link";
import { AccountTrigger } from "@/features/session/AccountButton";
import { destHref } from "@/shared/config/destinations";
import { SITE } from "@/shared/config/site";
import { requestUnitsTrip } from "@/shared/lib/page-events";
import { useActiveSection } from "@/shared/lib/use-active-section";
import { Icon } from "@/shared/ui/Icon";

const SPY = ["availability"] as const;

/**
 * موبایل: نوار فراخوان + چهار زبانهٔ پایینی (با فاصلهٔ امن iOS).
 * زبانهٔ فعال با اسکرول جابه‌جا می‌شود: «خانه» همیشه صفحهٔ جاری است (‎aria-current=page‎)،
 * و «زمان‌های آزاد» وقتی بخشش زیر چشم است ‎aria-current=location‎ می‌گیرد.
 */
export function MobileDock({ page = "home" }: { page?: "home" | "booking" | "portal" | "calendar" | "units" }) {
  const spied = useActiveSection(SPY, "home");
  const onHome = page === "home";
  const onUnits = page === "units";
  const section = onHome ? spied : null;
  return (
    <>
      {/* فراخوان «انتخاب زمان» فقط در خانه؛ در صفحهٔ صدور رزرو، خود کارت گام‌ها فراخوان است. */}
      {onHome ? (
        <aside className="mobile-cta" aria-label="شروع رزرو" data-float-guard="">
          <p>
            <strong>مهمان ما باشید</strong>
            <span>اقامت کاملاً رایگان</span>
          </p>
          <a className="btn btn-primary" href="#quick-search">
            انتخاب زمان اقامت <Icon name="arrow-left" size={18} />
          </a>
        </aside>
      ) : null}
      <nav className="mobile-bottom" aria-label="میان‌بُرها" data-float-guard="">
        <a
          href={SITE.routes.home}
          aria-current={onHome ? "page" : undefined}
          data-active={section === "home" || undefined}
        >
          <Icon name="home" size={22} />
          <span>خانه</span>
        </a>
        {onUnits ? (
          // طرح P-02: «واحدها» زبانهٔ جاری است و «زمان سفر» پنجرهٔ شرایط سفر همین صفحه را باز می‌کند.
          <>
            <a href="#unit-results" aria-current="page" data-active="">
              <Icon name="building" size={22} />
              <span>واحدها</span>
            </a>
            <button type="button" onClick={requestUnitsTrip} aria-haspopup="dialog">
              <Icon name="calendar" size={22} />
              <span>زمان سفر</span>
            </button>
          </>
        ) : (
          <>
            <a
              href={onHome ? "#availability" : destHref("calendar")}
              aria-current={page === "calendar" ? "page" : section === "availability" ? "location" : undefined}
              data-active={section === "availability" || undefined}
            >
              <Icon name="calendar" size={22} />
              <span>زمان‌های آزاد</span>
            </a>
            <Link
              href={destHref("portal") ?? destHref("bookingNav") ?? "/"}
              aria-current={page === "portal" ? "page" : undefined}
            >
              <Icon name="ticket" size={22} />
              <span>رزروهای من</span>
            </Link>
          </>
        )}
        <AccountTrigger>
          <Icon name="user" size={22} />
          <span>حساب</span>
        </AccountTrigger>
      </nav>
    </>
  );
}
