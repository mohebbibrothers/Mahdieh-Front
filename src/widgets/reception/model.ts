import type { Desk, DeskRow, DeskUnit, KeyLocation, Lane, UnitState } from "@/shared/api/desk";
import { faDigits, formatFullDate, latinDigits } from "@/shared/lib/fa";

/**
 * منطق خالص میز پذیرش (P-06) — بی‌وابستگی به React تا با آزمون واحد قفل شود.
 * قواعد کسب‌وکار (پذیرش‌پذیری، عدم‌حضور، تقدم وضعیت) فقط در سرور است؛ اینجا فقط
 * نمایش، فیلتر، جست‌وجو و ساخت ورودی فرم‌ها از روی همان پرچم‌های سرور.
 * ایران از ۱۴۰۱ ساعت تابستانی ندارد ⇒ افق تهران همیشه ‎+03:30‎ است (همان فرض ‎fa.ts‎).
 */
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const MINUTE = 60_000;
const HOUR = 3_600_000;

// ── تب‌های دفتر ─────────────────────────────────────────────────────────────
export type LedgerTab = "all" | "waiting" | "inside" | "alerts" | "closed";
export const LEDGER_TABS: ReadonlyArray<{ id: LedgerTab; label: string; short: string; lanes: readonly Lane[] }> = [
  {
    id: "all",
    label: "همهٔ نوبت‌ها",
    short: "همه",
    lanes: ["expected", "delayed", "checked_in", "overstay", "checked_out", "no_show", "cancelled"],
  },
  { id: "waiting", label: "در انتظار ورود", short: "در انتظار", lanes: ["expected", "delayed"] },
  { id: "inside", label: "پذیرش‌شده‌ها", short: "پذیرش‌شده", lanes: ["checked_in", "overstay"] },
  { id: "alerts", label: "تأخیر / هشدار", short: "هشدار", lanes: ["delayed", "overstay"] },
  { id: "closed", label: "تخلیه و بسته‌شده", short: "بسته‌شده", lanes: ["checked_out", "no_show", "cancelled"] },
];

export function inTab(row: DeskRow, tab: LedgerTab): boolean {
  const def = LEDGER_TABS.find((t) => t.id === tab) ?? LEDGER_TABS[0];
  return def ? def.lanes.includes(row.desk.lane) : true;
}

export function tabCounts(rows: readonly DeskRow[]): Record<LedgerTab, number> {
  const out = { all: 0, waiting: 0, inside: 0, alerts: 0, closed: 0 } satisfies Record<LedgerTab, number>;
  for (const row of rows) for (const t of LEDGER_TABS) if (inTab(row, t.id)) out[t.id] += 1;
  return out;
}

// ── جست‌وجو ─────────────────────────────────────────────────────────────────
/** یکسان‌سازی فارسی/عربی، ارقام و فاصله‌ها (ی/ي، ک/ك، ة، نیم‌فاصله، اعراب). */
export function normalize(raw: string): string {
  return latinDigits(raw)
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ة]/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u200c\u200f\u200e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** همهٔ نشانه‌های قابل جست‌وجوی یک ردیف (نام، واحد، کدها، شهر، ارقام پیدای کد ملی/تلفن). */
export function haystack(row: DeskRow): string {
  const digits = (s: string) => latinDigits(s).replace(/\D/g, "");
  return normalize(
    [
      row.guest_name,
      row.unit_code,
      row.unit_title,
      row.code,
      row.desk.short_code,
      row.desk.guest_city,
      row.desk.lane_label,
      row.status_label,
      digits(row.desk.guest_national_id_masked),
      digits(row.guest_phone_masked),
      row.vehicle_plate,
    ].join(" "),
  );
}

export function searchRows(rows: readonly DeskRow[], query: string): DeskRow[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return [...rows];
  return rows.filter((r) => {
    const hay = haystack(r);
    return terms.every((t) => hay.includes(t));
  });
}

/** ترتیب دفتر: هشدارها، سپس در انتظار به‌ترتیب موعد، سپس مقیم‌ها، سپس بسته‌شده‌ها. */
const LANE_ORDER: Record<Lane, number> = {
  overstay: 0,
  delayed: 1,
  expected: 2,
  checked_in: 3,
  checked_out: 4,
  no_show: 5,
  cancelled: 6,
};
export function sortLedger(rows: readonly DeskRow[]): DeskRow[] {
  return [...rows].sort(
    (a, b) =>
      LANE_ORDER[a.desk.lane] - LANE_ORDER[b.desk.lane] || Date.parse(a.desk.due_at) - Date.parse(b.desk.due_at),
  );
}

