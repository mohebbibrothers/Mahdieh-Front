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

/*
 * «اکنون» امن برای پیش‌رندر: در سرور و لحظهٔ hydration ‎null‎ است (HTML ساخته‌شده هرگز تاریخ
 * روز ساخت را در خود ندارد ⇒ خطای ۴۱۸ ناهمخوانی متن رخ نمی‌دهد)، بلافاصله پس از hydration زمان
 * واقعی کاربر را می‌دهد و هر ‎intervalMs‎ یک‌بار به‌روز می‌شود. تصویر به همان گام گرد می‌شود تا پایدار
 * بماند (getSnapshot باید در فراخوانی‌های پیاپی یک مقدار بدهد).
 */
const everyCache = new Map<number, (cb: () => void) => () => void>();
function subscribeEvery(intervalMs: number) {
  let sub = everyCache.get(intervalMs);
  if (!sub) {
    sub = (cb) => {
      const t = setInterval(cb, intervalMs);
      return () => clearInterval(t);
    };
    everyCache.set(intervalMs, sub);
  }
  return sub;
}
const serverNull = () => null;

export function useHydratedNow(intervalMs = 30_000): number | null {
  return useSyncExternalStore(
    subscribeEvery(intervalMs),
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    serverNull,
  );
}
