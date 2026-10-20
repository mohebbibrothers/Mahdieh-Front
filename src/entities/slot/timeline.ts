import type { Calendar, CalendarCell, CellStatus } from "@/shared/api/schemas";

/**
 * موتور موجودی سمت کاربر — آینهٔ قواعد عمومی بک‌اند برای «پیش‌نمایش آنی».
 * حکم نهایی همیشه با سرور است (quote/ثبت رزرو)؛ اینجا فقط آنچه بدون ورود معلوم است:
 * ظرفیت، پیوستگی نیم‌روزهای آزاد، مهلت پیش از ورود و سقف/کف مدت.
 */
export type Period = "day" | "night";

export type UnitTimeline = {
  code: string;
  title: string;
  floor: number;
  unitType: string;
  capacity: number;
  /** نیم‌روزها به ترتیب زمان (اندیس پیوسته‌ی شبکهٔ بک‌اند). */
  cells: CalendarCell[];
  byIndex: Map<number, CalendarCell>;
};

export type Timeline = {
  days: Calendar["days"];
  units: UnitTimeline[];
  maxCells: number;
  minCells: number;
};

export function buildTimeline(calendar: Calendar): Timeline {
  const units = new Map<string, UnitTimeline>();
  for (const day of calendar.days) {
    for (const u of day.units) {
      let row = units.get(u.code);
      if (!row) {
        row = {
          code: u.code,
          title: u.title,
          floor: u.floor_number,
          unitType: u.unit_type,
          capacity: u.capacity_total,
          cells: [],
          byIndex: new Map(),
        };
        units.set(u.code, row);
      }
      for (const c of u.cells) {
        if (!row.byIndex.has(c.index)) {
          row.cells.push(c);
          row.byIndex.set(c.index, c);
        }
      }
    }
  }
  for (const row of units.values()) row.cells.sort((a, b) => a.index - b.index);
  return {
    days: calendar.days,
    units: [...units.values()].sort((a, b) => a.floor - b.floor || a.code.localeCompare(b.code)),
    maxCells: calendar.max_cells,
    minCells: calendar.min_cells,
  };
}

/** نیم‌روزِ آغاز یک روز/نوبت در یک واحد. */
export function cellAt(unit: UnitTimeline, day: string, period: Period): CalendarCell | undefined {
  return unit.cells.find((c) => c.kind === period && c.start.startsWith(day));
}

export type Verdict =
  | { kind: "ok"; cells: CalendarCell[] }
  | { kind: "capacity"; capacity: number }
  | { kind: "lead"; start: CalendarCell }
  | { kind: "partial"; cells: CalendarCell[]; blocking: CalendarCell[] }
  | { kind: "beyond" };

export type Query = { day: string; period: Period; cells: number; guests: number };

/** بازهٔ درخواستی را برای یک واحد می‌سنجد. ترتیب دلایل = ترتیب اهمیت برای زائر. */
export function evaluate(unit: UnitTimeline, q: Query, now: Date, minLeadHours: number): Verdict {
  if (q.guests > unit.capacity) return { kind: "capacity", capacity: unit.capacity };
  const start = cellAt(unit, q.day, q.period);
  if (!start) return { kind: "beyond" };
  const range: CalendarCell[] = [];
  for (let i = 0; i < q.cells; i++) {
    const c = unit.byIndex.get(start.index + i);
    if (!c) return { kind: "beyond" };
    range.push(c);
  }
  if (start.status === "past" || Date.parse(start.start) < now.getTime() + minLeadHours * 3_600_000) {
    return { kind: "lead", start };
  }
  const blocking = range.filter((c) => c.status !== "free");
  return blocking.length ? { kind: "partial", cells: range, blocking } : { kind: "ok", cells: range };
}

/** نخستین بازهٔ کاملاً آزاد از «from» به بعد (همان واحد)، با رعایت مهلت ورود. */
export function nearestFit(
  unit: UnitTimeline,
  fromIndex: number,
  cells: number,
  guests: number,
  now: Date,
  minLeadHours: number,
): CalendarCell[] | null {
  if (guests > unit.capacity) return null;
  const earliest = now.getTime() + minLeadHours * 3_600_000;
  const list = unit.cells;
  let run: CalendarCell[] = [];
  for (const c of list) {
    if (c.index < fromIndex) continue;
    const prev = run.at(-1);
    const usable = c.status === "free" && (run.length > 0 || Date.parse(c.start) >= earliest);
    if (!usable || (prev && c.index !== prev.index + 1)) {
      run = usable ? [c] : [];
    } else {
      run.push(c);
    }
    if (run.length === cells) return run;
  }
  return null;
}

/** نخستین نیم‌روز قابل رزرو در کل ساختمان (برای مقدار پیش‌فرض جست‌وجو). */
export function firstBookable(t: Timeline, now: Date, minLeadHours: number): CalendarCell | undefined {
  const earliest = now.getTime() + minLeadHours * 3_600_000;
  let best: CalendarCell | undefined;
  for (const u of t.units) {
    const c = u.cells.find((x) => x.status === "free" && Date.parse(x.start) >= earliest);
    if (c && (!best || c.index < best.index)) best = c;
  }
  return best;
}

export const STATUS_LABEL: Record<CellStatus, string> = {
  free: "آزاد",
  occupied: "رزروشده",
  buffer: "نظافت",
  blocked: "تعمیر و نگهداری",
  past: "گذشته",
};

export const STATUS_ICON = {
  free: "check",
  occupied: "lock",
  buffer: "broom",
  blocked: "wrench",
  past: "clock",
} as const satisfies Record<CellStatus, string>;