// ── تابلو و KPI ─────────────────────────────────────────────────────────────
export type BoardFilter = UnitState | null;

export const KPI_CARDS: ReadonlyArray<{ state: Exclude<UnitState, "maintenance">; label: string; icon: string }> = [
  { state: "occupied", label: "واحدهای مقیم (کلید تحویل‌شده)", icon: "home" },
  { state: "ready", label: "واحدهای آمادهٔ تحویل کلید", icon: "key" },
  { state: "buffer", label: "در حال نظافت و آماده‌سازی", icon: "broom" },
  { state: "expected", label: "در انتظار ورود زائر", icon: "hourglass" },
];

export function kpiSub(desk: Desk, state: UnitState): string {
  const units = desk.units.filter((u) => u.state === state);
  const codes = units.map((u) => u.code).join("، ");
  const n = faDigits(units.length);
  if (units.length === 0) return "هیچ واحدی در این وضعیت نیست";
  switch (state) {
    case "occupied":
      return `${n} واحد · ${faDigits(desk.kpis.guests_in_house)} زائر مقیم · ${codes}`;
    case "ready":
      return `${n} واحد آمادهٔ تحویل · ${codes}`;
    case "buffer": {
      const parts = units.map((u) => `${u.code} ${faDigits(u.housekeeping?.percent ?? 0)}٪`);
      return `${n} واحد · ${parts.join("، ")}`;
    }
    case "expected": {
      const first = units
        .map((u) => u.arrival)
        .filter((r): r is DeskRow => r !== null)
        .sort((a, b) => Date.parse(a.desk.due_at) - Date.parse(b.desk.due_at))[0];
      return first ? `${n} واحد · نخستین ورود ${first.unit_code} ساعت ${first.desk.due_label}` : `${n} واحد`;
    }
    case "maintenance":
      return `${n} واحد · ${codes}`;
  }
}

export function visibleUnits(units: readonly DeskUnit[], filter: BoardFilter): DeskUnit[] {
  return filter ? units.filter((u) => u.state === filter) : [...units];
}

export type Tone = "brand" | "gold" | "amber" | "danger" | "info" | "neutral" | "success";

export const STATE_TONE: Record<UnitState, Tone> = {
  occupied: "brand",
  expected: "info",
  ready: "success",
  buffer: "amber",
  maintenance: "danger",
};

export const KEY_TONE: Record<KeyLocation, "taken" | "present" | "cleaning" | "maint"> = {
  guest: "taken",
  cabinet: "present",
  housekeeping: "cleaning",
  facilities: "maint",
};
export const KEY_SHORT: Record<KeyLocation, string> = {
  guest: "نزد زائر",
  cabinet: "در قفسه",
  housekeeping: "خدمات",
  facilities: "تأسیسات",
};

export const LANE_TONE: Record<Lane, Tone> = {
  expected: "info",
  delayed: "amber",
  checked_in: "brand",
  overstay: "danger",
  checked_out: "neutral",
  no_show: "danger",
  cancelled: "neutral",
};

// ── زمان ────────────────────────────────────────────────────────────────────
/** لحظه ⇒ ISO به افق تهران: «2026-10-23T20:00:00+03:30». */
export function tehranIso(ms: number): string {
  return `${new Date(ms + TEHRAN_OFFSET_MS).toISOString().slice(0, 19)}+03:30`;
}
/** روز تقویمی تهران یک لحظه (YYYY-MM-DD). */
export function tehranDay(ms: number): string {
  return new Date(ms + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
}
/** «روز + ساعت:دقیقه» تهران ⇒ لحظه (ms). */
export function tehranMoment(day: string, hhmm: string): number {
  return Date.parse(`${day}T${hhmm}:00+03:30`);
}
/** ساعت دیواری تهران یک لحظه (HH:MM لاتین؛ برای نمایش، faDigits بزنید). */
export function tehranClock(ms: number): string {
  return new Date(ms + TEHRAN_OFFSET_MS).toISOString().slice(11, 16);
}
/** «۲۴ مهر ۱۴۰۵ ساعت ۱۴:۰۰» — برچسب کامل یک لحظه به افق تهران. */
export function tehranLabel(ms: number): string {
  return `${formatFullDate(tehranDay(ms))} ساعت ${faDigits(tehranClock(ms))}`;
}
function tehranHour(ms: number): number {
  return new Date(ms + TEHRAN_OFFSET_MS).getUTCHours();
}

/** ثانیه‌های باقی‌ماندهٔ پنجرهٔ «تأیید تازه» (۰ یعنی کهنه). */
export function freshSeconds(validUntil: string | null, now: number): number {
  if (!validUntil) return 0;
  return Math.max(0, Math.floor((Date.parse(validUntil) - now) / 1000));
}

export function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${faDigits(minutes)} دقیقه`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${faDigits(h)} ساعت و ${faDigits(m)} دقیقه` : `${faDigits(h)} ساعت`;
}

