"use client";
import { useSyncExternalStore } from "react";

/**
 * یک پنجرهٔ «حساب» برای کل برنامه: دکمهٔ سربرگ، کشوی موبایل، نوار پایینی و
 * دکمه‌های نیازمند ورود همه همین را باز می‌کنند (بدون رفتن به صفحهٔ قدیمی ورود).
 * `then` = مقصدی که پس از ورود (و تکمیل پروفایل) باید باز شود.
 */
export type AccountIntent = { then?: string; reason?: string };
type State = { open: boolean; intent: AccountIntent };

let state: State = { open: false, intent: {} };
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

export function openAccount(intent: AccountIntent = {}): void {
  state = { open: true, intent };
  emit();
}
export function closeAccount(): void {
  if (!state.open) return;
  state = { open: false, intent: {} };
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: State = { open: false, intent: {} };
export function useAccountDialog(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  );
}
