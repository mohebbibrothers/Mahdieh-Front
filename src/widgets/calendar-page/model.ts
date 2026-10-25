import type { Period, Timeline, UnitTimeline } from "@/entities/slot/timeline";
import type { Calendar, CalendarCell, CellStatus, Occasion } from "@/shared/api/schemas";
import { addDays } from "@/shared/lib/fa";

/**
 * منطق خالص صفحهٔ «تقویم موجودی و کشف بازه» (P-04) — بی React، با آزمون واحد.
 *
 * حکم نهایی همیشه با سرور است (quote/ثبت رزرو)؛ این‌جا فقط آن‌چه از ماتریس عمومی و سیاست‌های زندهٔ
 * ‎/config‎ معلوم است: وضعیت قابل‌نمایش هر نیم‌روز، آمار بازه، سنجش بازهٔ انتخابی و جایگزین‌ها.
 */

export const DAY_OPTIONS = [7, 14, 21, 30] as const;
export type DaysOption = (typeof DAY_OPTIONS)[number];
export type View = "matrix" | "day";

/** وضعیت دیداری یک نیم‌روز: پنج وضعیت موتور + دو وضعیت زمانیِ سمت کاربر. */
export type SlotState = CellStatus | "soon" | "beyond";

export const SLOT_LABEL: Record<SlotState, string> = {
  free: "آزاد",
  occupied: "اشغال",
  buffer: "نظافت",
  blocked: "تعمیرات",
  past: "گذشته",
  soon: "رزرو بسته",
  beyond: "خارج از افق",
};

/** شرح کامل هر وضعیت (برچسب دسترس‌پذیر، راهنما و دلیل تعارض). */
export const SLOT_REASON: Record<SlotState, string> = {
  free: "آزاد و قابل رزرو",
  occupied: "این نیم‌روز پیش‌تر رزرو شده است",
  buffer: "زمان نظافت و آماده‌سازی واحد",
  blocked: "بسته به‌دلیل نگهداری و تعمیرات",
  past: "زمان این نیم‌روز گذشته است",
  soon: "کمتر از حداقل مهلت پیش از ورود مانده؛ رزرو آنلاین بسته است",
  beyond: "بیرون از افق رزرو آنلاین",
};

export const SLOT_ICON = {
  free: "check",
  occupied: "lock",
  buffer: "broom",
  blocked: "wrench",
  past: "clock",
  soon: "hourglass",
  beyond: "calendar-x",
} as const satisfies Record<SlotState, string>;

/** وضعیت‌هایی که «جای کس دیگر» یا بستن واحد است ⇒ صف انتظار معنا دارد. */
export const CONFLICT_STATES = new Set<SlotState>(["occupied", "buffer", "blocked"]);

export type Clock = { now: number; minLeadHours: number; horizonDays: number };

/** آخرین لحظهٔ مجاز آغاز رزرو (همان قاعدهٔ بک‌اند: ‎start ≤ now + horizon‎). */
export const horizonEnd = (c: Clock) => c.now + c.horizonDays * 86_400_000;

export function slotState(cell: CalendarCell, c: Clock): SlotState {
  if (cell.status !== "free") return cell.status;
  const start = Date.parse(cell.start);
  if (start <= c.now) return "past";
  if (start < c.now + c.minLeadHours * 3_600_000) return "soon";
  if (start > horizonEnd(c)) return "beyond";
  return "free";
}

/* ── ناوبری بازه ──────────────────────────────────────────────────────── */

/** نخستین روزِ مجاز نمایش: از امروز تا جایی که آخرین روز بازه از افق نگذرد. */
export function clampFrom(from: string | null, today: string, horizonDays: number, days: number): string {
  const max = addDays(today, Math.max(0, horizonDays - days + 1));
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || from < today) return today;
  return from > max ? max : from;
}

export function shiftRange(from: string, step: number, today: string, horizonDays: number, days: number): string {
  return clampFrom(addDays(from, step), today, horizonDays, days);
}

/* ── پالایش و آمار ────────────────────────────────────────────────────── */

export type Filter = { unit: string; floor: number };

