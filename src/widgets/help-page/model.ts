/**
 * مدل صفحهٔ «راهنمای زائر» (P-08) — توابع خالص و آزموده‌شده.
 *
 * جست‌وجو آینهٔ دقیق ‎help_content.search‎ بک‌اند است (یکسان‌سازی ‎normalize_fa‎، منطق «و» میان واژه‌ها،
 * وزن پرسش ۵ · برچسب ۳ · دسته ۲ · پاسخ ۲ · گام ۱، داوری امتیاز مساوی با ترتیب اصلی). نتیجه فوری و بی‌شبکه
 * است و آزمون هم‌خوانی (‎search-parity.json‎ از خروجی واقعی بک‌اند) جدا شدن این دو را می‌گیرد.
 */
import type { Route } from "next";
import { destHref } from "@/shared/config/destinations";
import type { Help, HelpItem, PrayerKey, PrayerTimes } from "@/shared/api/schemas";
import type { IconName } from "@/shared/ui/Icon";

// ─── یکسان‌سازی (آینهٔ apps.core.text.normalize_fa) ───────────────────────────
const ARABIC_TO_PERSIAN: Record<string, string> = {
  ي: "ی",
  ى: "ی",
  ئ: "ی",
  ك: "ک",
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
  ۀ: "ه",
  ة: "ه",
  ؤ: "و",
  ﻻ: "لا",
};
const DROPPED = /[\u064B-\u0652\u0670\u0640\u200b-\u200f\u202a-\u202e\u2060\ufeff]/;
const PERSIAN_DIGIT = /[۰-۹]/;
const ARABIC_DIGIT = /[٠-٩]/;
const SPACE = /\s/;
/** مرز واژه (آینهٔ ‎SEARCH_TOKEN‎): غیرحرف + نشانه‌گذاری فارسی «، ؛ ؟ ٪ ٫ ٬ ٭ ۔». */
const TOKEN_SPLIT = /(?:[^\p{L}\p{N}\p{M}_\u0600-\u06FF]|[\u060C\u061B\u061F\u066A-\u066D\u06D4])+/u;

/** یک نویسهٔ متن ⇒ شکل یکسان‌شده‌اش (رشتهٔ تهی = حذف). */
function normChar(ch: string): string {
  if (DROPPED.test(ch)) return "";
  if (PERSIAN_DIGIT.test(ch)) return String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch));
  if (ARABIC_DIGIT.test(ch)) return String(ch.charCodeAt(0) - 0x660);
  return (ARABIC_TO_PERSIAN[ch] ?? ch).toLowerCase();
}

/**
 * متن یکسان‌شده + نگاشت هر نویسهٔ آن به جایگاه نویسهٔ اصلی — برای برجسته‌سازی واژهٔ یافته‌شده
 * روی متن نمایشی (که هرگز یکسان‌سازی نمی‌شود).
 */
export function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let pendingSpace = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? "";
    if (SPACE.test(ch)) {
      if (norm.length && pendingSpace < 0) pendingSpace = i;
      continue;
    }
    const out = normChar(ch);
    if (!out) continue;
    if (pendingSpace >= 0) {
      norm += " ";
      map.push(pendingSpace);
      pendingSpace = -1;
    }
    for (const c of out) {
      norm += c;
      map.push(i);
    }
  }
  return { norm, map };
}

export const normalizeFa = (text: string): string => normalizeWithMap(text).norm;

/** واژه‌های جست‌وجو (آینهٔ ‎search_tokens‎). */
export function searchTokens(query: string): string[] {
  return normalizeFa(query)
    .split(TOKEN_SPLIT)
    .filter((t) => t.length > 0);
}

// ─── فهرست تخت پرسش‌ها و جست‌وجو ───────────────────────────────────────────
export type FlatItem = HelpItem & { category: string; categoryTitle: string; order: number };

export function flatten(help: Help | undefined): FlatItem[] {
  if (!help) return [];
  let order = 0;
  return help.categories.flatMap((c) =>
    c.items.map((item) => ({ ...item, category: c.slug, categoryTitle: c.title, order: order++ })),
  );
}

const WEIGHTS = { question: 5, tags: 3, category: 2, answer: 2, steps: 1 } as const;
type Field = keyof typeof WEIGHTS;

function count(haystack: string, needle: string): number {
  let n = 0;
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + needle.length)) n++;
  return n;
}

const haystackCache = new WeakMap<FlatItem, Record<Field, string>>();
function haystack(item: FlatItem): Record<Field, string> {
  let h = haystackCache.get(item);
  if (!h) {
    h = {
      question: normalizeFa(item.question),
      tags: normalizeFa(item.tags.join(" ")),
      answer: normalizeFa(item.answer),
      steps: normalizeFa(item.steps.join(" ")),
      category: normalizeFa(item.categoryTitle),
    };
    haystackCache.set(item, h);
  }
  return h;
}

