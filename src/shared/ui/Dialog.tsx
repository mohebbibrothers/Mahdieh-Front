"use client";
import type { ReactNode } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Icon } from "./Icon";
import { cx } from "@/shared/lib/cx";

/**
 * پنجرهٔ درون‌برنامه‌ای (بدون alert/confirm): تلهٔ فوکوس، Esc، بازگرداندن فوکوس، قفل اسکرول
 * از React Aria؛ در موبایل «برگهٔ پایینی» با دستگیره، در دسکتاپ کارت میانی.
 * ورود/خروج با CSS و ویژگی‌های data-entering/data-exiting (بدون style درون‌خطی ⇒ سازگار با CSP).
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
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="dialog-overlay">
      <Modal className={cx("app-dialog", `app-dialog--${size}`)}>
        <AriaDialog className="app-dialog__inner">
          {({ close }) => (
            <>
              <div className="app-dialog__handle" aria-hidden="true" />
              <header className="app-dialog__head">
                <div className="app-dialog__titles">
                  <Heading slot="title" className="app-dialog__title">
                    {title}
                  </Heading>
                  {subtitle ? <p className="app-dialog__sub">{subtitle}</p> : null}
                  {badge}
                </div>
                <button type="button" className="icon-button app-dialog__close" onClick={close} aria-label={closeLabel}>
                  <Icon name="x" size={18} />
                </button>
              </header>
              <div className="app-dialog__body">{children}</div>
              {actions ? <footer className="app-dialog__actions">{actions}</footer> : null}
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
