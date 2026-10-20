"use client";
import { useSyncExternalStore } from "react";

/**
 * وضعیت پنجرهٔ ورود — یک نمونه برای کل صفحه؛ هر دکمه‌ای (سربرگ، نوار پایین، پنجرهٔ واحد)
 * فقط `openLogin` را صدا می‌زند. `intent` می‌گوید پس از ورود موفق چه پیامی/گامی لازم است.
 */
export type LoginIntent = "account" | "booking" | "portal";
type State = { open: boolean; intent: LoginIntent; account: boolean };

let state: State = { open: false, intent: "account", account: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openLogin(intent: LoginIntent = "account") {
  state = { open: true, intent, account: false };
  emit();
}
/** برگهٔ حساب (نوار پایین موبایل) — فقط برای کاربر واردشده؛ مهمان پنجرهٔ ورود را می‌بیند. */
export function openAccountSheet() {
  state = { ...state, open: false, account: true };
  emit();
}
export function closeAccountSheet() {
  if (!state.account) return;
  state = { ...state, account: false };
  emit();
}
export function closeLogin() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const SERVER: State = { open: false, intent: "account", account: false };
export function useLoginState(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  );
}
