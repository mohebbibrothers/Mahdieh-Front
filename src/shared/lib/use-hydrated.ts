"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** true فقط پس از hydration — برای محتوایی که به «اکنون» یا دستگاه کاربر وابسته است. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
