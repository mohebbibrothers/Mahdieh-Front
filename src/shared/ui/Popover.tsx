"use client";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { type FloatAlign, useFloating } from "./floating";

export type PopoverAnchor =
  | "arrival"
  | "duration"
  | "theme"
  | "stamp-start-date"
  | "stamp-start-time"
  | "stamp-end-date"
  | "stamp-end-time"
  | "calendar-from";

/** پاپ‌اورهای جست‌وجوی سریع زیر کل فیلد (پس از متن راهنما) باز می‌شوند، نه زیر خود دکمه. */
const FIELD_ANCHORED = new Set<PopoverAnchor>(["arrival", "duration"]);
/** در گوشی برگهٔ پایینی‌اند (همهٔ پاپ‌اورها جز منوی کوچک تم که کنار دکمه‌اش می‌ماند). */
const SHEET_QUERY = "(max-width: 620px)";

/**
 * پاپ‌اور بومی (HTML popover): بستن با Esc و کلیک بیرون، لایهٔ بالا، بازگشت فوکوس — از خود مرورگر.
 * جای‌گذاری با موتور مشترک ‎useFloating‎: درون «ناحیهٔ امن» میان سرصفحه و نوارهای پایین؛ با پیمایش همراه
 * دکمه می‌ماند و اگر دکمه زیر سرصفحه/نوار پایین برود خودبه‌خود بسته می‌شود (هرگز روی آن‌ها نمی‌رود).
 * محتوا فقط هنگام باز بودن رندر می‌شود؛ با باز شدن، فوکوس به گزینهٔ انتخاب‌شده (یا نخستین کنترل) می‌رود.
 */
export function Popover({
  anchor,
  label,
  className,
  align = "start",
  trigger,
  children,
}: {
  anchor: PopoverAnchor;
  label: string;
  className?: string;
  align?: FloatAlign;
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
  const anchorRef = useRef<Element | null>(null);
  const [open, setOpen] = useState(false);
  const menu = anchor === "theme";
  // با شناسه (نه ref) تا بتوان آن را هنگام رندر به فرزندان داد.
  const close = () => document.getElementById(id)?.hidePopover();

  useFloating(open, anchorRef, ref, { align, sheet: menu ? null : SHEET_QUERY, onHidden: close });
  // پس از نخستین جای‌گذاری دیده می‌شود (بی پرش از گوشهٔ صفحه به کنار دکمه).
  useLayoutEffect(() => {
    if (open) delete ref.current?.dataset.placing;
  }, [open]);

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
        onBeforeToggle={(e) => {
          if (e.newState !== "open") return;
          const el = e.currentTarget;
          const btn = document.querySelector(`[popovertarget="${CSS.escape(id)}"]`);
          anchorRef.current = (FIELD_ANCHORED.has(anchor) ? btn?.closest(".form-field") : null) ?? btn;
          el.dataset.placing = "";
        }}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) {
            requestAnimationFrame(() => {
              const el = ref.current;
              const target =
                el?.querySelector<HTMLElement>("[data-autofocus]") ??
                el?.querySelector<HTMLElement>('[aria-pressed="true"], button, a[href]');
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
