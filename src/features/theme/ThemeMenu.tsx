"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Button, Menu, MenuItem, MenuTrigger, Popover, type Selection } from "react-aria-components";
import { Icon } from "@/shared/ui/Icon";
import { readStorage, writeStorage } from "@/shared/lib/storage";
import { THEME_KEY } from "@/shared/config/keys";

type Pref = "light" | "dark" | "system";
const OPTIONS: Array<{ id: Pref; label: string; hint: string; icon: "sun" | "moon" | "sliders" }> = [
  { id: "light", label: "روشن", hint: "زمینهٔ کرم و سبز", icon: "sun" },
  { id: "dark", label: "شب", hint: "آرام برای چشم در شب", icon: "moon" },
  { id: "system", label: "هماهنگ با دستگاه", hint: "پیروی از تنظیم گوشی یا رایانه", icon: "sliders" },
];

const listeners = new Set<() => void>();
function currentPref(): Pref {
  const v = readStorage(THEME_KEY);
  return v === "light" || v === "dark" ? v : "system";
}
function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = dark ? "dark" : "light";
  for (const el of [document.documentElement, document.body]) el.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme-pref", pref);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#132823" : "#f7f6f0");
}
function setPref(pref: Pref) {
  writeStorage(THEME_KEY, pref === "system" ? null : pref);
  // جابه‌جایی نرم با View Transitions (اگر مرورگر پشتیبانی کند و کاربر حرکت را کم نکرده باشد).
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "startViewTransition" in document) document.startViewTransition(() => apply(pref));
  else apply(pref);
  listeners.forEach((l) => l());
}

export function ThemeMenu() {
  const pref = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    currentPref,
    () => "system" as Pref,
  );

  // همگامی با تغییر تم دستگاه در حالت «هماهنگ» و هم‌ترازی body با html.
  useEffect(() => {
    apply(currentPref());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => currentPref() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <MenuTrigger>
      <Button className="icon-button theme-toggle" aria-label="ظاهر سایت: روشن، شب یا هماهنگ با دستگاه">
        <Icon name="sun" size={20} className="theme-icon theme-icon--sun" />
        <Icon name="moon" size={20} className="theme-icon theme-icon--moon" />
      </Button>
      <Popover placement="bottom end" offset={10} className="menu-popover">
        <Menu
          aria-label="ظاهر سایت"
          className="menu"
          selectionMode="single"
          selectedKeys={new Set([pref])}
          disallowEmptySelection
          onSelectionChange={(keys: Selection) => {
            const [k] = keys === "all" ? [] : [...keys];
            if (k === "light" || k === "dark" || k === "system") setPref(k);
          }}
        >
          {OPTIONS.map((o) => (
            <MenuItem key={o.id} id={o.id} className="menu__item" textValue={o.label}>
              <Icon name={o.icon} size={18} />
              <span className="menu__text">
                <strong>{o.label}</strong>
                <small>{o.hint}</small>
              </span>
              <Icon name="check" size={16} className="menu__check" />
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
