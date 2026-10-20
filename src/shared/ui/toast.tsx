"use client";
import { useSyncExternalStore } from "react";
import { Icon, type IconName } from "./Icon";

/** اعلان‌های کوتاه (جایگزین alert): صف کوچک، ناحیهٔ aria-live، حذف خودکار. */
type Toast = { id: number; text: string; tone: "info" | "success" | "warn"; icon: IconName };
let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, tone: Toast["tone"] = "info") {
  const icon: IconName = tone === "success" ? "check" : tone === "warn" ? "info" : "info";
  const t = { id: ++seq, text, tone, icon };
  toasts = [...toasts.slice(-2), t];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    emit();
  }, 4200);
}

const EMPTY: Toast[] = [];
export function Toaster() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          <Icon name={t.icon} size={18} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