/** «۱۲ دقیقه پیش» / «۲ ساعت پیش» برای رخدادنگار. */
export function agoLabel(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MINUTE) return "همین حالا";
  if (diff < HOUR) return `${faDigits(Math.floor(diff / MINUTE))} دقیقه پیش`;
  if (diff < 24 * HOUR) return `${faDigits(Math.floor(diff / HOUR))} ساعت پیش`;
  return `${faDigits(Math.floor(diff / (24 * HOUR)))} روز پیش`;
}

/** پیشرفت زندهٔ نظافت میان دو نظرسنجی سرور (سرور منبع حقیقت است؛ این فقط درون‌یابی است). */
export function liveProgress(task: { started_at: string; due_at: string }, now: number) {
  const start = Date.parse(task.started_at);
  const due = Date.parse(task.due_at);
  const span = Math.max(1, due - start);
  const percent = Math.min(100, Math.max(0, Math.round(((now - start) / span) * 100)));
  const remaining = Math.ceil((due - now) / MINUTE);
  return { percent, remaining, overdue: now > due };
}

// ── پیشنهادهای زمان رفع مسدودی ──────────────────────────────────────────────
export type ReleasePreset = { id: string; label: string; hint: string; end: string };

/** پیشنهادهای واقع‌گرایانه برای پایان تعمیرات، همه پس از اکنون. */
export function releasePresets(now: number): ReleasePreset[] {
  const today = tehranDay(now);
  const tomorrow = tehranDay(now + 24 * HOUR);
  const out: ReleasePreset[] = [];
  const add = (id: string, label: string, hint: string, ms: number) => {
    if (ms > now + 15 * MINUTE) out.push({ id, label, hint, end: tehranIso(ms) });
  };
  add("tonight", "امشب ۲۳:۰۰", "پیش از خاموشی", tehranMoment(today, "23:00"));
  add("morning", "فردا ۰۸:۰۰", "آغاز شیفت روز", tehranMoment(tomorrow, "08:00"));
  add("evening", "فردا ۲۰:۰۰", "آغاز شیفت شب", tehranMoment(tomorrow, "20:00"));
  add("two-days", "۴۸ ساعت آینده", "تعمیرات اساسی", Math.ceil((now + 48 * HOUR) / HOUR) * HOUR);
  if (tehranHour(now) < 18) add("afternoon", "امروز ۱۸:۰۰", "تعمیر سبک", tehranMoment(today, "18:00"));
  return out.sort((a, b) => Date.parse(a.end) - Date.parse(b.end));
}

// ── شیفت و خروجی ────────────────────────────────────────────────────────────
export type ExportRange = "shift" | "today" | "week" | "custom";

export function exportRange(kind: ExportRange, desk: Desk, custom: { from: string; to: string }) {
  const day = desk.day;
  switch (kind) {
    case "shift":
      return { from: desk.shift.report_from, to: desk.shift.report_to };
    case "today":
      return { from: day, to: day };
    case "week": {
      const from = tehranDay(Date.parse(`${day}T12:00:00+03:30`) - 6 * 24 * HOUR);
      return { from, to: day };
    }
    case "custom":
      return custom;
  }
}

// ── پذیرش سریع ──────────────────────────────────────────────────────────────
export type ChecklistId = "identity" | "rules" | "key";
export const CHECKLIST: ReadonlyArray<{ id: ChecklistId; text: string; hint: string }> = [
  {
    id: "identity",
    text: "تطبیق فیزیکی کارت ملی یا گذرنامهٔ سرپرست و شمار همراهان",
    hint: "چهره و نام سرپرست با گواهی یکی باشد؛ بیش از ظرفیت مجاز واحد پذیرفته نمی‌شود",
  },
  {
    id: "rules",
    text: "تذکر ساعت خاموشی شبستان و آداب زائرسرا و زیارت حرم مطهر",
    hint: "ساعت تخلیه و راه تماس با پیشخوان هم گفته شود",
  },
  {
    id: "key",
    text: "تحویل فیزیکی کلید و کارت تردد واحد به سرپرست",
    hint: "کلید از قفسه برداشته و به زائر سپرده شد",
  },
];

