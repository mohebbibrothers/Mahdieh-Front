import { describe, expect, it } from "vitest";
import { buildTimeline } from "@/entities/slot/timeline";
import type { Calendar, CellStatus } from "@/shared/api/schemas";
import {
  alternatives,
  clampFrom,
  clickCell,
  evaluateSelection,
  dayMark,
  occasionChips,
  occasionsByDay,
  rangeStats,
  readState,
  slotState,
  writeState,
  type Clock,
  type Selection,
} from "./model";

const DAYS = ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];

/** تقویم ساختگی: ۴ روز، دو واحد (A1 سوئیت ۶نفره، B1 اتاق ۸نفره) با وضعیت‌های دلخواه. */
function calendar(a1: CellStatus[], b1: CellStatus[] = []): Calendar {
  const unit = (code: string, type: string, cap: number, statuses: CellStatus[], d: number, day: string) => ({
    code,
    title: code === "A1" ? "سوئیت طبقهٔ اول" : "اتاق بزرگ طبقهٔ اول",
    floor_number: 1,
    unit_type: type,
    capacity_total: cap,
    cells: (["day", "night"] as const).map((kind, k) => ({
      index: 200 + d * 2 + k,
      kind,
      label: "",
      start: `${day}T${kind === "day" ? "08" : "20"}:00:00+03:30`,
      end: "",
      status: statuses[d * 2 + k] ?? ("free" as const),
      detail: "",
    })),
  });
  return {
    max_cells: 14,
    min_cells: 1,
    horizon_days: 90,
    lattice: { cell_hours: 12, grid_start_hour: 8 },
    days: DAYS.map((day, d) => ({
      day,
      date_jalali: "",
      weekday: "",
      is_weekend: day === "2026-10-29" || day === "2026-10-30",
      demand_level: "normal",
      occupancy_rate: 0,
      free_cells: 0,
      total_cells: 4,
      units: [unit("A1", "suite", 6, a1, d, day), unit("B1", "large_room", 8, b1, d, day)],
    })),
  };
}

/** «اکنون» = ۲۷ مهر… ساعت ۰۷:۰۰ ⇒ سانس روز ۰۸:۰۰ درون مهلت دوساعته است. */
const clock: Clock = { now: Date.parse("2026-10-27T07:00:00+03:30"), minLeadHours: 2, horizonDays: 90 };

describe("slotState", () => {
  it("نیم‌روز آزاد درون مهلت پیش از ورود «رزرو بسته» است و پس از افق «خارج از افق»", () => {
    const t = buildTimeline(calendar([]));
    const a1 = t.units[0]!;
    expect(slotState(a1.cells[0]!, clock)).toBe("soon");
    expect(slotState(a1.cells[1]!, clock)).toBe("free");
    expect(slotState(a1.cells[1]!, { ...clock, horizonDays: 0 })).toBe("beyond");
    expect(slotState(a1.cells[0]!, { ...clock, now: Date.parse("2026-10-27T09:00:00+03:30") })).toBe("past");
  });
});

describe("rangeStats", () => {
  it("آزاد، اشغال و روزهای کاملاً آزاد را بی‌شمردن گذشته می‌شمارد", () => {
    const t = buildTimeline(calendar(["free", "free", "occupied", "buffer"]));
    const s = rangeStats(t.units, t.days, clock);
    expect(s.considered).toBe(16);
    expect(s.busy).toBe(2);
    expect(s.free).toBe(12); // ۱۶ − ۲ اشغال − ۲ «رزرو بسته» (سانس روزِ نخست هر دو واحد)
    expect(s.fullyFreeDays).toBe(2); // روز نخست «رزرو بسته» دارد، روز دوم اشغال
    expect(s.suites).toBe(1);
    expect(s.rooms).toBe(1);
  });
});

describe("clickCell", () => {
  const t = buildTimeline(calendar([]));
  const a1 = t.units[0]!;
  it("کلیک نخست با مدت ترجیحی آغاز می‌کند؛ کلیک بعدی پایان را می‌گذارد؛ کلیک روی آغاز لغو می‌کند", () => {
    const first = clickCell(null, a1, a1.cells[1]!, 2, 14);
    expect(first).toEqual({ unit: "A1", day: "2026-10-27", period: "night", cells: 2 });
    const longer = clickCell(first, a1, a1.cells[5]!, 2, 14);
    expect(longer?.cells).toBe(5);
    expect(clickCell(longer, a1, a1.cells[1]!, 2, 14)).toBeNull();
  });
  it("کلیک پیش از آغاز، آغاز را جابه‌جا و پایان را ثابت نگه می‌دارد", () => {
    const sel: Selection = { unit: "A1", day: "2026-10-28", period: "day", cells: 2 }; // اندیس ۲۰۲..۲۰۳
    const moved = clickCell(sel, a1, a1.cells[1]!, 2, 14);
    expect(moved).toEqual({ unit: "A1", day: "2026-10-27", period: "night", cells: 3 });
  });
});

