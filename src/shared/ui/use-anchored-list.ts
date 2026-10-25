"use client";
import { type RefObject, useLayoutEffect } from "react";

const GAP = 6;
const EDGE = 12;
const MAX = 248;

/**
 * فهرست بازشو در «لایهٔ بالایی» مرورگر (‎popover="manual"‎) ⇒ هیچ ظرف پیمایش‌پذیری (بدنهٔ پنجره، برگهٔ
 * موبایل) آن را نمی‌بُرد. جایش کنار کنترل اندازه‌گیری می‌شود؛ اگر پایین جا نباشد رو به بالا باز می‌شود و با
 * پیمایش/تغییر اندازه/صفحه‌کلید مجازی همراه کنترل می‌ماند. CSSOM ⇒ سازگار با CSP (بی ‎style=‎ در JSX).
 */
export function useAnchoredList(
  open: boolean,
  controlRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
  { max = MAX, dep = 0 }: { max?: number; dep?: unknown } = {},
) {
  useLayoutEffect(() => {
    const list = listRef.current;
    const control = controlRef.current;
    if (!list || !control || typeof list.showPopover !== "function") return;
    if (!open) {
      if (list.matches(":popover-open")) list.hidePopover();
      return;
    }
    if (!list.matches(":popover-open")) list.showPopover();
    const place = () => {
      const r = control.getBoundingClientRect();
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const below = vh - r.bottom - EDGE - GAP;
      const above = r.top - EDGE - GAP;
      const want = Math.min(list.scrollHeight, max);
      const up = below < Math.min(want, 176) && above > below;
      const s = list.style;
      s.left = `${Math.round(r.left)}px`;
      s.width = `${Math.round(r.width)}px`;
      s.maxHeight = `${Math.max(120, Math.min(max, up ? above : below))}px`;
      s.top = up ? "auto" : `${Math.round(r.bottom + GAP)}px`;
      s.bottom = up ? `${Math.round(vh - r.top + GAP)}px` : "auto";
      list.dataset.side = up ? "top" : "bottom";
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [open, controlRef, listRef, max, dep]);
}
