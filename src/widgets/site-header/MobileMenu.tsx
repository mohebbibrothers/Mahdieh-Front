"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { openAccountSheet, openLogin } from "@/features/session/auth-store";
import { meQuery } from "@/shared/api/queries";
import { NAV } from "@/shared/config/nav";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";

/** فهرست موبایل (≤۹۰۰px): ناوبری + ورود/حساب — هیچ موردی به صفحهٔ قدیمی نمی‌رود. */
export function MobileMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const me = useQuery(meQuery);
  const user = me.data;
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
            <a
              key={item.href}
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
            </a>
          ))}
          <button
            type="button"
            className="sheet-nav__account"
            aria-haspopup="dialog"
            onClick={() => {
              setOpen(false);
              if (user) openAccountSheet();
              else openLogin("account");
            }}
          >
            <Icon name="user" size={20} />
            <span>{user ? "حساب من و رزروها" : "ورود یا ثبت‌نام با شمارهٔ همراه"}</span>
            <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
          </button>
        </nav>
      </AppDialog>
    </>
  );
}
