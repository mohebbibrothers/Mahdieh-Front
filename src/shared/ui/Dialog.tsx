"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "@/shared/lib/cx";

/**
 * پنجرهٔ درون‌برنامه‌ای (بدون alert/confirm) بر پایهٔ <dialog> بومی مرورگر:
 * showModal() ⇒ لایهٔ بالا (top layer)، بی‌اثر شدن (inert) بقیهٔ صفحه، تلهٔ فوکوس، Esc و
 * بازگرداندن فوکوس به دکمهٔ بازکننده — بی‌نیاز از کتابخانه و بدون style درون‌خطی (سازگار با CSP).
 * کلیک روی پس‌زمینه می‌بندد؛ در موبایل «برگهٔ پایینی» با دستگیره. ورود با @starting-style در CSS.
 */
export function AppDialog({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  badge,
  children,
  actions,
  size = "md",
  closeLabel = "بستن",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    else if (!isOpen && d.open) d.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      className={cx("app-dialog", `app-dialog--${size}`)}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subId : undefined}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        // کلیک دقیقاً روی خود <dialog> یعنی روی ::backdrop (محتوا کل کادر را پر می‌کند).
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {isOpen ? (
        <div className="app-dialog__inner">
          <div className="app-dialog__handle" aria-hidden="true" />
          <header className="app-dialog__head">
            <div className="app-dialog__titles">
              <h2 id={titleId} className="app-dialog__title">
                {title}
              </h2>
              {subtitle ? (
                <p id={subId} className="app-dialog__sub">
                  {subtitle}
                </p>
              ) : null}
              {badge}
            </div>
            <button
              type="button"
              className="icon-button app-dialog__close"
              onClick={() => ref.current?.close()}
              aria-label={closeLabel}
            >
              <Icon name="x" size={18} />
            </button>
          </header>
          <div className="app-dialog__body">{children}</div>
          {actions ? <footer className="app-dialog__actions">{actions}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
