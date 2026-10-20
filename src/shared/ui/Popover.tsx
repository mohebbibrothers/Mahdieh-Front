"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/shared/lib/cx";

export type PopoverAnchor = "arrival" | "duration" | "theme" | "account";

/**
 * پاپ‌اور بومی (HTML popover + CSS Anchor Positioning): بستن با Esc و کلیک بیرون، لایهٔ بالا،
 * بازگشت فوکوس به دکمه — همه از خود مرورگر. مرورگرِ بدون anchor ⇒ «برگهٔ پایینی» (CSS @supports).
 * محتوا فقط هنگام باز بودن رندر می‌شود؛ با باز شدن، فوکوس به گزینهٔ انتخاب‌شده (یا نخستین کنترل) می‌رود.
 */
export function Popover({
  anchor,
  label,
  className,
  trigger,
  children,
}: {
  anchor: PopoverAnchor;
  label: string;
  className?: string;
  trigger: (props: {
    popoverTarget: string;
    "aria-expanded": boolean;
    "aria-controls": string;
    className: string;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // با شناسه (نه ref) تا بتوان آن را هنگام رندر به فرزندان داد.
  const close = () => document.getElementById(id)?.hidePopover();

  return (
    <>
      {trigger({ popoverTarget: id, "aria-expanded": open, "aria-controls": id, className: `anchor--${anchor}` })}
      <div
        ref={ref}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={label}
        className={cx("popover", `popover--${anchor}`, className)}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) {
            requestAnimationFrame(() => {
              const el = ref.current;
              const target = el?.querySelector<HTMLElement>('[aria-pressed="true"], button, a[href]');
              target?.focus({ preventScroll: true });
            });
          }
        }}
      >
        {open ? children(close) : null}
      </div>
    </>
  );
}
