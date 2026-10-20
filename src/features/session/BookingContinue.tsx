"use client";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/shared/api/queries";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { openAccount } from "./account-store";

/**
 * «ادامهٔ رزرو» با یک واحد — هرگز به قالب قدیمی جنگو نمی‌رود.
 *  · مهمان ⇒ ورود درون‌برنامه‌ای همین‌جا (پیش‌نیاز رزرو)؛ اگر صفحهٔ رزرو آماده باشد، پس از ورود به آن می‌رود.
 *  · واردشده + صفحهٔ «تکمیل و صدور رزرو» (P-05) آماده ⇒ پیوند مستقیم با پارامترهای انتخاب.
 *  · واردشده + P-05 هنوز ساخته نشده ⇒ دکمهٔ «به‌زودی» (aria-disabled، قابل فوکوس) که صادقانه
 *    توضیح می‌دهد؛ انتخاب در نشانی صفحه و حافظهٔ مرورگر ذخیره است و با انتشار P-05 خودکار وصل می‌شود.
 * `href` را لایهٔ بالاتر از نقشهٔ مقصدها می‌دهد (این ویژگی به پیش‌نویس رزرو وابسته نیست).
 */
export function BookingContinue({
  href,
  label,
  guestLabel,
  reason,
  className,
  iconSize = 18,
}: {
  href: string | null;
  label: string;
  guestLabel: string;
  reason: string;
  className?: string;
  iconSize?: 16 | 18;
}) {
  const me = useQuery(meQuery);
  const arrow = <Icon name="arrow-left" size={iconSize} />;

  if (!me.data) {
    return (
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={() => openAccount({ ...(href ? { then: href } : {}), reason })}
      >
        {guestLabel} {arrow}
      </button>
    );
  }
  if (href) {
    return (
      <a className={className} href={href}>
        {label} {arrow}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cx(className, "is-soon")}
      aria-disabled="true"
      onClick={() => toast("صدور رزرو با صفحهٔ «تکمیل و صدور رزرو» فعال می‌شود؛ انتخاب شما ذخیره شده است.", "info")}
    >
      {label}
      <span className="soon-badge">به‌زودی</span>
    </button>
  );
}
