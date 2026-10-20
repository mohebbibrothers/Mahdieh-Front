import Link from "next/link";
import type { ReactNode } from "react";
import { destHref, type DestKey } from "@/shared/config/destinations";

/**
 * پیوند به صفحه‌ای از نقشهٔ مقصدها. اگر صفحه هنوز ساخته نشده و جایگزین درون‌صفحه‌ای ندارد،
 * هیچ چیز رندر نمی‌شود (نه پیوند مرده، نه بازگشت به همین صفحه) — با انتشار صفحه خودکار ظاهر می‌شود.
 */
export function PageLink({
  to,
  query,
  className,
  children,
}: {
  to: DestKey;
  query?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const href = destHref(to, query);
  if (!href) return null;
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