describe("evaluateSelection + alternatives", () => {
  it("تعارض را با هویت دقیق هر نیم‌روز گزارش و جایگزین بی‌بن‌بست پیشنهاد می‌کند", () => {
    const t = buildTimeline(calendar(["free", "free", "free", "occupied", "buffer", "free", "free", "free"]));
    const sel: Selection = { unit: "A1", day: "2026-10-28", period: "day", cells: 3 };
    const ev = evaluateSelection(t.units[0], sel, 2, clock);
    expect(ev.verdict.kind).toBe("conflict");
    if (ev.verdict.kind === "conflict") {
      expect(ev.verdict.conflicts.map((c) => c.state)).toEqual(["occupied", "buffer"]);
    }
    const alts = alternatives(t, sel, 2, clock);
    expect(alts[0]).toMatchObject({ reason: "same-time", selection: { unit: "B1", day: "2026-10-28" } });
    expect(alts.some((a) => a.reason === "later" && a.selection.day === "2026-10-29")).toBe(true);
  });
  it("ظرفیت پیش از هر چیز سنجیده می‌شود", () => {
    const t = buildTimeline(calendar([]));
    const ev = evaluateSelection(t.units[0], { unit: "A1", day: "2026-10-28", period: "day", cells: 2 }, 7, clock);
    expect(ev.verdict).toEqual({ kind: "capacity", capacity: 6 });
  });
  it("بازهٔ بیرون از دادهٔ بارشده «در حال بارگذاری» است، نه آزاد", () => {
    const t = buildTimeline(calendar([]));
    const ev = evaluateSelection(t.units[0], { unit: "A1", day: "2026-10-30", period: "day", cells: 6 }, 2, clock);
    expect(ev.verdict.kind).toBe("loading");
  });
});

describe("ناوبری و نشانی", () => {
  it("آغاز بازه میان امروز و آخرین روز افق می‌ماند", () => {
    expect(clampFrom(null, "2026-10-27", 90, 14)).toBe("2026-10-27");
    expect(clampFrom("2026-01-01", "2026-10-27", 90, 14)).toBe("2026-10-27");
    expect(clampFrom("2027-06-01", "2026-10-27", 90, 14)).toBe("2027-01-12");
  });
  it("وضعیت صفحه رفت‌وبرگشت کامل در نشانی دارد (همان پارامترهای تحویل P-05)", () => {
    const url = writeState(
      {
        from: "2026-10-29",
        days: 7,
        unit: "B2",
        floor: 2,
        view: "day",
        guests: 4,
        stay: 3,
        selection: { unit: "B2", day: "2026-10-30", period: "night", cells: 4 },
      },
      "https://x.test/calendar/",
    );
    expect(url).toContain("pick=B2");
    expect(url).toContain("period=night");
    const back = readState(new URL(url).search);
    expect(back).toMatchObject({ from: "2026-10-29", days: 7, unit: "B2", floor: 2, view: "day", guests: 4, stay: 3 });
    expect(back.selection).toEqual({ unit: "B2", day: "2026-10-30", period: "night", cells: 4 });
  });
});

describe("occasionChips", () => {
  it("مناسبت اوج اول، سپس آخر هفته‌های پیوسته به‌صورت یک تراشه", () => {
    const t = buildTimeline(calendar([]));
    const chips = occasionChips(t.days, [
      {
        id: "1",
        title: "میلاد امام رضا (ع)",
        kind: "religious",
        date_gregorian: "2026-10-28",
        is_peak: true,
      },
      { id: "2", title: "بیرون از بازه", kind: "holiday", date_gregorian: "2026-12-01", is_peak: true },
    ]);
    expect(chips.map((c) => c.kind)).toEqual(["occasion", "weekend"]);
    const weekend = chips[1];
    expect(weekend?.kind === "weekend" && weekend.days).toEqual(["2026-10-29", "2026-10-30"]);
  });

  it("به ترتیب زمان: آخر هفتهٔ زودتر پیش از مناسبت دیرتر می‌آید", () => {
    const t = buildTimeline(calendar([]));
    const chips = occasionChips(t.days, [
      { id: "9", title: "شهادت", kind: "religious", date_gregorian: "2026-10-30", is_peak: false },
    ]);
    expect(chips.map((c) => c.kind)).toEqual(["weekend", "occasion"]);
  });
});

describe("dayMark", () => {
  const day = (d: string, weekend = false) => ({ day: d, is_weekend: weekend, demand_level: "normal" as const });
  const occ = occasionsByDay([
    { id: "a", title: "عرفه", kind: "religious", date_gregorian: "2026-10-27", is_peak: true },
    { id: "b", title: "شهادت", kind: "religious", date_gregorian: "2026-10-28", is_peak: false, is_holiday: true },
    { id: "c", title: "میلاد", kind: "religious", date_gregorian: "2026-10-29", is_peak: false },
  ]);
  it("اوج › تعطیل رسمی › پرتقاضا › آخر هفته", () => {
    expect(dayMark(day("2026-10-27"), occ.get("2026-10-27")).tag).toBe("peak");
    expect(dayMark(day("2026-10-28"), occ.get("2026-10-28")).tag).toBe("holiday");
    expect(dayMark(day("2026-10-29", true), occ.get("2026-10-29"))).toEqual({ tag: "busy", titles: ["میلاد"] });
    expect(dayMark(day("2026-10-30", true), undefined).tag).toBe("weekend");
    expect(dayMark(day("2026-10-31"), undefined).tag).toBeNull();
  });
});