export function visibleUnits(t: Timeline, f: Filter): UnitTimeline[] {
  return t.units.filter((u) => (!f.unit || u.code === f.unit) && (!f.floor || u.floor === f.floor));
}

/** نیم‌روزهای یک روز تقویمی برای یک واحد (روز + شب آغازشده در همان روز). */
export function cellsOfDay(unit: UnitTimeline, day: string): CalendarCell[] {
  return unit.cells.filter((c) => c.start.startsWith(day));
}

export type RangeStats = {
  free: number;
  considered: number;
  busy: number;
  occupancy: number;
  fullyFreeDays: number;
  units: number;
  suites: number;
  rooms: number;
};

export function rangeStats(units: UnitTimeline[], days: Calendar["days"], c: Clock): RangeStats {
  let free = 0;
  let considered = 0;
  let busy = 0;
  let fullyFreeDays = 0;
  for (const d of days) {
    let dayAllFree = units.length > 0;
    for (const u of units) {
      for (const cell of cellsOfDay(u, d.day)) {
        const s = slotState(cell, c);
        if (s !== "past") considered += 1;
        if (s === "free") free += 1;
        else dayAllFree = false;
        if (CONFLICT_STATES.has(s)) busy += 1;
      }
    }
    if (dayAllFree) fullyFreeDays += 1;
  }
  return {
    free,
    considered,
    busy,
    occupancy: considered ? busy / considered : 0,
    fullyFreeDays,
    units: units.length,
    suites: units.filter((u) => u.unitType === "suite").length,
    rooms: units.filter((u) => u.unitType !== "suite").length,
  };
}

/** شمار نیم‌روزهای قابل رزرو یک روز (برای سرستون «N از M آزاد»). */
export function dayFree(units: UnitTimeline[], day: string, c: Clock): { free: number; total: number } {
  let free = 0;
  let total = 0;
  for (const u of units) {
    for (const cell of cellsOfDay(u, day)) {
      total += 1;
      if (slotState(cell, c) === "free") free += 1;
    }
  }
  return { free, total };
}

/* ── انتخاب بازه ──────────────────────────────────────────────────────── */

export type Selection = { unit: string; day: string; period: Period; cells: number };

export const selectionOf = (unit: string, cell: CalendarCell, cells: number): Selection => ({
  unit,
  day: cell.start.slice(0, 10),
  period: cell.kind,
  cells,
});

export function startCell(unit: UnitTimeline | undefined, s: Selection): CalendarCell | undefined {
  return unit?.cells.find((c) => c.kind === s.period && c.start.startsWith(s.day));
}

/**
 * رفتار کلیک طراح، با یک بهبود: کلیک دوباره روی آغاز ⇒ لغو انتخاب (نه چرخهٔ مبهم «+۱»).
 *   · بی انتخاب / واحد دیگر ⇒ آغاز تازه با مدت ترجیحی؛
 *   · پیش از آغاز ⇒ آغاز جابه‌جا و پایان ثابت؛ پس از آغاز ⇒ پایان همان خانه (فراگیر).
 */
export function clickCell(
  prev: Selection | null,
  unit: UnitTimeline,
  cell: CalendarCell,
  preferred: number,
  maxCells: number,
): Selection | null {
  const head = prev && prev.unit === unit.code ? startCell(unit, prev) : undefined;
  if (!prev || !head) return selectionOf(unit.code, cell, Math.min(preferred, maxCells));
  if (cell.index === head.index) return null;
  if (cell.index < head.index) {
    const end = head.index + prev.cells;
    return selectionOf(unit.code, cell, Math.max(1, Math.min(maxCells, end - cell.index)));
  }
  return { ...prev, cells: Math.max(1, Math.min(maxCells, cell.index - head.index + 1)) };
}

export type Verdict =
  | { kind: "loading" }
  | { kind: "capacity"; capacity: number }
  | { kind: "closed"; state: SlotState }
  | { kind: "conflict"; conflicts: Array<{ cell: CalendarCell; state: SlotState }> }
  | { kind: "ok" };

export type Evaluation = {
  cells: Array<{ cell: CalendarCell; state: SlotState }>;
  start?: CalendarCell;
  end?: CalendarCell;
  verdict: Verdict;
};