/** یادداشت حسابرسی پذیرش: چک‌لیست تأییدشده + یادداشت آزاد خادم (سقف ۳۰۰ نویسهٔ سرور). */
export function checkInNote(checked: ReadonlySet<ChecklistId>, free: string): string {
  const done = CHECKLIST.filter((c) => checked.has(c.id)).length;
  const base = `چک‌لیست پذیرش: ${faDigits(done)} از ${faDigits(CHECKLIST.length)} تأیید شد`;
  const text = free.trim();
  return (text ? `${base} · ${text}` : base).slice(0, 300);
}

/** نسخهٔ تازهٔ یک ردیف از آخرین تصویر میز (پرچم‌ها پس از هر نظرسنجی به‌روز می‌شوند). */
export function freshRow(desk: Desk, row: DeskRow): DeskRow {
  for (const r of desk.ledger) if (r.id === row.id) return r;
  for (const u of desk.units) {
    if (u.current?.id === row.id) return u.current;
    if (u.arrival?.id === row.id) return u.arrival;
  }
  return row;
}

/** چرا دکمهٔ پذیرش غیرفعال است؟ (متن راهنمای خادم؛ قاعدهٔ نهایی با سرور) */
export function checkInBlocker(row: DeskRow, now: number): string | null {
  if (row.desk.can_check_in) return null;
  if (row.status === "checked_in") return "این زائر پیش‌تر پذیرش شده و کلید نزد اوست.";
  if (row.status !== "confirmed") return `وضعیت نوبت «${row.status_label}» است و پذیرش ندارد.`;
  if (now && Date.parse(row.desk.check_in_opens_at) > now)
    return `پنجرهٔ پذیرش از ${formatMomentShort(row.desk.check_in_opens_at)} باز می‌شود.`;
  return "زمان این نوبت گذشته است؛ برای جابه‌جایی یا ثبت عدم‌حضور از منوی کارت واحد استفاده کنید.";
}

function formatMomentShort(iso: string): string {
  const ms = Date.parse(iso) + TEHRAN_OFFSET_MS;
  const d = new Date(ms);
  return faDigits(`${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`);
}

/** برچسب کوتاه یک ردیف برای سرتیتر پنجره‌ها. */
export function rowTitle(row: Pick<DeskRow, "unit_code" | "unit_title" | "guest_name" | "guests_count">): string {
  return `${row.unit_title} (${row.unit_code}) · ${row.guest_name || "زائر"} · ${faDigits(row.guests_count)} نفر`;
}