/** پرسش‌های منطبق، به ترتیب امتیاز (همهٔ واژه‌ها باید پیدا شوند). پرسش تهی ⇒ همه، به ترتیب اصلی. */
export function search(items: FlatItem[], query: string): FlatItem[] {
  const tokens = searchTokens(query);
  if (!tokens.length) return items;
  const scored: Array<{ item: FlatItem; score: number }> = [];
  for (const item of items) {
    const h = haystack(item);
    const fields = Object.keys(WEIGHTS) as Field[];
    if (!tokens.every((t) => fields.some((f) => h[f].includes(t)))) continue;
    const score = fields.reduce((s, f) => s + WEIGHTS[f] * tokens.reduce((n, t) => n + count(h[f], t), 0), 0);
    scored.push({ item, score: score * 100 - item.order });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}

/** بخش‌های متن نمایشی با برجستگی واژه‌های جست‌وجو (روی نگاشت یکسان‌سازی؛ همپوشانی‌ها ادغام). */
export function highlight(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const tokens = searchTokens(query);
  if (!tokens.length) return [{ text, hit: false }];
  const { norm, map } = normalizeWithMap(text);
  const ranges: Array<[number, number]> = [];
  for (const t of tokens) {
    for (let at = norm.indexOf(t); at >= 0; at = norm.indexOf(t, at + t.length)) {
      const start = map[at] ?? 0;
      const end = (map[at + t.length - 1] ?? start) + 1;
      ranges.push([start, end]);
    }
  }
  if (!ranges.length) return [{ text, hit: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged.at(-1);
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) parts.push({ text: text.slice(cursor, s), hit: false });
    parts.push({ text: text.slice(s, e), hit: true });
    cursor = e;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}

// ─── حالت صفحه در نشانی (همان پارامترهای SSR قدیمی: ‎?q=&cat=‎) ─────────────────
export type HelpState = { q: string; cat: string; open: readonly string[] };
export const ALL = "all";
export const INITIAL_STATE: HelpState = { q: "", cat: ALL, open: [] };
export const ITEM_HASH = "item-";

export function readState(search: string, hash = ""): HelpState {
  const p = new URLSearchParams(search);
  const q = (p.get("q") ?? "").slice(0, 80);
  const cat = p.get("cat") || ALL;
  const slug = hash.startsWith(`#${ITEM_HASH}`) ? decodeURIComponent(hash.slice(ITEM_HASH.length + 1)) : "";
  return { q, cat, open: slug ? [slug] : [] };
}

export function writeState(s: HelpState, href: string): string {
  const url = new URL(href);
  if (s.q.trim()) url.searchParams.set("q", s.q.trim());
  else url.searchParams.delete("q");
  if (s.cat !== ALL) url.searchParams.set("cat", s.cat);
  else url.searchParams.delete("cat");
  return url.toString();
}

// ─── اقدام‌های معنایی بک‌اند ⇒ مسیرهای فرانت ───────────────────────────────────
export type Target = { kind: "link"; href: Route } | { kind: "account" };

/** «هدف معنایی» هر دکمهٔ راهنما (‎calendar‎، ‎my_reservations‎…) ⇒ صفحهٔ واقعی فرانت. */
export function resolveTarget(target: string): Target | null {
  const portal = destHref("portal");
  const withHash = (href: Route | null, hash: string): Target | null =>
    href ? { kind: "link", href: `${href}#${hash}` as Route } : null;
  switch (target) {
    case "login":
    case "profile":
      return { kind: "account" };
    case "calendar":
      return { kind: "link", href: destHref("calendar") };
    case "units":
      return { kind: "link", href: destHref("units") };
    case "my_reservations":
      return withHash(portal, "stay");
    case "my_waitlist":
      return withHash(portal, "waitlist");
    default:
      return null;
  }
}

/** آیکون دسته‌ها و گام‌ها (بک‌اند ایموجی می‌دهد؛ رابط با مجموعه‌آیکون خودش یکدست می‌ماند). */
export const CATEGORY_ICON: Record<string, IconName> = {
  before: "luggage",
  booking: "calendar",
  change: "refresh",
  waitlist: "hourglass",
  stay: "key",
  trouble: "wrench",
};
export const STEP_ICON: Record<string, IconName> = {
  login: "smartphone",
  calendar: "calendar",
  units: "ticket",
  my_reservations: "key",
};

/** تراشه‌های «موضوعات پرتکرار» — برچسب‌ها با عددهای زندهٔ سیاست. */
export type QuickTopic = { label: string; query?: string; anchor?: string };
export function quickTopics(values: Record<string, string> | undefined): QuickTopic[] {
  const v = values ?? {};
  return [
    { label: v.quota_nights ? `سهمیهٔ ${v.quota_nights} شبانه‌روز` : "سهمیهٔ اقامت", query: "سهمیه" },
    { label: v.cancel_hours ? `لغو رایگان تا ${v.cancel_hours} ساعت` : "لغو رایگان", query: "لغو" },
    { label: "پذیرش و تحویل کلید", query: "کلید" },
    { label: "نوبت انتظار", query: "نوبت انتظار" },
    { label: "گواهی و کارت QR", query: "گواهی" },
    { label: "اوقات شرعی و نقاره", anchor: "prayer" },
  ];
}

// ─── اوقات شرعی ─────────────────────────────────────────────────────────────
export const PRAYER_ICON: Record<PrayerKey, IconName> = {
  fajr: "moon",
  sunrise: "sunrise",
  dhuhr: "sun",
  sunset: "sunset",
  maghrib: "prayer",
  midnight: "star",
};

/** «اذان»ها نوبت نمازند؛ طلوع/غروب/نیمه‌شب نشانهٔ پایان فرصت‌اند — برای زیرنویس کارت. */
export const PRAYER_HINT: Record<PrayerKey, string> = {
  fajr: "آغاز وقت نماز صبح",
  sunrise: "پایان وقت نماز صبح · نقارهٔ صبح",
  dhuhr: "آغاز وقت نماز ظهر و عصر",
  sunset: "پایان وقت نماز عصر · نقارهٔ شامگاه",
  maghrib: "آغاز وقت نماز مغرب و عشا",
  midnight: "پایان وقت نماز مغرب و عشا",
};

type PrayerDay = PrayerTimes["days"][number];

/** روز جاری تهران در فهرست (کش بک‌اند ممکن است از دیروز آغاز شود) — وگرنه نخستین روز. */
export function pickToday(days: PrayerDay[], todayIso: string): number {
  const at = days.findIndex((d) => d.date === todayIso);
  return at >= 0 ? at : 0;
}

/** نخستین وقت پیش‌رو از ‎now‎ (در همین روز یا نخستین وقت روز بعد) ⇒ ‎[dayIndex, slotIndex]‎. */
export function nextSlot(days: PrayerDay[], now: number): [number, number] | null {
  for (let d = 0; d < days.length; d++) {
    const slots = days[d]?.slots ?? [];
    for (let s = 0; s < slots.length; s++) {
      const slot = slots[s];
      if (slot && Date.parse(slot.at) > now) return [d, s];
    }
  }
  return null;
}

/** «۱ ساعت و ۲۰ دقیقه» / «۸ دقیقه» / «کمتر از یک دقیقه» (ارقام فارسی را لایهٔ نمایش می‌زند). */
export function untilLabel(ms: number): string {
  const minutes = Math.max(0, Math.ceil(ms / 60_000));
  if (minutes < 1) return "کمتر از یک دقیقه";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} دقیقه`;
  return m ? `${h} ساعت و ${m} دقیقه` : `${h} ساعت`;
}

/**
 * برش کوتاه متن پیرامون نخستین واژهٔ یافته‌شده (برای پرسش بسته در حالت جست‌وجو) — بر مرز فاصله بریده
 * می‌شود تا واژه‌ای نیمه نماند. واژه‌ای در متن نباشد ⇒ رشتهٔ تهی (یعنی تطابق از پرسش/برچسب بوده است).
 */
export function snippetOf(text: string, query: string, radius = 70): string {
  const tokens = searchTokens(query);
  if (!tokens.length) return "";
  const { norm, map } = normalizeWithMap(text);
  const hits = tokens.map((t) => norm.indexOf(t)).filter((i) => i >= 0);
  if (!hits.length) return "";
  const at = map[Math.min(...hits)] ?? 0;
  let start = Math.max(0, at - radius);
  let end = Math.min(text.length, at + radius * 1.6);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  if (end < text.length) end = text.lastIndexOf(" ", end) > at ? text.lastIndexOf(" ", end) : end;
  return `${start > 0 ? "… " : ""}${text.slice(start, end).trim()}${end < text.length ? " …" : ""}`;
}

// ─── تابلوی قواعد زنده ──────────────────────────────────────────────────────
type Rule = Help["rules"][number];
const RULE_GROUPS: ReadonlyArray<{ title: string; icon: IconName; keys: readonly string[] }> = [
  {
    title: "سانس‌ها و ساعت‌ها",
    icon: "clock",
    keys: ["min_stay", "max_stay", "day_start", "night_start", "checkin", "checkout"],
  },
  { title: "رزرو و لغو", icon: "calendar-check", keys: ["horizon", "lead", "cancel", "active"] },
  { title: "سهمیه و نوبت انتظار", icon: "hourglass", keys: ["quota", "annual", "offer", "buffer"] },
];

/** ردیف‌های ‎rules‎ بک‌اند در سه گروه معنایی؛ کلید ناشناختهٔ آینده در گروه آخر (هیچ قاعده‌ای گم نمی‌شود). */
export function groupRules(rules: Rule[]): Array<{ title: string; icon: IconName; rules: Rule[] }> {
  const known = new Set(RULE_GROUPS.flatMap((g) => g.keys));
  const groups = RULE_GROUPS.map((g) => ({
    title: g.title,
    icon: g.icon,
    rules: g.keys.flatMap((k) => rules.filter((r) => r.key === k)),
  }));
  const extra = rules.filter((r) => !known.has(r.key));
  groups.at(-1)?.rules.push(...extra);
  return groups.filter((g) => g.rules.length);
}
