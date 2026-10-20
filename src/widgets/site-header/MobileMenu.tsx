"use client";
import { useQuery } from "@tanstack/react-query";
import { AccountTrigger } from "@/features/session/AccountButton";
import { useState } from "react";
import { meQuery } from "@/shared/api/queries";
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
          <AccountTrigger className="sheet-nav__item" onOpen={() => setOpen(false)}>
            <Icon name="user" size={20} />
            <span>{me.data ? "حساب من و رزروها" : "ورود یا ثبت‌نام با شمارهٔ همراه"}</span>
            <Icon name="arrow-left" size={18} className="sheet-nav__chev" />
          </AccountTrigger>
        </nav>
      </AppDialog>
    </>
  );
}
