"use client";
import { useSyncExternalStore } from "react";
import type { Period } from "@/entities/slot/timeline";
import { destHref } from "@/shared/config/destinations";

/**
 * پیش‌نویس رزرو — حالت مشترک ساختمان، جست‌وجو، تقویم و دیالوگ واحد.
 * فروشگاه بیرونیِ کوچک (بدون وابستگی) + همگامی با نشانی صفحه (قابل اشتراک و بازگشت).
 */
export type Draft = {
  day: string | null;
  period: Period;
  cells: number;
  guests: number;
  floor: 0 | 1 | 2 | 3;
  view: "building" | "list";
  /** واحدی که دیالوگ جزئیاتش باز است. */
  openUnit: string | null;
  /** کاربر جست‌وجو را اجرا کرده ⇒ نتایج نمایش داده شود. */
  searched: boolean;
};

export const INITIAL_DRAFT: Draft = {
  day: null,
  period: "day",
  cells: 4,
  guests: 4,
  floor: 0,
  view: "building",
  openUnit: null,
  searched: false,
};

type Listener = () => void;
let state: Draft = INITIAL_DRAFT;
const listeners = new Set<Listener>();
let hydratedFromUrl = false;

function readUrl(): Partial<Draft> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<Draft> = {};
  const day = p.get("day");
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) out.day = day;
  const period = p.get("period");
  if (period === "day" || period === "night") out.period = period;
  const cells = Number(p.get("cells"));
  if (Number.isInteger(cells) && cells >= 1 && cells <= 62) out.cells = cells;
  const guests = Number(p.get("guests"));
  if (Number.isInteger(guests) && guests >= 1 && guests <= 60) out.guests = guests;
  if (out.day) out.searched = true;
  return out;
}

let urlTimer: ReturnType<typeof setTimeout> | undefined;
function writeUrl(d: Draft) {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const url = new URL(window.location.href);
    if (d.searched && d.day) {
      url.searchParams.set("day", d.day);
      url.searchParams.set("period", d.period);
      url.searchParams.set("cells", String(d.cells));
      url.searchParams.set("guests", String(d.guests));
    } else {
      for (const k of ["day", "period", "cells", "guests"]) url.searchParams.delete(k);
    }
    if (url.href !== window.location.href) window.history.replaceState(null, "", url); // null ⇒ Next همگام می‌شود (نه state داخلی __NA)
  }, 250);
}

export const draftStore = {
  get: () => state,
  set(patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) {
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    if (Object.keys(next).every((k) => next[k as keyof Draft] === state[k as keyof Draft])) return;
    state = next;
    writeUrl(state);
    for (const l of listeners) l();
  },
  subscribe(l: Listener) {
    if (!hydratedFromUrl && typeof window !== "undefined") {
      hydratedFromUrl = true;
      state = { ...state, ...readUrl() };
      queueMicrotask(() => {
        for (const x of listeners) x();
      });
    }
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useDraft<T>(selector: (d: Draft) => T): T {
  return useSyncExternalStore(
    draftStore.subscribe,
    () => selector(draftStore.get()),
    () => selector(INITIAL_DRAFT),
  );
}

/** پیوند تحویل به فرم رزرو جنگو (‎BookView‎ همین پارامترها را می‌خواند). */
/**
 * مقصد «ادامهٔ رزرو» با انتخاب فعلی ⇒ صفحهٔ «تکمیل و صدور رزرو» (P-05) از نقشهٔ مقصدها؛
 * تا ساخته نشدن آن ‎null‎ (هرگز قالب قدیمی ‎/book/‎ جنگو).
 */
export function bookingHref(unit: string, d: Pick<Draft, "day" | "period" | "cells" | "guests">): string | null {
  return destHref("booking", {
    unit,
    ...(d.day ? { day: d.day } : {}),
    period: d.period,
    cells: String(d.cells),
    guests: String(d.guests),
  });
}
