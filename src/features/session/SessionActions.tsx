"use client";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { meQuery } from "@/shared/api/queries";
import { PAGES } from "@/shared/config/site";
import { announceSoon } from "@/shared/ui/PageLink";
import { openAccountSheet, openLogin, type LoginIntent } from "./auth-store";

/**
 * «حساب / رزروهای من» در هر جای صفحه: مهمان ⇒ پنجرهٔ ورود، واردشده ⇒ برگهٔ حساب
 * (تا ساخت پرتال زائر P-07؛ پس از آن مستقیم به پرتال می‌رود).
 */
export function AccountAction({
  className,
  children,
  intent = "account",
  current,
}: {
  className?: string;
  children: ReactNode;
  intent?: LoginIntent;
  current?: boolean;
}) {
  const me = useQuery(meQuery);
  if (PAGES.portal.ready && me.data && intent === "portal") {
    return (
      <a href={PAGES.portal.path} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      aria-current={current ? "page" : undefined}
      onClick={() => (me.data ? openAccountSheet() : openLogin(intent))}
    >
      {children}
    </button>
  );
}

/**
 * «ادامهٔ رزرو با این واحد»: مهمان ⇒ ورود همین‌جا؛ واردشده ⇒ صفحهٔ تکمیل رزرو (P-05).
 * تا آماده شدن P-05 به صفحهٔ قدیمی نمی‌رود؛ انتخاب در پیش‌نویس (حافظهٔ نشست) می‌ماند.
 */
export function ContinueBooking({
  className,
  href,
  guestLabel,
  children,
}: {
  className?: string;
  href: string;
  guestLabel: ReactNode;
  children: ReactNode;
}) {
  const me = useQuery(meQuery);
  if (me.data && PAGES.booking.ready) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-haspopup={me.data ? undefined : "dialog"}
      onClick={() => (me.data ? announceSoon("booking", "انتخاب شما همین‌جا نگه داشته شد.") : openLogin("booking"))}
    >
      {me.data ? children : guestLabel}
    </button>
  );
}
