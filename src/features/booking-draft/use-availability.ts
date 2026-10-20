"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { buildTimeline, evaluate, firstBookable, nearestFit, type Verdict } from "@/entities/slot/timeline";
import { calendarQuery, configQuery } from "@/shared/api/queries";
import { readPolicies } from "@/shared/api/policies";
import { tehranToday } from "@/shared/lib/fa";
import { draftStore, useDraft } from "./store";

/** روزهای بارشده: ۱۴ روز قابل انتخاب + ۷ روز برای بلندترین اقامتِ آغازشده در روز چهاردهم. */
export const PICKABLE_DAYS = 14;
export const CALENDAR_DAYS = 21;

/** «اکنون» که هر دقیقه جلو می‌رود (برای مهلت پیش از ورود و نیم‌روزهای گذشته). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export type UnitResult = {
  code: string;
  verdict: Verdict;
  /** برای حالت‌های ناموفق: نزدیک‌ترین بازهٔ آزادِ همان واحد. */
  nearest: { day: string; period: "day" | "night"; startIso: string } | null;
};

export function useAvailability() {
  const calendar = useQuery(calendarQuery(CALENDAR_DAYS));
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const draft = useDraft((d) => d);
  const now = useNow();

  const timeline = useMemo(() => (calendar.data ? buildTimeline(calendar.data) : null), [calendar.data]);

  // مقدار پیش‌فرض روز: نخستین نیم‌روز قابل رزرو (نه «امروز» کور).
  useEffect(() => {
    if (!timeline || draft.day) return;
    const first = firstBookable(timeline, now, policies.minLeadHours);
    if (first) draftStore.set({ day: first.start.slice(0, 10), period: first.kind });
    else draftStore.set({ day: tehranToday(now) });
  }, [timeline, draft.day, now, policies.minLeadHours]);

  const results = useMemo<UnitResult[]>(() => {
    if (!timeline || !draft.day) return [];
    const q = { day: draft.day, period: draft.period, cells: draft.cells, guests: draft.guests };
    return timeline.units.map((u) => {
      const verdict = evaluate(u, q, now, policies.minLeadHours);
      let nearest: UnitResult["nearest"] = null;
      if (verdict.kind !== "ok") {
        const from = u.cells.find((c) => c.start.startsWith(q.day))?.index ?? u.cells[0]?.index ?? 0;
        const fit = nearestFit(u, from, q.cells, q.guests, now, policies.minLeadHours);
        const head = fit?.[0];
        if (head) nearest = { day: head.start.slice(0, 10), period: head.kind, startIso: head.start };
      }
      return { code: u.code, verdict, nearest };
    });
  }, [timeline, draft.day, draft.period, draft.cells, draft.guests, now, policies.minLeadHours]);

  return { calendar, timeline, policies, draft, results, now };
}
