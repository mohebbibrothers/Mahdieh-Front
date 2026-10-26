import { describe, expect, it } from "vitest";
import { buildTimeline } from "@/entities/slot/timeline";
import type { Calendar, CalendarWindows, CellStatus, Floor, FreeWindow } from "@/shared/api/schemas";
import {
  activeFilterCount,
  availability,
  cardFeatures,
  catalogue,
  comparePresets,
  featureFacets,
  INITIAL_STATE,
  matches,
  rangeDays,
  readState,
  sharedFeatures,
  sortUnits,
  startEligibility,
  toggleCompare,
  tripStart,
  writeState,
  type Availability,
  type Clock,
  type Sources,
} from "./model";

const feat = (code: string, highlight = false) => ({ code, title: code, icon: "", is_highlight: highlight, note: "" });
const unit = (code: string, type: "suite" | "large_room", floor: number, cap: number, feats: string[]) => ({
  id: code.charCodeAt(0) + floor,
  code,
  title: code,
  unit_type: type,
  type_label: type === "suite" ? "سوئیت" : "اتاق بزرگ",
  floor_number: floor,
  capacity_adults: cap - 2,
  capacity_children: 2,
  capacity_total: cap,
  cleaning_buffer_minutes: 0,
  features: feats.map((f) => feat(f, f === "wifi" || f === "kitchen")),
  cover: null,
});

const PROPERTY: Floor[] = [
  {
    number: 1,
    title: "طبقهٔ اول",
    description: "",
    accessibility_notes: "بدون پله",
    units: [unit("A1", "suite", 1, 6, ["wifi", "kitchen", "bath"]), unit("B1", "large_room", 1, 8, ["wifi"])],
  },
  {
    number: 2,
    title: "طبقهٔ دوم",
    description: "",
    accessibility_notes: "",
    units: [unit("A2", "suite", 2, 6, ["wifi", "kitchen", "bath"]), unit("B2", "large_room", 2, 8, ["wifi"])],
  },
  {
    number: 3,
    title: "طبقهٔ سوم",
    description: "",
    accessibility_notes: "آسانسور",
    units: [unit("B3", "large_room", 3, 8, ["wifi"])],
  },
] as unknown as Floor[];
const UNITS = catalogue(PROPERTY);

const clock: Clock = {
  now: Date.parse("2026-10-27T07:00:00+03:30"),
  minLeadHours: 2,
  horizonDays: 90,
  gridStartHour: 8,
  cellHours: 12,
};

const DAYS = ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];
function calendar(statuses: CellStatus[]): Calendar {
  return {
    max_cells: 14,
    min_cells: 1,
    horizon_days: 90,
    lattice: { cell_hours: 12, grid_start_hour: 8 },
    days: DAYS.map((day, d) => ({
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
          title: "A1",
          floor_number: 1,
          unit_type: "suite",
          capacity_total: 6,
          cells: (["day", "night"] as const).map((kind, k) => ({
            index: 200 + d * 2 + k,
            kind,
            label: "",
            start: `${day}T${kind === "day" ? "08" : "20"}:00:00+03:30`,
            end: `${kind === "day" ? day : (DAYS[d + 1] ?? day)}T${kind === "day" ? "20" : "08"}:00:00+03:30`,
            status: statuses[d * 2 + k] ?? ("free" as const),
            detail: "",
          })),
        },
      ],
    })),
  } as Calendar;
}

const win: FreeWindow = {
  start: "2026-10-28T08:00:00+03:30",
  end: "2026-10-30T08:00:00+03:30",
  day: "2026-10-28",
  date_jalali: "۶ آبان",
  weekday: "چهارشنبه",
  period: "day",
  start_label: "",
  cells: 4,
  bookable_cells: 4,
  stay_label: "",
  open_ended: false,
} as FreeWindow;
const row = (w: FreeWindow | null) =>
  ({
    code: "A1",
    title: "A1",
    floor_number: 1,
    unit_type: "suite",
    capacity_total: 6,
    fits_guests: true,
    window: w,
  }) as CalendarWindows["units"][number];

const src = (over: Partial<Sources>): Sources => ({
  trip: { day: null, period: "day", cells: 4, guests: 4 },
  clock,
  row: undefined,
  window: row(win),
  calendarState: "idle",
  windowsState: "ready",
  offline: false,
  ...over,
});

