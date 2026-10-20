"use client";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/shared/api/queries";
import { SITE, loginHref } from "@/shared/config/site";
import { Icon } from "@/shared/ui/Icon";

/** ورود (مهمان) یا «رزروهای من» (واردشده) — بدون فلاش: پیش‌فرض ایستا = ورود. */
export function AccountButton() {
  const me = useQuery(meQuery);
  const user = me.data;
  if (user) {
    const name = user.first_name || user.display_name || "زائر";
    return (
      <a className="account-button" href={SITE.routes.my} data-state="in">
        <span className="account-button__avatar" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <span className="account-button__text">
          <span className="account-button__full">رزروهای من</span>
          <span className="account-button__short">حساب</span>
        </span>
      </a>
    );
  }
  return (
    <a className="account-button" href={loginHref("/")} data-state="out">
      <Icon name="user" size={18} />
      <span className="account-button__text">
        <span className="account-button__full">ورود / ثبت‌نام</span>
        <span className="account-button__short">ورود</span>
      </span>
    </a>
  );
}
