"use client";
import { useSyncExternalStore } from "react";
import { writeStorage } from "@/shared/lib/storage";
import { EASY_KEY } from "@/shared/config/keys";

/** «حالت آسان»: نوشتهٔ بزرگ‌تر، فهرست ساده به‌جای ساختمان سه‌بعدی، حرکت کمتر. */
const listeners = new Set<() => void>();
const read = () => document.documentElement.getAttribute("data-easy") === "true";

export function setEasyMode(on: boolean) {
  if (on) document.documentElement.setAttribute("data-easy", "true");
  else document.documentElement.removeAttribute("data-easy");
  writeStorage(EASY_KEY, on ? "1" : null);
  listeners.forEach((l) => l());
}

export function useEasyMode(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => false,
  );
}
