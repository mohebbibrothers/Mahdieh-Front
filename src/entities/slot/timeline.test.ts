import { describe, expect, it } from "vitest";
import type { Calendar, CellStatus } from "@/shared/api/schemas";
import { buildTimeline, evaluate, firstBookable, nearestFit } from "./timeline";

/** تقویم ساختگی: ۳ روز، یک واحد ۶نفره با وضعیت‌های دلخواه. */
function calendar(statuses: CellStatus[], capacity = 6): Calendar {
  const days = ["2026-10-20", "2026-10-21", "2026-10-22"];
  return {
    max_cells: 14,
    min_cells: 1,
    horizon_days: 90,
    lattice: { cell_hours: 12 },
    days: days.map((day, d) => ({
      day,
      date_jalali: "",
      weekday: "",
      is_weekend: false,
      demand_level: "normal",
      occupancy_rate: 0,
      free_cells: 0,
      total_cells: 2,
      units: [
        {
          code: "A1",
          title: "سوئیت",
          floor_number: 1,
          unit_type: "suite",
          capacity_total: capacity,
          cells: (["day", "night"] as const).map((kind, k) => ({
            index: 100 + d * 2 + k,
            kind,
            label: "",
            start: `${day}T${kind === "day" ? "08" : "20"}:00:00+03:30`,
            end: "",
            status: statuses[d * 2 + k] ?? "free",
            detail: "",
          })),
        },
      ],
    })),
  };
}

const now = new Date("2026-10-20T05:00:00+03:30");
const q = { day: "2026-10-20", period: "day" as const, cells: 3, guests: 4 };

describe("موتور موجودی", () => {
  it("بازهٔ آزاد پیوسته ⇒ ok", () => {
    const [unit] = buildTimeline(calendar(["free", "free", "free", "free"])).units;
    expect(evaluate(unit!, q, now, 2).kind).toBe("ok");
  });
  it("ظرفیت پیش از هر چیز سنجیده می‌شود", () => {
    const [unit] = buildTimeline(calendar(["free"], 3)).units;
    expect(evaluate(unit!, q, now, 2)).toEqual({ kind: "capacity", capacity: 3 });
  });
  it("یک نیم‌روز پر در میانه ⇒ partial با فهرست مانع‌ها", () => {
    const [unit] = buildTimeline(calendar(["free", "occupied", "free"])).units;
    const v = evaluate(unit!, q, now, 2);
    expect(v.kind).toBe("partial");
    if (v.kind === "partial") expect(v.blocking.map((c) => c.index)).toEqual([101]);
  });
  it("مهلت پیش از ورود رعایت می‌شود", () => {
    const [unit] = buildTimeline(calendar([])).units;
    expect(evaluate(unit!, q, new Date("2026-10-20T07:00:00+03:30"), 2).kind).toBe("lead");
  });
  it("بیرون از تقویم بارشده ⇒ beyond", () => {
    const [unit] = buildTimeline(calendar([])).units;
    expect(evaluate(unit!, { ...q, day: "2026-10-22", period: "night", cells: 2 }, now, 2).kind).toBe("beyond");
  });
  it("نزدیک‌ترین بازهٔ آزاد از پس مانع", () => {
    const [unit] = buildTimeline(calendar(["free", "occupied", "free", "free", "free"])).units;
    expect(nearestFit(unit!, 100, 3, 4, now, 2)?.map((c) => c.index)).toEqual([102, 103, 104]);
    expect(nearestFit(unit!, 100, 3, 9, now, 2)).toBeNull();
  });
  it("نخستین نیم‌روز قابل رزرو", () => {
    const t = buildTimeline(calendar(["past", "occupied", "free"]));
    expect(firstBookable(t, now, 2)?.index).toBe(102);
  });
});