/** سنجش بازهٔ انتخابی به ترتیب اهمیت برای زائر: ظرفیت ← آغاز بسته ← تعارض ← آزاد. */
export function evaluateSelection(unit: UnitTimeline | undefined, s: Selection, guests: number, c: Clock): Evaluation {
  const head = startCell(unit, s);
  if (!unit || !head) return { cells: [], verdict: { kind: "loading" } };
  const cells: Evaluation["cells"] = [];
  for (let i = 0; i < s.cells; i++) {
    const cell = unit.byIndex.get(head.index + i);
    if (!cell) return { cells, start: head, verdict: { kind: "loading" } };
    cells.push({ cell, state: slotState(cell, c) });
  }
  const end = cells.at(-1)?.cell;
  const base = { cells, start: head, ...(end ? { end } : {}) };
  if (guests > unit.capacity) return { ...base, verdict: { kind: "capacity", capacity: unit.capacity } };
  const first = cells[0]?.state;
  if (first === "past" || first === "soon" || first === "beyond") {
    return { ...base, verdict: { kind: "closed", state: first } };
  }
  const conflicts = cells.filter((x) => x.state !== "free");
  return { ...base, verdict: conflicts.length ? { kind: "conflict", conflicts } : { kind: "ok" } };
}

/** نخستین بازهٔ کاملاً آزاد (قابل رزرو) یک واحد، از اندیس داده‌شده به جلو یا عقب. */
function fitFrom(unit: UnitTimeline, from: number, cells: number, c: Clock, dir: 1 | -1): CalendarCell | null {
  const list = unit.cells;
  const ok = (cell: CalendarCell | undefined) => cell !== undefined && slotState(cell, c) === "free";
  const startIdx = list.findIndex((x) => x.index >= from);
  if (startIdx < 0) return null;
  for (let i = startIdx; i >= 0 && i < list.length; i += dir) {
    const head = list[i];
    if (!head || head.index === from) continue;
    let fits = true;
    for (let k = 0; k < cells && fits; k++) fits = ok(unit.byIndex.get(head.index + k));
    if (fits) return head;
  }
  return null;
}

export type Alternative = { selection: Selection; reason: "same-time" | "later" | "earlier"; unitTitle: string };

/**
 * جایگزین‌های بی‌بن‌بست (طراح: «نزدیک‌ترین بازهٔ آزاد»): همان زمان در واحد دیگر (با ظرفیت کافی)،
 * سپس نزدیک‌ترین زمان پس و پیش از آن در همان واحد. حداکثر سه پیشنهاد.
 */
export function alternatives(t: Timeline, s: Selection, guests: number, c: Clock): Alternative[] {
  const out: Alternative[] = [];
  const unit = t.units.find((u) => u.code === s.unit);
  const head = startCell(unit, s);
  if (!unit || !head) return out;
  for (const other of t.units) {
    if (other.code === unit.code || other.capacity < guests) continue;
    const sel = { ...s, unit: other.code };
    if (evaluateSelection(other, sel, guests, c).verdict.kind === "ok") {
      out.push({ selection: sel, reason: "same-time", unitTitle: other.title });
      break;
    }
  }
  if (unit.capacity >= guests) {
    const later = fitFrom(unit, head.index, s.cells, c, 1);
    if (later) out.push({ selection: selectionOf(unit.code, later, s.cells), reason: "later", unitTitle: unit.title });
    const earlier = fitFrom(unit, head.index, s.cells, c, -1);
    if (earlier && earlier.index < head.index) {
      out.push({ selection: selectionOf(unit.code, earlier, s.cells), reason: "earlier", unitTitle: unit.title });
    }
  }
  return out.slice(0, 3);
}

/* ── مناسبت‌ها و آخر هفته‌ها ─────────────────────────────────────────── */

export type Chip =
  { kind: "occasion"; key: string; day: string; occasion: Occasion } | { kind: "weekend"; key: string; days: string[] };

