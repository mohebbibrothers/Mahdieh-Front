import type { Period } from "@/entities/slot/timeline";
import type { Alternative, Reservation, ReservationEvent, ReservationStatus } from "@/shared/api/schemas";
import { faDigits, latinDigits } from "@/shared/lib/fa";

/**
 * منطق خالص صفحهٔ «تکمیل و صدور رزرو» — بی‌وابستگی به React تا با آزمون واحد قفل شود.
 * ایران از ۱۴۰۱ ساعت تابستانی ندارد ⇒ افق تهران همیشه ‎+03:30‎ است (همان فرض ‎fa.ts‎).
 */
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const HOUR = 3_600_000;

export type Lattice = { cellHours: number; gridStartHour: number };
export const DEFAULT_LATTICE: Lattice = { cellHours: 12, gridStartHour: 8 };

/** لحظه ⇒ رشتهٔ ISO به افق تهران: «2026-10-23T20:00:00+03:30». */
export function tehranIso(ms: number): string {
  return `${new Date(ms + TEHRAN_OFFSET_MS).toISOString().slice(0, 19)}+03:30`;
}

/** بازهٔ دقیق درخواست از روی شبکهٔ نیم‌روز (همان قاعدهٔ ‎count_cells‎ بک‌اند)، حتی فراتر از تقویم بارشده. */
export function stayRange(
  sel: { day: string; period: Period; cells: number },
  lattice: Lattice = DEFAULT_LATTICE,
): { start: string; end: string } {
  const hour = lattice.gridStartHour + (sel.period === "night" ? lattice.cellHours : 0);
  const startMs = Date.parse(`${sel.day}T00:00:00+03:30`) + hour * HOUR;
  return { start: tehranIso(startMs), end: tehranIso(startMs + sel.cells * lattice.cellHours * HOUR) };
}

/** پیشنهاد جایگزین سرور ⇒ انتخاب تازه (واحد، روز، نیم‌روز، مدت) برای جایگزینی یک‌کلیکی. */
export function alternativeToSelection(
  a: Pick<Alternative, "unit_code" | "start" | "end">,
  lattice: Lattice = DEFAULT_LATTICE,
): { unit: string; day: string; period: Period; cells: number } {
  const startMs = Date.parse(a.start);
  const local = new Date(startMs + TEHRAN_OFFSET_MS);
  const hour = local.getUTCHours();
  const cells = Math.max(1, Math.round((Date.parse(a.end) - startMs) / (lattice.cellHours * HOUR)));
  return {
    unit: a.unit_code,
    day: local.toISOString().slice(0, 10),
    period: hour === lattice.gridStartHour ? "day" : "night",
    cells,
  };
}

/* ── کلید هم‌توانی ──────────────────────────────────────────────────────────
 * یک کلید برای «همین درخواست» (واحد + بازه + نفرات) در همین زبانه: ضربهٔ دوباره، رفرش وسط ارسال یا
 * تلاش دوباره پس از قطع شبکه همان کلید را می‌فرستد ⇒ سرور همان رزرو را بازپخش می‌کند، نه رزرو دوم.
 * تغییر هر جزء ⇒ کلید تازه (سرور همان کلید با بدنهٔ دیگر را ۴۰۹ می‌کند). پس از موفقیت کلید دور ریخته
 * می‌شود تا رزرو دوبارهٔ همان سانس پس از لغو، بازپخشِ رزرو لغوشده نگیرد. */
type IdemPayload = { unit_code: string; start: string; end: string; guests_count: number };
const IDEM_PREFIX = "mahdieh:idem:";
const idemSlot = (p: IdemPayload) => `${IDEM_PREFIX}${p.unit_code}|${p.start}|${p.end}|${p.guests_count}`;

function session(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null; // حالت خصوصی سخت‌گیر ⇒ کلید فقط در حافظهٔ همین صفحه
  }
}
const memory = new Map<string, string>();

