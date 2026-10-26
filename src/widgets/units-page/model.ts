import { evaluate, type Period, type UnitTimeline } from "@/entities/slot/timeline";
import type { CalendarWindows, Floor, FreeWindow, Unit } from "@/shared/api/schemas";
import { addDays } from "@/shared/lib/fa";

/**
 * منطق خالص صفحهٔ «واحدهای اقامتی» (P-02) — بی React، با آزمون واحد.
 *
 * صفحه فقط آن‌چه سرور ثبت کرده را نشان می‌دهد: ساختار طبقات و واحدها (‎/property‎)، امکانات فعال،
 * نخستین بازهٔ آزاد هر واحد با قواعد خود موتور (‎/calendar/windows‎) و — وقتی زائر تاریخ داده —
 * ماتریس همان بازه (‎/calendar‎). حکم نهایی همیشه با ثبت رزرو در P-05 است.
 */

/* ── حالت صفحه و نشانی ───────────────────────────────────────────────── */

export type Kind = "all" | "suite" | "large_room";
export type Sort = "floor" | "fit" | "soon";
export type ViewMode = "grid" | "list";

export type Trip = {
  /** روز ورود (ISO)؛ ‎null‎ = «تاریخم قطعی نیست» ⇒ نزدیک‌ترین زمان آزاد هر واحد */
  day: string | null;
  period: Period;
  /** مدت به نیم‌روز */
  cells: number;
  guests: number;
};

export type PageState = {
  trip: Trip;
  kind: Kind;
  floor: number;
  feats: string[];
  freeOnly: boolean;
  sort: Sort;
  view: ViewMode;
  compare: string[];
};

export const MAX_COMPARE = 3;
export const MAX_GUESTS = 60;
export const MAX_CELLS = 62;

export const INITIAL_STATE: PageState = {
  trip: { day: null, period: "day", cells: 4, guests: 4 },
  kind: "all",
  floor: 0,
  feats: [],
  freeOnly: false,
  sort: "floor",
  view: "grid",
  compare: [],
};

