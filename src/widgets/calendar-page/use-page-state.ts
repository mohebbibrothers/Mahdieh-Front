"use client";
import { useSyncExternalStore } from "react";
import { INITIAL_STATE, readState, writeState, type PageState } from "./model";

/**
 * حالت صفحهٔ تقویم — فروشگاه بیرونی کوچک + همگامی با نشانی (قابل اشتراک، «بازگشت» مرورگر و تحویل
 * مستقیم به P-05 با همان پارامترها). نخستین اشتراک، نشانی را می‌خواند؛ هر تغییر با ‎replaceState‎
 * (تأخیر کوتاه، بی انباشت تاریخچه) نوشته می‌شود.
 */
type Listener = () => void;
let state: PageState = INITIAL_STATE;
let hydrated = false;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setTimeout> | undefined;

function persist(s: PageState) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const next = writeState(s, window.location.href);
    if (next !== window.location.href) window.history.replaceState(null, "", next);
  }, 200);
}

export const pageStore = {
  get: () => state,
  set(patch: Partial<PageState> | ((s: PageState) => Partial<PageState>)) {
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    if ((Object.keys(next) as Array<keyof PageState>).every((k) => next[k] === state[k])) return;
    state = next;
    persist(state);
    for (const l of listeners) l();
  },
  subscribe(l: Listener) {
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      state = readState(window.location.search);
      queueMicrotask(() => {
        for (const x of listeners) x();
      });
    }
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function usePageState(): PageState {
  return useSyncExternalStore(pageStore.subscribe, pageStore.get, () => INITIAL_STATE);
}
