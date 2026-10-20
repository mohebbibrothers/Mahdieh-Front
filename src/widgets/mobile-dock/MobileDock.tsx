"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AccountAction } from "@/features/session/SessionActions";
import { meQuery } from "@/shared/api/queries";
import { Icon } from "@/shared/ui/Icon";

/**
 * موبایل (طرح P-01): نوار فراخوان + چهار زبانهٔ پایینی با فاصلهٔ امن iOS —
 * خانه · زمان‌های آزاد · رزروهای من · حساب. دو زبانهٔ آخر برای مهمان پنجرهٔ ورود و
 * برای کاربر واردشده برگهٔ حساب را باز می‌کنند.
 */
export function MobileDock() {
  const me = useQuery(meQuery);
  const user = me.data;
  const active = useSectionSpy();
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
        <a href="#main-content" aria-current={active === "home" ? "page" : undefined}>
          <Icon name="home" size={22} />
          <span>خانه</span>
        </a>
        <a href="#availability" aria-current={active === "availability" ? "location" : undefined}>
          <Icon name="calendar" size={22} />
          <span>زمان‌های آزاد</span>
        </a>
        <AccountAction intent="portal">
          <Icon name="ticket" size={22} />
          <span>رزروهای من</span>
        </AccountAction>
        <AccountAction intent="account">
          {user ? (
            <span className="mobile-bottom__avatar" aria-hidden="true">
              {(user.first_name || user.display_name || "ز").slice(0, 1)}
            </span>
          ) : (
            <Icon name="user" size={22} />
          )}
          <span>{user ? "حساب من" : "ورود"}</span>
        </AccountAction>
      </nav>
    </>
  );
}

/** کدام زبانه فعال است: بخش زمان‌های آزاد در میانهٔ دید ⇒ «زمان‌های آزاد»، وگرنه «خانه». */
function useSectionSpy(): "home" | "availability" {
  const [active, setActive] = useState<"home" | "availability">("home");
  useEffect(() => {
    const el = document.getElementById("availability");
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setActive(e?.isIntersecting ? "availability" : "home"), {
      rootMargin: "-45% 0px -45% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return active;
}