describe("readState / writeState", () => {
  it("پارامترهای هم‌ارز را می‌پذیرد و مقدارهای نامعتبر را به پیش‌فرض برمی‌گرداند", () => {
    const s = readState(
      "?from=2026-11-02&period=night&guests_count=7&cells=99&kind=suite&floor=2&feat=wifi,wifi,%3Cx%3E&free=1&sort=soon&view=list&cmp=a1,b2,a2,b3",
    );
    expect(s.trip).toEqual({ day: "2026-11-02", period: "night", cells: INITIAL_STATE.trip.cells, guests: 7 });
    expect(s.kind).toBe("suite");
    expect(s.floor).toBe(2);
    expect(s.feats).toEqual(["wifi"]);
    expect(s.freeOnly).toBe(true);
    expect(s.sort).toBe("soon");
    expect(s.view).toBe("list");
    expect(s.compare).toEqual(["A1", "B2", "A2"]);
    expect(readState("?day=1405-08-01&guests=0").trip).toEqual(INITIAL_STATE.trip);
  });

  it("نشانی کوتاه می‌سازد و دور رفت‌وبرگشت بی‌اتلاف است", () => {
    expect(writeState(INITIAL_STATE, "https://x.ir/units/?utm=1")).toBe("https://x.ir/units/?utm=1");
    const s = {
      ...INITIAL_STATE,
      trip: { day: "2026-11-02", period: "night" as const, cells: 2, guests: 6 },
      compare: ["A1", "B1"],
      freeOnly: true,
    };
    const href = writeState(s, "https://x.ir/units/");
    expect(href).toContain("day=2026-11-02");
    expect(readState(new URL(href).search)).toEqual(s);
    // «فقط آزادها» بی تاریخ معنا ندارد و نوشته نمی‌شود.
    expect(writeState({ ...INITIAL_STATE, freeOnly: true }, "https://x.ir/units/")).toBe("https://x.ir/units/");
  });
});

describe("catalogue و امکانات", () => {
  it("ترتیب سرور و یادداشت دسترسی طبقه را نگه می‌دارد", () => {
    expect(UNITS.map((u) => [u.code, u.order])).toEqual([
      ["A1", 0],
      ["B1", 1],
      ["A2", 2],
      ["B2", 3],
      ["B3", 4],
    ]);
    expect(UNITS[0]?.access).toBe("بدون پله");
    expect(UNITS[2]?.floorTitle).toBe("طبقهٔ دوم");
  });

  it("فقط امکاناتِ متمایزکننده فیلتر می‌شوند و مشترک‌ها جدا گزارش می‌شوند", () => {
    expect(featureFacets(UNITS).map((f) => [f.code, f.count])).toEqual([
      ["kitchen", 2],
      ["bath", 2],
    ]);
    expect(sharedFeatures(UNITS)).toEqual(["wifi"]);
  });

  it("کارت سه امکان شاخص را نخست نشان می‌دهد", () => {
    expect(cardFeatures(UNITS[0]!).map((f) => f.code)).toEqual(["wifi", "kitchen", "bath"]);
  });
});

describe("startEligibility و tripStart", () => {
  it("مهلت پیش از ورود و افق رزرو را مانند موتور می‌سنجد", () => {
    expect(tripStart("2026-10-27", "night", clock)).toBe("2026-10-27T20:00:00+03:30");
    expect(startEligibility("2026-10-27", "day", clock)).toBe("lead");
    expect(startEligibility("2026-10-27", "night", clock)).toBe("ok");
    expect(startEligibility("2027-02-01", "day", clock)).toBe("horizon");
  });

  it("بازهٔ ماتریس کل اقامت را می‌پوشاند", () => {
    expect(rangeDays({ period: "day", cells: 1 })).toBe(2);
    expect(rangeDays({ period: "night", cells: 4 })).toBe(4);
    expect(rangeDays({ period: "day", cells: 200 })).toBe(62);
  });
});

