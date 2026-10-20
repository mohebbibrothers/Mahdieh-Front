"use client";
import { useSyncExternalStore } from "react";

/**
 * ساعت ثانیه‌ای مشترک برای شمارش معکوس‌ها — فقط وقتی مصرف‌کننده‌ای هست تیک می‌زند.
 * Date.now() داخل getSnapshot است (نه در رندر) و به ثانیه گرد می‌شود تا تصویر پایدار بماند.
 */
const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 1000);
  return () => clearInterval(t);
};
const snapshot = () => Math.floor(Date.now() / 1000) * 1000;
const server = () => 0;

export function useClock(enabled = true): number {
  return useSyncExternalStore(enabled ? subscribe : noop, snapshot, server);
}
function noop() {
  return () => {};
}
