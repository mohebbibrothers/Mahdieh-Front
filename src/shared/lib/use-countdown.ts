"use client";
import { useEffect, useState } from "react";

/** ثانیه‌های باقی‌مانده تا `deadline` (میلی‌ثانیهٔ epoch)؛ هر ثانیه به‌روز، در صفر می‌ایستد. */
export function useCountdown(deadline: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) clearInterval(id);
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [deadline]);
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/** ‎۰۱:۵۸‎ */
export function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