describe("availability", () => {
  it("بی تاریخ: نخستین بازهٔ کشف یا «بی بازه»؛ خطا/بارگذاری صادقانه گزارش می‌شود", () => {
    expect(availability({ capacity_total: 6 }, src({}))).toEqual({ kind: "next", window: win });
    expect(availability({ capacity_total: 6 }, src({ window: row(null) }))).toEqual({ kind: "none" });
    expect(availability({ capacity_total: 6 }, src({ windowsState: "loading" })).kind).toBe("loading");
    expect(availability({ capacity_total: 6 }, src({ windowsState: "error", offline: true }))).toEqual({
      kind: "unknown",
      offline: true,
    });
    expect(availability({ capacity_total: 3 }, src({}))).toEqual({ kind: "capacity", capacity: 3 });
  });

  it("با تاریخ: آزاد کامل، گرفتگی بخشی با نزدیک‌ترین شروع، و قواعد مهلت/افق", () => {
    const t = buildTimeline(calendar(["free", "free", "free", "occupied"]));
    const trip = { day: "2026-10-27", period: "night" as const, cells: 2, guests: 4 };
    const ok = availability({ capacity_total: 6 }, src({ trip, row: t.units[0], calendarState: "ready" }));
    expect(ok).toEqual({ kind: "free", start: "2026-10-27T20:00:00+03:30", end: "2026-10-28T20:00:00+03:30" });
    const busy = availability(
      { capacity_total: 6 },
      src({ trip: { ...trip, cells: 3 }, row: t.units[0], calendarState: "ready" }),
    );
    expect(busy).toEqual({ kind: "busy", blocking: 1, nearest: win });
    expect(availability({ capacity_total: 6 }, src({ trip: { ...trip, period: "day" } })).kind).toBe("policy");
    const beyond = availability(
      { capacity_total: 6 },
      src({ trip: { ...trip, cells: 40 }, row: t.units[0], calendarState: "ready" }),
    );
    expect(beyond).toEqual({ kind: "policy", reason: "horizon" });
    expect(availability({ capacity_total: 6 }, src({ trip, calendarState: "loading" })).kind).toBe("loading");
  });
});

describe("پالایش، ترتیب و مقایسه", () => {
  const free: Availability = { kind: "free", start: "", end: "" };
  it("هر پالایه مستقل است و شمارش‌گر پالایهٔ خودش را نادیده می‌گیرد", () => {
    const f = { kind: "suite" as const, floor: 2, feats: [], freeOnly: false };
    expect(UNITS.filter((u) => matches(u, f, undefined, false)).map((u) => u.code)).toEqual(["A2"]);
    expect(UNITS.filter((u) => matches(u, f, undefined, false, "kind")).map((u) => u.code)).toEqual(["A2", "B2"]);
    expect(matches(UNITS[1]!, { ...f, kind: "all", floor: 0, freeOnly: true }, { kind: "none" }, false)).toBe(true);
    expect(matches(UNITS[1]!, { ...f, kind: "all", floor: 0, freeOnly: true }, { kind: "none" }, true)).toBe(false);
    expect(matches(UNITS[1]!, { ...f, kind: "all", floor: 0, freeOnly: true }, free, true)).toBe(true);
    expect(activeFilterCount({ kind: "suite", floor: 1, feats: ["bath"], freeOnly: true }, false)).toBe(3);
  });

  it("«ظرفیت مناسب‌تر» کوچک‌ترین ظرفیت کافی را نخست می‌آورد؛ «زودتر» بر پایهٔ نخستین شروع", () => {
    expect(sortUnits(UNITS, "fit", 7, new Map()).map((u) => u.code)).toEqual(["B1", "B2", "B3", "A1", "A2"]);
    expect(sortUnits(UNITS, "fit", 5, new Map()).map((u) => u.code)).toEqual(["A1", "A2", "B1", "B2", "B3"]);
    const avail = new Map<string, Availability>([
      ["B3", { kind: "next", window: win }],
      ["A2", { kind: "free", start: "2026-10-27T20:00:00+03:30", end: "" }],
    ]);
    expect(sortUnits(UNITS, "soon", 4, avail).map((u) => u.code)).toEqual(["A2", "B3", "A1", "B1", "B2"]);
  });

  it("مقایسه حداکثر سه واحد است و پیشنهادها از خود داده ساخته می‌شوند", () => {
    expect(toggleCompare(["A1", "B1", "A2"], "B2")).toEqual({ list: ["A1", "B1", "A2"], full: true });
    expect(toggleCompare(["A1"], "A1")).toEqual({ list: [], full: false });
    expect(comparePresets(UNITS).map((p) => [p.title, p.codes])).toEqual([
      ["سوئیت‌ها کنار هم", ["A1", "A2"]],
      ["اتاق‌های بزرگ کنار هم", ["B1", "B2", "B3"]],
      ["دو گزینهٔ طبقهٔ اول", ["A1", "B1"]],
      ["دو گزینهٔ طبقهٔ دوم", ["A2", "B2"]],
    ]);
  });
});