function newKey(): string {
  // ‎randomUUID‎ فقط در «زمینهٔ امن» (HTTPS) هست؛ روی HTTP آزمایشی به ‎getRandomValues‎ برمی‌گردیم.
  const c: Partial<Crypto> = globalThis.crypto;
  if (typeof c.randomUUID === "function") return `web-${c.randomUUID()}`;
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return `web-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function idempotencyKeyFor(p: IdemPayload): string {
  const slot = idemSlot(p);
  const store = session();
  const existing = store?.getItem(slot) ?? memory.get(slot);
  if (existing) return existing;
  const key = newKey();
  memory.set(slot, key);
  try {
    store?.setItem(slot, key);
  } catch {
    /* سهمیهٔ حافظه پر ⇒ همان حافظهٔ صفحه کافی است */
  }
  return key;
}

export function forgetIdempotencyKey(p: IdemPayload): void {
  const slot = idemSlot(p);
  memory.delete(slot);
  try {
    session()?.removeItem(slot);
  } catch {
    /* بی‌اثر */
  }
}

/** نمایش کوتاه و خوانای کلید برای زائر (طراح: «IDEMP-9F4B2»). */
export function shortKey(key: string): string {
  return `IDEMP-${key.replace(/^web-/, "").replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

/* ── پلاک خودرو ─────────────────────────────────────────────────────────── */
export type PlateParts = { two: string; letter: string; three: string; region: string };
export const EMPTY_PLATE: PlateParts = { two: "", letter: "", three: "", region: "" };
/** حروف مجاز پلاک‌های شخصی/عمومی ایران (الف با «ا» هم پذیرفته می‌شود). */
export const PLATE_LETTERS = "ابپتثجدزسشصطعفقکگلمنوهیژ";

export const plateDigits = (raw: string, max: number) => latinDigits(raw).replace(/\D/g, "").slice(0, max);
export function plateLetter(raw: string): string {
  const ch = raw.replace(/الف/g, "ا").replace(/[يى]/g, "ی").replace(/ك/g, "ک").trim().slice(-1);
  return PLATE_LETTERS.includes(ch) ? ch : "";
}
export const plateFilled = (p: PlateParts) =>
  p.two.length === 2 && p.letter.length === 1 && p.three.length === 3 && p.region.length === 2;
export const plateEmpty = (p: PlateParts) => !p.two && !p.letter && !p.three && !p.region;

/** «۱۲ ب ۳۴۵ ایران ۳۶» — ۱۶ نویسه (سقف بک‌اند ۲۰)، همان شکلی که روی پلاک خوانده می‌شود. */
export function composePlate(p: PlateParts): string {
  return `${faDigits(p.two)} ${p.letter} ${faDigits(p.three)} ایران ${faDigits(p.region)}`;
}

/** «۱۲ ب ۳۴۵ ایران ۳۶» (همان ‎composePlate‎) ⇒ خانه‌های پلاک؛ هر قالب دیگر ⇒ ‎null‎ (پلاک خارجی/آزاد). */
export function parsePlate(text: string): PlateParts | null {
  const m = /^\s*(\d{2})\s*(\S)\s*(\d{3})\s*(?:ایران)?\s*(\d{2})\s*$/.exec(latinDigits(text));
  if (!m) return null;
  const [, two = "", letter = "", three = "", region = ""] = m;
  return PLATE_LETTERS.includes(letter) ? { two, letter, three, region } : null;
}

/** وارون ‎composeNote‎: «نیازها: الف، ب — متن» ⇒ نیازهای شناخته و متن آزاد. */
export function parseNote(note: string): { needs: string[]; text: string } {
  const m = /^نیازها: ([^—]*?)(?: — ([\s\S]*))?$/.exec(note.trim());
  if (!m) return { needs: [], text: note.trim() };
  const listed = (m[1] ?? "").split("، ").map((s) => s.trim());
  const known = listed.filter((n) => (NEEDS as readonly string[]).includes(n));
  const unknown = listed.filter((n) => n && !(NEEDS as readonly string[]).includes(n));
  const text = [unknown.length ? `نیازها: ${unknown.join("، ")}` : "", (m[2] ?? "").trim()].filter(Boolean).join(" — ");
  return { needs: known, text };
}

/* ── ساعت تقریبی رسیدن ───────────────────────────────────────────────────── */
export type ArrivalOption = { value: string; label: string; hint?: string };

function dayPart(hour: number): string {
  if (hour < 5) return "بامداد";
  if (hour < 12) return "صبح";
  if (hour < 17) return "بعدازظهر";
  if (hour < 20) return "عصر";
  return "شب";
}

/** گزینه‌های ساعت رسیدن از آغاز سانس تا چهار ساعت پس از آن (ارسال به‌شکل ‎HH:MM‎). */
export function arrivalOptions(startIso: string): ArrivalOption[] {
  const base = Date.parse(startIso);
  const steps = [0, 30, 60, 90, 120, 180, 240];
  return steps.map((min) => {
    const local = new Date(base + min * 60_000 + TEHRAN_OFFSET_MS);
    const hh = local.getUTCHours();
    const value = `${String(hh).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
    return {
      value,
      label: `ساعت ${faDigits(value)} ${dayPart(hh)}`,
      ...(min === 0 ? { hint: "هم‌زمان با آغاز سانس" } : min >= 180 ? { hint: "رسیدن دیرهنگام قطار یا پرواز" } : {}),
    };
  });
}

/** «۲۰:۳۰:۰۰» سرور ⇒ «ساعت ۲۰:۳۰ شب». */
export function arrivalLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const [h = "0", m = "0"] = value.split(":");
  return `ساعت ${faDigits(`${h.padStart(2, "0")}:${m.padStart(2, "0")}`)} ${dayPart(Number(h))}`;
}

/* ── نیازهای ویژه (برچسب‌های آماده در یادداشت) ───────────────────────────── */
export const NEEDS = ["زائر سالمند", "نیاز به ویلچر", "همراه کودک خردسال", "نیاز پزشکی ویژه"] as const;
export const NOTE_MAX = 300;

/** یادداشت نهایی: «نیازها: …» + متن آزاد؛ همیشه زیر سقف ۳۰۰ نویسهٔ بک‌اند. */
export function composeNote(needs: readonly string[], text: string): string {
  const head = needs.length ? `نیازها: ${needs.join("، ")}` : "";
  const body = text.trim();
  return [head, body].filter(Boolean).join(" — ").slice(0, NOTE_MAX);
}

/* ── وضعیت و گاه‌شمار ───────────────────────────────────────────────────── */
export const CERTIFIABLE: ReadonlySet<ReservationStatus> = new Set(["confirmed", "checked_in", "completed"]);
export const CANCELLED: ReadonlySet<ReservationStatus> = new Set([
  "cancelled_by_guest",
  "cancelled_by_staff",
  "no_show",
  "expired",
  "superseded",
]);

export type Milestone = {
  key: "booked" | "prepare" | "checkin" | "checkout" | "closed";
  title: string;
  detail: string;
  at: string | null;
  state: "done" | "current" | "upcoming" | "stopped";
};

/** گاه‌شمار طراح (ثبت ← آماده‌سازی ← پذیرش ← تخلیه) از رخدادهای واقعی سرور + لحظه‌های برنامه‌ریزی‌شده. */
export function milestones(r: Reservation, events: ReservationEvent[], now: number): Milestone[] {
  const at = (kind: ReservationEvent["kind"]) => events.find((e) => e.kind === kind)?.at ?? null;
  const status = r.status ?? "confirmed";
  const start = Date.parse(r.start);
  const end = Date.parse(r.end);
  const checkedIn = at("checked_in") ?? (status === "checked_in" || status === "completed" ? r.start : null);
  const checkedOut = at("checked_out") ?? (status === "completed" ? r.end : null);
  const booked = at("confirmed") ?? at("created") ?? r.created_at;

  const list: Milestone[] = [
    {
      key: "booked",
      title: status === "hold" ? "ثبت درخواست — در انتظار تأیید پذیرش" : "ثبت و تأیید قطعی در سامانه",
      detail: status === "hold" ? "سانس تا تأیید پذیرش برای شما نگه داشته شده است" : "رزرو قطعی و گواهی صادر شد",
      at: booked,
      state: status === "hold" ? "current" : "done",
    },
    {
      key: "prepare",
      title: "آماده‌سازی واحد توسط خدام",
      detail: "نظافت و بهداشت پیش از ورود",
      at: null,
      state: checkedIn || now >= start ? "done" : status === "hold" ? "upcoming" : "current",
    },
    {
      key: "checkin",
      title: "پذیرش و تحویل کلید",
      detail: checkedIn ? "پذیرش انجام شد" : "همراه داشتن اصل مدرک هویتی",
      at: checkedIn ?? r.start,
      state: checkedIn ? "done" : now >= start ? "current" : "upcoming",
    },
    {
      key: "checkout",
      title: "تخلیه و نظرسنجی رضایت",
      detail: checkedOut ? "پیوند نظرسنجی پیامک شد" : "پیوند نظرسنجی پس از خروج پیامک می‌شود",
      at: checkedOut ?? r.end,
      state: checkedOut ? "done" : checkedIn && now >= end ? "current" : "upcoming",
    },
  ];

  if (CANCELLED.has(status)) {
    const closedAt = at("cancelled") ?? at("no_show") ?? at("expired") ?? at("moved") ?? null;
    const stopped = list.map((m) => (m.state === "done" ? m : { ...m, state: "stopped" as const }));
    return [
      ...stopped.filter((m) => m.state === "done"),
      { key: "closed", title: r.status_label, detail: closedDetail(status), at: closedAt, state: "stopped" },
    ];
  }
  return list;
}

const CLOSED_DETAIL: Partial<Record<ReservationStatus, string>> = {
  cancelled_by_guest: "به درخواست شما لغو شد و سانس آزاد شد",
  cancelled_by_staff: "از سوی پذیرش لغو شد؛ پیامک توضیح برایتان ارسال شده است",
  no_show: "حضور ثبت نشد",
  expired: "مهلت نگه‌داشت پیش از تأیید پذیرش به پایان رسید",
  superseded: "این رزرو با رزرو تازه‌ای جایگزین شد",
};
const closedDetail = (status: ReservationStatus) => CLOSED_DETAIL[status] ?? "این رزرو دیگر فعال نیست";

/** کد کوتاه ۸ نویسه‌ای ⇒ «7K9M-2B4X» برای خواندن تلفنی/چشمی. */
export const groupShortCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

/** SVG بک‌اند (segno ‎svg_inline‎) بی‌فضای‌نام است؛ برای ‎<img>‎ ‎xmlns‎ لازم است. */
export function qrDataUri(svg: string): string {
  const withNs = /<svg[^>]*\sxmlns=/.test(svg) ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNs)}`;
}
