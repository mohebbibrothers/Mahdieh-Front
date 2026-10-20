"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { meQuery } from "@/shared/api/queries";
import { SITE, loginHref } from "@/shared/config/site";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { NAV } from "@/shared/config/nav";

export function MobileMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const me = useQuery(meQuery);
  return (
    <>
      <button
        type="button"
        className="icon-button mobile-menu-button"
        aria-label="فهرست صفحه‌ها"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={20} />
      </button>
      <AppDialog isOpen={open} onOpenChange={setOpen} title="در مهدیه" size="sm" closeLabel="بستن فهرست">
        <nav className="sheet-nav" aria-label="ناوبری">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
            </a>
          ))}
          {me.data ? (
            <a href={SITE.routes.my}>
              <Icon name="ticket" size={20} />
              <span>رزروهای من</span>
              <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
            </a>
          ) : (
            <a href={loginHref(current)}>
              <Icon name="user" size={20} />
              <span>ورود یا ثبت‌نام با شمارهٔ همراه</span>
              <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
            </a>
          )}
        </nav>
      </AppDialog>
    </>
  );
}