/** آیا ورودی اسکنر ارزش جست‌وجوی خودکار دارد؟ (QR کامل، کد رزرو، کد کوتاه ۸ نویسه، کد ملی ۱۰ رقم) */
export function isCompleteScan(raw: string): boolean {
  const v = latinDigits(raw).trim();
  if (!v) return false;
  if (/\/verify\/|^https?:\/\//i.test(v) || v.length > 40) return true;
  if (/^[A-Za-z]{1,3}-\d{4}-\d{2,6}$/.test(v)) return true;
  if (/^[A-Za-z0-9]{4}-?[A-Za-z0-9]{4}$/.test(v)) return true;
  return /^\d{10}$/.test(v);
}

/** وضعیت دسترسی شماره: ردیفی که زائر مقیم یا در راه است، تماس موجه دارد. */
export function phoneWorthy(row: DeskRow): boolean {
  return ["expected", "delayed", "checked_in", "overstay"].includes(row.desk.lane);
}

export type PurposeId = "call_guest" | "verify_identity" | "emergency" | "other";
export const PURPOSES: ReadonlyArray<{ id: PurposeId; label: string; hint: string }> = [
  { id: "call_guest", label: "تماس با زائر", hint: "هماهنگی ورود، تأخیر یا تحویل کلید" },
  { id: "verify_identity", label: "احراز هویت", hint: "تطبیق شمارهٔ سرپرست با مدارک" },
  { id: "emergency", label: "وضعیت اضطراری", hint: "حادثه، بیماری یا رخداد امنیتی" },
  { id: "other", label: "سایر (با توضیح)", hint: "توضیح کوتاه الزامی است" },
];

// ── شبکهٔ نیم‌روز (جابه‌جایی و ثبت حضوری) ────────────────────────────────────
export type Period = "day" | "night";
export type Lattice = { cellHours: number; gridStartHour: number };
export const DEFAULT_LATTICE: Lattice = { cellHours: 12, gridStartHour: 8 };
/** بیشینهٔ مدت اقامت (یک هفته = ۱۴ نیم‌روز) — همان سقف سیاست بک‌اند؛ سرور داور نهایی است. */
export const MAX_CELLS = 14;

export function readLattice(raw: Record<string, number> | undefined): Lattice {
  return {
    cellHours: raw?.cell_hours ?? DEFAULT_LATTICE.cellHours,
    gridStartHour: raw?.grid_start_hour ?? DEFAULT_LATTICE.gridStartHour,
  };
}

/** «روز + نیم‌روز + مدت» ⇒ بازهٔ دقیق ISO (همان قاعدهٔ ‎count_cells‎ سرور). */
export function latticeRange(
  sel: { day: string; period: Period; cells: number },
  lattice: Lattice = DEFAULT_LATTICE,
): { start: string; end: string } {
  const hour = lattice.gridStartHour + (sel.period === "night" ? lattice.cellHours : 0);
  const startMs = Date.parse(`${sel.day}T00:00:00+03:30`) + hour * HOUR;
  return { start: tehranIso(startMs), end: tehranIso(startMs + sel.cells * lattice.cellHours * HOUR) };
}

/** بازهٔ یک رزرو ⇒ انتخاب «روز + نیم‌روز + مدت» (پیش‌فرض پنجرهٔ جابه‌جایی). */
export function selectionOf(
  range: { start: string; end: string },
  lattice: Lattice = DEFAULT_LATTICE,
): { day: string; period: Period; cells: number } {
  const startMs = Date.parse(range.start);
  const local = new Date(startMs + TEHRAN_OFFSET_MS);
  const cells = Math.max(1, Math.round((Date.parse(range.end) - startMs) / (lattice.cellHours * HOUR)));
  return {
    day: local.toISOString().slice(0, 10),
    period: local.getUTCHours() === lattice.gridStartHour ? "day" : "night",
    cells: Math.min(MAX_CELLS, cells),
  };
}

/** شمارهٔ همراه ایران (۰۹…) یا بین‌المللی (+…) — اعتبارسنجی سبک سمت کاربر؛ داور نهایی سرور. */
export function phoneLooksValid(raw: string): boolean {
  const v = latinDigits(raw).replace(/[\s-]/g, "");
  return /^(?:09\d{9}|\+\d{8,15}|00\d{8,15})$/.test(v);
}

/** دلیل‌های آماده — فقط پیشنهاد؛ متن نهایی همیشه قابل ویرایش است. */
export const BLOCK_REASONS = [
  "سرویس دوره‌ای فن‌کوئل و فیلترهای هوا",
  "تعمیر تأسیسات سرمایش، گرمایش و لوله‌کشی",
  "رفع نقص روشنایی، کلید و پریزها",
  "رسیدگی به قفل در و کلید واحد",
] as const;
export const UNBLOCK_REASONS = [
  "تعمیر انجام و واحد بازبینی شد",
  "مسدودی اشتباه ثبت شده بود",
  "کار به زمان دیگری موکول شد",
] as const;
export const NO_SHOW_REASONS = ["تماس‌ها بی‌پاسخ ماند", "زائر از سفر منصرف شده است", "زائر خبر داد نمی‌رسد"] as const;
export const MOVE_REASONS = ["درخواست زائر", "نقص فنی واحد قبلی", "تناسب ظرفیت با شمار همراهان"] as const;
export const REASON_MIN = 5;

// ── عامل دوم ────────────────────────────────────────────────────────────────
/** کد بازیابی «XXXXX-XXXXX» (۱۰ نویسه بی خط تیره و فاصله) آمادهٔ ارسال است؟ */
export const recoveryReady = (v: string) => v.replace(/[-\s]/g, "").length >= 10;

/** فقط مسیر نسبیِ همین مبدأ (نه ‎//evil‎، نه ‎/\‎ و نه طرح‌واره) ⇒ جلوگیری از تغییرمسیر باز؛ خودِ پیشخوان هم نه. */
export function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (raw.startsWith("/reception")) return null;
  return raw;
}
