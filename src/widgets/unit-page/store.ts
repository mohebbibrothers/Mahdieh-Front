"use client";
import { useSyncExternalStore, type MouseEvent } from "react";
import { INITIAL_STATE, readState, writeState, type Trip } from "@/widgets/units-page/model";
import { codeFromPath } from "./model";

/**
 * حالت صفحهٔ واحد = نشانی: کد واحد از مسیر (‎/units/A1/‎) و شرایط سفر از پرس‌وجو
 * (‎day/period/cells/guests‎ — همان قرارداد P-02، P-04 و P-05).
 *
 * یک قالب ایستا برای همهٔ واحدها صادر می‌شود، پس کد فقط سمت کاربر خوانده می‌شود: پیش‌رندر و
 * نخستین رندر hydration «نامعلوم» (‎null‎) می‌بینند ⇒ اسکلت؛ سپس نشانی واقعی. جابه‌جایی میان
 * واحدها بی بارگذاری دوباره با ‎pushState‎ (دکمهٔ «بازگشت» مرورگر واحد قبلی را برمی‌گرداند).
 */
export type UnitPageState = { code: string | null; trip: Trip };

type Listener = () => void;
const listeners = new Set<Listener>();
let snap: UnitPageState | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function read(): UnitPageState {
  return { code: codeFromPath(window.location.pathname), trip: readState(window.location.search).trip };
}

function emit() {
  for (const l of listeners) l();
}

function onPop() {
  snap = read();
  emit();
}

/** نشانی همان صفحه با شرایط سفر تازه (پارامترهای دیگر دست‌نخورده). */
function hrefWith(trip: Trip, pathname?: string): string {
  const url = new URL(writeState({ ...INITIAL_STATE, trip }, window.location.href));
  if (pathname) {
    url.pathname = pathname;
    url.hash = "";
  }
  return url.toString();
}

export const unitPageStore = {
  get: () => snap,
  subscribe(l: Listener) {
    if (!listeners.size) {
      snap = read();
      window.addEventListener("popstate", onPop);
      queueMicrotask(emit);
    }
    listeners.add(l);
    return () => {
      listeners.delete(l);
      if (!listeners.size) window.removeEventListener("popstate", onPop);
    };
  },
  setTrip(trip: Trip) {
    if (!snap) return;
    const t = snap.trip;
    if (t.day === trip.day && t.period === trip.period && t.cells === trip.cells && t.guests === trip.guests) return;
    snap = { ...snap, trip };
    emit();
    clearTimeout(timer);
    timer = setTimeout(() => {
      const next = hrefWith(trip);
      if (next !== window.location.href) window.history.replaceState(window.history.state, "", next);
    }, 200);
  },
  /** رفتن به واحد دیگر با همان شرایط سفر (بی بارگذاری دوباره). */
  go(code: string) {
    if (!snap || code === snap.code) return;
    clearTimeout(timer);
    const next = hrefWith(snap.trip, `/units/${encodeURIComponent(code)}/`);
    window.history.pushState(null, "", next);
    snap = { ...snap, code };
    emit();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  },
};

export function useUnitPageState(): UnitPageState | null {
  return useSyncExternalStore(unitPageStore.subscribe, unitPageStore.get, () => null);
}

/** پیوند واحد دیگر: کلیک سادهٔ چپ ⇒ جابه‌جایی درون‌برنامه‌ای؛ باز کردن در زبانهٔ تازه دست‌نخورده. */
export function goUnit(e: MouseEvent, code: string) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  unitPageStore.go(code);
}
