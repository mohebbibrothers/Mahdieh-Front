import type { ReactNode } from "react";
import type { RailEdges } from "@/shared/lib/use-scroll-rail";
import { Icon } from "@/shared/ui/Icon";

/**
 * قاب نوار پیمایش افقی: دو دکمهٔ گرد در دو لبه + محوشدگی نرم لبه‌ها، فقط وقتی جایی برای رفتن هست.
 * دکمه‌ها کمک موس/لمس‌اند؛ کاربر صفحه‌کلید با جهت‌نماها در خود نوار جابه‌جا می‌شود، پس از ترتیب Tab
 * و صفحه‌خوان بیرون‌اند (بی‌تکرار و بی‌ایست اضافه).
 */
export function RailFrame({
  edges,
  onStep,
  className,
  children,
}: {
  edges: RailEdges;
  onStep: (dir: 1 | -1) => void;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className={className ? `rail-frame ${className}` : "rail-frame"}
      data-overflow={edges.overflow || undefined}
      data-at-start={edges.atStart || undefined}
      data-at-end={edges.atEnd || undefined}
    >
      <button
        type="button"
        className="rail-frame__btn rail-frame__btn--prev"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => onStep(-1)}
      >
        <Icon name="arrow-right" size={18} />
      </button>
      {children}
      <button
        type="button"
        className="rail-frame__btn rail-frame__btn--next"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => onStep(1)}
      >
        <Icon name="arrow-left" size={18} />
      </button>
    </div>
  );
}
