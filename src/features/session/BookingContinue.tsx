"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { meQuery } from "@/shared/api/queries";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { openAccount } from "./account-store";

/**
 * «ادامهٔ رزرو» با یک واحد — هرگز به قالب قدیمی جنگو نمی‌رود.
 *  · صفحهٔ «تکمیل و صدور رزرو» (P-05) آماده ⇒ پیوند مستقیم با پارامترهای انتخاب برای همه؛ مهمان در
 *    گام ۱ همان صفحه با شمارهٔ همراه وارد می‌شود (برچسب ‎guestLabel‎ همین را می‌گوید).
 *  · P-05 نیست + مهمان ⇒ ورود درون‌برنامه‌ای همین‌جا (پیش‌نیاز رزرو).
 *  · P-05 نیست + واردشده ⇒ دکمهٔ «به‌زودی» (aria-disabled، قابل فوکوس) که صادقانه توضیح می‌دهد.
 * `href` را لایهٔ بالاتر از نقشهٔ مقصدها می‌دهد (این ویژگی به پیش‌نویس رزرو وابسته نیست).
 */
/** ‎href‎ از نقشهٔ مقصدها می‌آید (همان‌جا به ‎Route‎ تبدیل و با آزمون واحد تضمین شده است). */
const asRoute = (href: string) => href as Route;

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

  if (href) {
    return (
      <Link className={className} href={asRoute(href)}>
        {me.data ? label : guestLabel} {arrow}
      </Link>
    );
  }
  if (!me.data) {
    return (
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => openAccount({ reason })}>
        {guestLabel} {arrow}
      </button>
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
