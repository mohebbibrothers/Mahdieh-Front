"use client";
import type { ReactNode } from "react";
import { PAGES, pageHref, type PageKey } from "@/shared/config/site";
import { toast } from "./toast";

/** اعلان یکدست برای صفحه‌ای که هنوز در فرانت جدید ساخته نشده است. */
export function announceSoon(key: PageKey, extra?: string) {
  toast(`«${PAGES[key].title}» در مرحلهٔ بعدیِ ساخت آماده می‌شود.${extra ? ` ${extra}` : ""}`, "info");
}

/**
 * پیوند به یک صفحهٔ فرانت؛ اگر صفحه آماده نیست و جایگزینی ندارد، به‌جای رفتن به صفحهٔ
 * قدیمی، دکمه‌ای با همان ظاهر می‌شود که «به‌زودی» را اعلام می‌کند.
 * `query` فقط وقتی صفحه آماده است به نشانی افزوده می‌شود.
 */
export function PageLink({
  page,
  query,
  className,
  children,
  onSoon,
  noFallback = false,
}: {
  page: PageKey;
  /** پیوندی که خودش درون بخشِ جایگزین است (مثلاً «تقویم کامل» در بخش تقویم) جایگزین نمی‌خواهد. */
  noFallback?: boolean;
  query?: string;
  className?: string;
  children: ReactNode;
  onSoon?: () => void;
}) {
  const href = noFallback && !PAGES[page].ready ? null : pageHref(page);
  if (href) {
    const full = PAGES[page].ready && query ? `${href}?${query}` : href;
    return (
      <a href={full} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} data-soon="" onClick={() => (onSoon ? onSoon() : announceSoon(page))}>
      {children}
    </button>
  );
}
