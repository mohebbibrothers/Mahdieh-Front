"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { meQuery } from "@/shared/api/queries";
import { destHref } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { openAccount, type AccountIntent } from "./account-store";

/**
 * دکمهٔ حساب سربرگ (طراح: کپسول بالای ۱۱۲۰، دایره در ۹۰۱–۱۱۲۰، پنهان در ≤۹۰۰).
 * پنجرهٔ درون‌برنامه‌ای باز می‌کند؛ پیش‌فرض ایستا = «ورود» تا فلاش نداشته باشد.
 */
export function AccountButton() {
  const me = useQuery(meQuery);
  const user = me.data;
  if (user) {
    const name = user.first_name || user.display_name || "زائر";
    return (
      <button
        type="button"
        className="account-button"
        data-state="in"
        aria-haspopup="dialog"
        aria-label={`حساب من — ${name}`}
        onClick={() => openAccount()}
      >
        <span className="account-button__avatar" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <span className="account-button__label">حساب من</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="account-button"
      data-state="out"
      aria-haspopup="dialog"
      onClick={() => openAccount()}
    >
      <Icon name="user" size={18} />
      <span className="account-button__label">ورود / ثبت‌نام</span>
    </button>
  );
}

/**
 * هر «پیوندِ» نیازمند حساب (رزروهای من، تکمیل اطلاعات…) — دکمه‌ای با ظاهر دلخواه که
 * همان پنجره را باز می‌کند. برای مهمان، `guestReason` بالای فرم ورود دیده می‌شود.
 */
export function AccountTrigger({
  className,
  children,
  guestReason,
  intent,
  onOpen,
  portal = false,
}: {
  className?: string;
  children: ReactNode;
  guestReason?: string;
  intent?: AccountIntent;
  onOpen?: () => void;
  /** «رزروهای من»/«جزئیات رزرو»: با انتشار پرتال زائر (P-07) پیوند مستقیم آن می‌شود. */
  portal?: boolean;
}) {
  const me = useQuery(meQuery);
  const portalHref = portal ? destHref("portal") : null;
  if (portalHref) {
    return (
      <Link className={className} href={portalHref} onClick={() => onOpen?.()}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cx("account-trigger", className)}
      aria-haspopup="dialog"
      onClick={() => {
        onOpen?.();
        openAccount({ ...intent, ...(me.data || !guestReason ? {} : { reason: guestReason }) });
      }}
    >
      {children}
    </button>
  );
}
