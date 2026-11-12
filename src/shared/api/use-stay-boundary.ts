"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { qk } from "./queries";
import type { Reservation } from "./schemas";

const OPEN = new Set(["hold", "confirmed", "checked_in"]);
/** بیشینهٔ مهلت ‎setTimeout‎ (~۲۴٫۸ روز)؛ مرز دورتر با بارگذاری بعدی صفحه دیده می‌شود. */
const MAX_DELAY = 2_147_483_647;

/**
 * لحظه‌ای که نزدیک‌ترین اقامت باز به پایان می‌رسد، وضعیت حساب و فهرست رزروها را تازه می‌کند.
 *
 * صفحه‌ای که باز مانده (پرتال، بنر خانه) نباید پس از پایان اقامت همچنان «۱ رزرو فعال از ۱» و
 * «امکان رزرو تازه ندارید» نشان دهد: سرور از همان لحظه آن اقامت را فعال نمی‌شمارد، پس همان لحظه
 * (با دو ثانیه حاشیه برای اختلاف ساعت) از نو می‌پرسیم.
 */
export function useStayBoundary(list: readonly Pick<Reservation, "status" | "end">[] | undefined): void {
  const qc = useQueryClient();
  const ends = (list ?? [])
    .filter((r) => OPEN.has(r.status ?? "confirmed"))
    .map((r) => r.end)
    .sort()
    .join("|");

  useEffect(() => {
    if (!ends) return;
    const now = Date.now();
    const next = ends
      .split("|")
      .map((iso) => Date.parse(iso))
      .filter((t) => Number.isFinite(t) && t > now)
      .sort((a, b) => a - b)[0];
    if (next === undefined || next - now > MAX_DELAY) return;
    const timer = setTimeout(
      () => {
        void qc.invalidateQueries({ queryKey: qk.standing });
        void qc.invalidateQueries({ queryKey: ["me", "reservations"] });
      },
      next - now + 2_000,
    );
    return () => clearTimeout(timer);
  }, [ends, qc]);
}