const ISO_DAY = /^(20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** روز میلادی معتبر (نه تاریخ شمسیِ هم‌قالب یا ۳۱ آبانِ ناموجود). */
const isDay = (raw: string | null): raw is string =>
  raw !== null && ISO_DAY.test(raw) && new Date(`${raw}T00:00:00Z`).toISOString().startsWith(raw);
const CODE = /^[A-Za-z0-9-]{1,12}$/;

const int = (raw: string | null, min: number, max: number): number | null => {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
};

const list = (raw: string | null, max: number): string[] =>
  raw
    ? [
        ...new Set(
          raw
            .split(",")
            .map((s) => s.trim())
            .filter((s) => CODE.test(s)),
        ),
      ].slice(0, max)
    : [];

/**
 * خواندن حالت از نشانی. نام‌های هم‌ارز طراح (‎from‎، ‎guests_count‎) هم پذیرفته می‌شوند تا پیوندهای
 * صفحه‌های دیگر (خانه، تقویم، P-05) با همان پارامترهای ‎day/period/cells/guests‎ مستقیم کار کنند.
 */
export function readState(search: string): PageState {
  const p = new URLSearchParams(search);
  const day = p.get("day") ?? p.get("from");
  const period = p.get("period");
  const kind = p.get("kind");
  const sort = p.get("sort");
  return {
    trip: {
      day: isDay(day) ? day : null,
      period: period === "night" ? "night" : "day",
      cells: int(p.get("cells"), 1, MAX_CELLS) ?? INITIAL_STATE.trip.cells,
      guests: int(p.get("guests") ?? p.get("guests_count"), 1, MAX_GUESTS) ?? INITIAL_STATE.trip.guests,
    },
    kind: kind === "suite" || kind === "large_room" ? kind : "all",
    floor: int(p.get("floor"), 1, 99) ?? 0,
    feats: list(p.get("feat"), 12),
    freeOnly: p.get("free") === "1",
    sort: sort === "fit" || sort === "soon" ? sort : "floor",
    view: p.get("view") === "list" ? "list" : "grid",
    compare: list(p.get("cmp"), MAX_COMPARE).map((c) => c.toUpperCase()),
  };
}

/** نوشتن حالت در نشانی — فقط مقدارهای غیرپیش‌فرض (نشانی کوتاه و قابل اشتراک). */
export function writeState(s: PageState, href: string): string {
  const url = new URL(href);
  const p = url.searchParams;
  for (const k of [
    "day",
    "from",
    "period",
    "cells",
    "guests",
    "guests_count",
    "kind",
    "floor",
    "feat",
    "free",
    "sort",
    "view",
    "cmp",
  ]) {
    p.delete(k);
  }
  const d = INITIAL_STATE;
  if (s.trip.day) {
    p.set("day", s.trip.day);
    p.set("period", s.trip.period);
  }
  if (s.trip.cells !== d.trip.cells || s.trip.day) p.set("cells", String(s.trip.cells));
  if (s.trip.guests !== d.trip.guests || s.trip.day) p.set("guests", String(s.trip.guests));
  if (s.kind !== "all") p.set("kind", s.kind);
  if (s.floor) p.set("floor", String(s.floor));
  if (s.feats.length) p.set("feat", s.feats.join(","));
  if (s.freeOnly && s.trip.day) p.set("free", "1");
  if (s.sort !== "floor") p.set("sort", s.sort);
  if (s.view !== "grid") p.set("view", s.view);
  if (s.compare.length) p.set("cmp", s.compare.join(","));
  return url.toString();
}

/* ── کاتالوگ ─────────────────────────────────────────────────────────── */

export type CatalogUnit = Unit & {
  /** ترتیب ثبت‌شده در سرور (طبقه، سپس ترتیب نمایش) */
  order: number;
  floorTitle: string;
  /** یادداشت دسترسی طبقه (از پنل)؛ تهی ⇒ ثبت نشده */
  access: string;
};

export function catalogue(property: Floor[] | undefined): CatalogUnit[] {
  if (!property) return [];
  let order = 0;
  return property.flatMap((f) =>
    f.units.map((u) => ({ ...u, order: order++, floorTitle: f.title, access: f.accessibility_notes ?? "" })),
  );
}

export type FeatureFacet = { code: string; title: string; count: number };

/**
 * امکاناتِ «تمایزدهنده» برای فیلتر: آن‌هایی که بعضی واحدها دارند و بعضی نه (امکان مشترک همه، فیلتر
 * بی‌اثر است). ترتیب = ترتیب ثبت‌شده در سرور. با افزودن امکان تازه در پنل، فیلترش خودکار می‌آید.
 */
export function featureFacets(units: CatalogUnit[]): FeatureFacet[] {
  const seen = new Map<string, FeatureFacet>();
  for (const u of units) {
    for (const f of u.features) {
      const hit = seen.get(f.code);
      if (hit) hit.count += 1;
      else seen.set(f.code, { code: f.code, title: f.title, count: 1 });
    }
  }
  return [...seen.values()].filter((f) => f.count < units.length);
}

/** امکانات مشترکِ همهٔ واحدها (برای جملهٔ «همهٔ واحدها … دارند» در مقایسه). */
export function sharedFeatures(units: CatalogUnit[]): string[] {
  const first = units[0];
  if (!first) return [];
  return first.features.filter((f) => units.every((u) => u.features.some((x) => x.code === f.code))).map((f) => f.code);
}

/** ستون‌های ردیف امکانات در مقایسه: اجتماع امکانات واحدهای انتخابی، شاخص‌ها نخست. */
export function compareFeatures(units: CatalogUnit[]): Array<{ code: string; title: string }> {
  const out = new Map<string, { code: string; title: string; highlight: boolean; at: number }>();
  let at = 0;
  for (const u of units) {
    for (const f of u.features) {
      if (!out.has(f.code))
        out.set(f.code, { code: f.code, title: f.title, highlight: Boolean(f.is_highlight), at: at++ });
    }
  }
  return [...out.values()]
    .sort((a, b) => Number(b.highlight) - Number(a.highlight) || a.at - b.at)
    .map(({ code, title }) => ({ code, title }));
}

/** کوتاه‌ترین برچسب قابل‌نمایش امکانات شاخص کارت (حداکثر سه). */
export function cardFeatures(u: Unit, limit = 3) {
  const hi = u.features.filter((f) => f.is_highlight);
  return (hi.length >= limit ? hi : [...hi, ...u.features.filter((f) => !f.is_highlight)]).slice(0, limit);
}

/* ── دسترسی (آزادی) هر واحد ──────────────────────────────────────────── */

export type Clock = {
  now: number;
  minLeadHours: number;
  horizonDays: number;
  gridStartHour: number;
  cellHours: number;
};

export type Availability =
  | { kind: "loading" }
  | { kind: "unknown"; offline: boolean }
  | { kind: "capacity"; capacity: number }
  | { kind: "next"; window: FreeWindow }
  | { kind: "none" }
  | { kind: "policy"; reason: "lead" | "horizon" }
  | { kind: "free"; start: string; end: string }
  | { kind: "busy"; blocking: number; nearest: FreeWindow | null };

/** لحظهٔ آغاز نیم‌روز انتخابی به افق تهران (‎+03:30‎ — ایران از ۱۴۰۱ ساعت تابستانی ندارد). */
export function tripStart(day: string, period: Period, c: Pick<Clock, "gridStartHour" | "cellHours">): string {
  const hour = period === "day" ? c.gridStartHour : (c.gridStartHour + c.cellHours) % 24;
  const iso = period === "night" && hour < c.gridStartHour ? addDays(day, 1) : day;
  return `${iso}T${String(hour).padStart(2, "0")}:00:00+03:30`;
}

/** آیا آغاز این نیم‌روز در بازهٔ مجاز ثبت است؟ (مهلت پیش از ورود و افق رزرو — قاعدهٔ موتور) */
export function startEligibility(day: string, period: Period, c: Clock): "ok" | "lead" | "horizon" {
  const start = Date.parse(tripStart(day, period, c));
  if (start < c.now + c.minLeadHours * 3_600_000) return "lead";
  if (start > c.now + c.horizonDays * 86_400_000) return "horizon";
  return "ok";
}

/** شمار روزهای ماتریسی که کل اقامت را می‌پوشاند (از روز ورود؛ کران ‎/calendar‎ = ۶۲). */
export function rangeDays(trip: Pick<Trip, "period" | "cells">): number {
  const offset = trip.period === "night" ? 1 : 0;
  return Math.min(62, Math.max(2, Math.ceil((offset + trip.cells) / 2) + 1));
}

export type Sources = {
  trip: Trip;
  clock: Clock;
  /** ردیف ماتریس همان بازه (فقط وقتی تاریخ داده شده) */
  row: UnitTimeline | undefined;
  /** ردیف کشف بازه (نخستین ران آزاد از تاریخ زائر یا از اکنون) */
  window: CalendarWindows["units"][number] | undefined;
  calendarState: "idle" | "loading" | "error" | "ready";
  windowsState: "loading" | "error" | "ready";
  offline: boolean;
};

export function availability(u: Pick<Unit, "capacity_total">, s: Sources): Availability {
  if (s.trip.guests > u.capacity_total) return { kind: "capacity", capacity: u.capacity_total };
  if (!s.trip.day) {
    if (s.windowsState === "loading") return { kind: "loading" };
    if (s.windowsState === "error" || !s.window) return { kind: "unknown", offline: s.offline };
    return s.window.window ? { kind: "next", window: s.window.window } : { kind: "none" };
  }
  const gate = startEligibility(s.trip.day, s.trip.period, s.clock);
  if (gate !== "ok") return { kind: "policy", reason: gate };
  if (s.calendarState === "loading" || s.calendarState === "idle") return { kind: "loading" };
  if (s.calendarState === "error" || !s.row) return { kind: "unknown", offline: s.offline };
  const v = evaluate(
    s.row,
    { day: s.trip.day, period: s.trip.period, cells: s.trip.cells, guests: s.trip.guests },
    new Date(s.clock.now),
    s.clock.minLeadHours,
  );
  switch (v.kind) {
    case "ok":
      return { kind: "free", start: v.cells[0]?.start ?? "", end: v.cells.at(-1)?.end ?? "" };
    case "partial": {
      const nearest = s.windowsState === "ready" ? (s.window?.window ?? null) : null;
      return { kind: "busy", blocking: v.blocking.length, nearest };
    }
    case "capacity":
      return { kind: "capacity", capacity: v.capacity };
    case "lead":
      return { kind: "policy", reason: "lead" };
    case "beyond":
      // پایان اقامت از آخرین نیم‌روز منتشرشده (افق رزرو) می‌گذرد.
      return { kind: "policy", reason: "horizon" };
  }
}

/** لحظهٔ «زودترین شروع ممکن» هر واحد برای مرتب‌سازی «شروع آزاد زودتر». */
export function earliestStart(a: Availability): number {
  if (a.kind === "free") return Date.parse(a.start);
  if (a.kind === "next") return Date.parse(a.window.start);
  if (a.kind === "busy" && a.nearest) return Date.parse(a.nearest.start);
  return Number.POSITIVE_INFINITY;
}

/** نزدیک‌ترین آغاز پیشنهادی (برای دکمهٔ «انتخاب این شروع»). */
export function suggestion(a: Availability): FreeWindow | null {
  if (a.kind === "next") return a.window;
  if (a.kind === "busy") return a.nearest;
  return null;
}

/* ── پالایش و ترتیب ─────────────────────────────────────────────────── */

export type Filters = Pick<PageState, "kind" | "floor" | "feats" | "freeOnly">;

export function matches(
  u: CatalogUnit,
  f: Filters,
  a: Availability | undefined,
  dated: boolean,
  skip?: keyof Filters,
): boolean {
  if (skip !== "kind" && f.kind !== "all" && u.unit_type !== f.kind) return false;
  if (skip !== "floor" && f.floor && u.floor_number !== f.floor) return false;
  if (skip !== "feats" && f.feats.some((code) => !u.features.some((x) => x.code === code))) return false;
  if (skip !== "freeOnly" && f.freeOnly && dated && a?.kind !== "free") return false;
  return true;
}

export function sortUnits(
  units: CatalogUnit[],
  sort: Sort,
  guests: number,
  avail: Map<string, Availability>,
): CatalogUnit[] {
  const out = [...units];
  if (sort === "fit") {
    // واحدهایی که جا دارند نخست؛ میانشان کوچک‌ترین ظرفیت کافی (فضای خالی کمتر، منصفانه‌تر برای گروه‌های بزرگ).
    out.sort((a, b) => {
      const fa = a.capacity_total >= guests ? 0 : 1;
      const fb = b.capacity_total >= guests ? 0 : 1;
      return fa - fb || Math.abs(a.capacity_total - guests) - Math.abs(b.capacity_total - guests) || a.order - b.order;
    });
  } else if (sort === "soon") {
    out.sort((a, b) => {
      const ea = earliestStart(avail.get(a.code) ?? { kind: "loading" });
      const eb = earliestStart(avail.get(b.code) ?? { kind: "loading" });
      return (ea === eb ? 0 : ea < eb ? -1 : 1) || a.order - b.order;
    });
  } else {
    out.sort((a, b) => a.order - b.order);
  }
  return out;
}

/** شمار فیلترهای فعال (نشان دکمهٔ «فیلترها» در گوشی). */
export function activeFilterCount(f: Filters, dated: boolean): number {
  return (f.kind !== "all" ? 1 : 0) + (f.floor ? 1 : 0) + f.feats.length + (f.freeOnly && dated ? 1 : 0);
}

/* ── مقایسه ─────────────────────────────────────────────────────────── */

export function toggleCompare(list: string[], code: string): { list: string[]; full: boolean } {
  if (list.includes(code)) return { list: list.filter((c) => c !== code), full: false };
  if (list.length >= MAX_COMPARE) return { list, full: true };
  return { list: [...list, code], full: false };
}

/**
 * پیشنهادهای آمادهٔ مقایسه از خود داده: هم‌نوع‌ها کنار هم، و واحدهای هم‌طبقه.
 * (بی‌نام‌بردن ثابت از A1/B1 — با تغییر چیدمان در پنل، پیشنهادها هم عوض می‌شوند.)
 */
export function comparePresets(
  units: CatalogUnit[],
): Array<{ id: string; title: string; hint: string; codes: string[] }> {
  const out: Array<{ id: string; title: string; hint: string; codes: string[] }> = [];
  for (const type of ["suite", "large_room"] as const) {
    const group = units.filter((u) => u.unit_type === type);
    const first = group[0];
    if (group.length >= 2 && first) {
      out.push({
        id: `type-${type}`,
        title: type === "suite" ? "سوئیت‌ها کنار هم" : "اتاق‌های بزرگ کنار هم",
        hint: first.type_label,
        codes: group.slice(0, MAX_COMPARE).map((u) => u.code),
      });
    }
  }
  const floors = [...new Set(units.map((u) => u.floor_number))];
  for (const n of floors) {
    const group = units.filter((u) => u.floor_number === n);
    const first = group[0];
    if (group.length >= 2 && first) {
      const codes = group.slice(0, MAX_COMPARE).map((u) => u.code);
      out.push({
        id: `floor-${n}`,
        title: `${codes.length === 2 ? "دو" : "سه"} گزینهٔ ${first.floorTitle}`,
        hint: first.floorTitle,
        codes,
      });
    }
  }
  return out;
}

/** «دو روز آینده» پرکاربرد برای شبکهٔ تاریخ سریع پنجرهٔ سفر (امروز + ۷ روز). */
export function quickDays(today: string, count = 8): string[] {
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

/** پیش‌تنظیم‌های مدت (نیم‌روز): نیم‌روز، یک شبانه‌روز، دو شبانه‌روز، یک هفته — درون سقف سیاست. */
export const DURATION_PRESETS = [1, 2, 4, 14] as const;