/** نوار «مناسبت‌ها و ایام پرتقاضا»: مناسبت‌های بازه (اوج اول) + آخر هفته‌های پیوسته به‌صورت یک تراشه. */
export function occasionChips(days: Calendar["days"], occasions: Occasion[]): Chip[] {
  const inRange = new Set(days.map((d) => d.day));
  const occ: Chip[] = occasions
    .filter((o) => inRange.has(o.date_gregorian))
    .sort((a, b) => Number(b.is_peak) - Number(a.is_peak) || a.date_gregorian.localeCompare(b.date_gregorian))
    .map((o) => ({ kind: "occasion", key: `o-${o.id}`, day: o.date_gregorian, occasion: o }));
  const weekends: Chip[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length) weekends.push({ kind: "weekend", key: `w-${run[0]}`, days: run });
    run = [];
  };
  for (const d of days) {
    if (d.is_weekend && (!run.length || addDays(run.at(-1) ?? "", 1) === d.day)) run.push(d.day);
    else {
      flush();
      if (d.is_weekend) run.push(d.day);
    }
  }
  flush();
  return [...occ, ...weekends];
}

/* ── نشانی صفحه (قابل اشتراک و بازگشت) ─────────────────────────────── */

export type PageState = {
  from: string | null;
  days: DaysOption;
  unit: string;
  floor: number;
  view: View | null;
  guests: number;
  /** کوتاه‌ترین اقامت مطلوب (نیم‌روز) — کشف بازه و مدت پیش‌فرض انتخاب. */
  stay: number;
  selection: Selection | null;
};

export const INITIAL_STATE: PageState = {
  from: null,
  days: 14,
  unit: "",
  floor: 0,
  view: null,
  guests: 2,
  stay: 2,
  selection: null,
};

const int = (v: string | null, lo: number, hi: number): number | null => {
  const n = Number(v);
  return v !== null && Number.isInteger(n) && n >= lo && n <= hi ? n : null;
};

export function readState(search: string): PageState {
  const p = new URLSearchParams(search);
  const s: PageState = { ...INITIAL_STATE };
  const from = p.get("from");
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) s.from = from;
  const days = int(p.get("days"), 1, 62);
  if (days && (DAY_OPTIONS as readonly number[]).includes(days)) s.days = days as DaysOption;
  const unit = p.get("unit");
  if (unit && /^[A-Za-z0-9-]{1,16}$/.test(unit)) s.unit = unit.toUpperCase();
  s.floor = int(p.get("floor"), 1, 9) ?? 0;
  const view = p.get("view");
  if (view === "matrix" || view === "day") s.view = view;
  s.guests = int(p.get("guests"), 1, 60) ?? s.guests;
  s.stay = int(p.get("stay"), 1, 62) ?? s.stay;
  const pick = p.get("pick");
  const day = p.get("day");
  const period = p.get("period");
  const cells = int(p.get("cells"), 1, 62);
  if (pick && /^[A-Za-z0-9-]{1,16}$/.test(pick) && day && /^\d{4}-\d{2}-\d{2}$/.test(day) && cells) {
    s.selection = { unit: pick.toUpperCase(), day, period: period === "night" ? "night" : "day", cells };
  }
  return s;
}

export function writeState(s: PageState, base: string): string {
  const url = new URL(base);
  const p = url.searchParams;
  const set = (k: string, v: string | null) => (v === null ? p.delete(k) : p.set(k, v));
  set("from", s.from);
  set("days", s.days === INITIAL_STATE.days ? null : String(s.days));
  set("unit", s.unit || null);
  set("floor", s.floor ? String(s.floor) : null);
  set("view", s.view);
  set("guests", s.guests === INITIAL_STATE.guests ? null : String(s.guests));
  set("stay", s.stay === INITIAL_STATE.stay ? null : String(s.stay));
  const sel = s.selection;
  set("pick", sel ? sel.unit : null);
  set("day", sel ? sel.day : null);
  set("period", sel ? sel.period : null);
  set("cells", sel ? String(sel.cells) : null);
  return url.toString();
}

/** چند روز باید بار شود تا بلندترین اقامتِ آغازشده در این روز کامل دیده شود. */
export const spanDays = (cells: number) => Math.ceil((cells + 1) / 2) + 1;
