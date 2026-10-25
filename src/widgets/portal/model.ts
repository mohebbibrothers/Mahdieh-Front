import type { Reservation, ReservationEvent, ReservationStatus } from "@/shared/api/schemas";
import { faDigits, formatClock, formatDayLabel, latinDigits, tehranToday } from "@/shared/lib/fa";
import { CANCELLED } from "@/widgets/booking/model";

/**
 * منطق خالص پرتال زائر (P-07) — بی‌وابستگی به React تا با آزمون واحد قفل شود.
 * ایران از ۱۴۰۱ ساعت تابستانی ندارد ⇒ افق تهران همیشه ‎+03:30‎ است (همان فرض ‎fa.ts‎).
 */
const DAY = 86_400_000;

/* ── انتخاب اقامت برجسته ─────────────────────────────────────────────────── */

/** کارت «اقامت فعال»: کد نشانی (اگر در فهرست باشد) وگرنه نزدیک‌ترین سفر پیش‌رو (فهرست از سرور مرتب است). */
export function pickFeatured(upcoming: readonly Reservation[], code: string | null): Reservation | null {
  if (code) {
    const wanted = code.trim().toUpperCase();
    const hit = upcoming.find((r) => r.code.toUpperCase() === wanted);
    if (hit) return hit;
  }
  return upcoming.find((r) => r.is_active) ?? upcoming[0] ?? null;
}

/** کد پیگیری نرمال: ارقام لاتین، حروف بزرگ، بی‌فاصله — «m-۱۴۰۵-۰۰۱۱» ⇒ «M-1405-0011». */
export function normalizeCode(raw: string): string {
  return latinDigits(raw)
    .replace(/[\s\u200c]+/g, "")
    .replace(/[–—_]/g, "-")
    .toUpperCase();
}

/* ── زمان نسبی ورود ───────────────────────────────────────────────────── */

/** «امروز · تحویل کلید از ساعت ۲۰:۰۰» / «فردا …» / «۳ روز دیگر» / «در حال اقامت» / «پایان اقامت …». */
export function arrivalCue(r: Pick<Reservation, "start" | "end" | "status">, now: number): string {
  const start = Date.parse(r.start);
  const end = Date.parse(r.end);
  const clock = formatClock(r.start);
  if (r.status === "checked_in" || (now >= start && now < end))
    return `در حال اقامت · تخلیه ساعت ${formatClock(r.end)}`;
  if (now >= end) return "اقامت به پایان رسیده است";
  const today = tehranToday(new Date(now));
  const startDay = tehranToday(new Date(start));
  const days = Math.round((Date.parse(`${startDay}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
  if (days <= 0) return `امروز · تحویل کلید از ساعت ${clock}`;
  if (days === 1) return `فردا · تحویل کلید از ساعت ${clock}`;
  return `${faDigits(days)} روز دیگر · ${formatDayLabel(startDay)}، ساعت ${clock}`;
}

/* ── سفر پنج‌مرحله‌ای (طراح: ثبت ← تأیید ← هماهنگی ورود ← پذیرش ← تخلیه) ─────────── */

export type JourneyStep = {
  key: "booked" | "confirmed" | "arrival" | "checkin" | "checkout" | "closed";
  title: string;
  detail: string;
  at: string | null;
  state: "done" | "current" | "upcoming" | "stopped";
};

export function journey(r: Reservation, events: readonly ReservationEvent[], now: number): JourneyStep[] {
  const at = (kind: ReservationEvent["kind"]) => events.findLast((e) => e.kind === kind)?.at ?? null;
  const status: ReservationStatus = r.status ?? "confirmed";
  const start = Date.parse(r.start);
  const created = at("created") ?? r.created_at;
  const confirmed = at("confirmed") ?? (status === "hold" ? null : created);
  const checkedIn = at("checked_in") ?? (status === "checked_in" || status === "completed" ? r.start : null);
  const checkedOut = at("checked_out") ?? (status === "completed" ? r.end : null);
  const coordinated = Boolean(r.expected_arrival || r.vehicle_plate || at("details"));
  const arrivalDetail = [
    r.vehicle_plate ? "پلاک ثبت شد" : null,
    r.expected_arrival ? `رسیدن ساعت ${faDigits(r.expected_arrival.slice(0, 5))}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const steps: JourneyStep[] = [
    {
      key: "booked",
      title: "ثبت اولیهٔ رزرو",
      detail: `انتخاب واحد ${r.unit_code}`,
      at: created,
      state: "done",
    },
    {
      key: "confirmed",
      title: status === "hold" ? "در انتظار تأیید پذیرش" : "تأیید و پیامک",
      detail: status === "hold" ? "سانس تا تأیید برای شما نگه داشته شده" : `صدور کد ${r.code}`,
      at: confirmed,
      state: status === "hold" ? "current" : "done",
    },
    {
      key: "arrival",
      title: "هماهنگی ورود و خودرو",
      detail: coordinated ? arrivalDetail || "هماهنگ شد" : "ساعت رسیدن و پلاک (اختیاری)",
      at: at("details"),
      state: coordinated || checkedIn ? "done" : status === "hold" ? "upcoming" : "current",
    },
    {
      key: "checkin",
      title: "پذیرش حضوری و کلید",
      detail: checkedIn ? "پذیرش انجام شد" : `ساعت ${formatClock(r.start)} در پذیرش`,
      at: checkedIn ?? r.start,
      state: checkedIn ? "done" : coordinated && now >= start - DAY ? "current" : "upcoming",
    },
    {
      key: "checkout",
      title: "تخلیه و ارزیابی",
      detail: checkedOut ? (r.feedback_rating ? "نظر شما ثبت شد" : "منتظر نظر شما") : `ساعت ${formatClock(r.end)}`,
      at: checkedOut ?? r.end,
      state: checkedOut ? "done" : checkedIn ? "current" : "upcoming",
    },
  ];
  // «جاری» فقط یکی: نخستین مرحلهٔ ناتمام.
  let seenCurrent = false;
  const single = steps.map((s) => {
    if (s.state !== "current") return s;
    if (seenCurrent) return { ...s, state: "upcoming" as const };
    seenCurrent = true;
    return s;
  });

  if (CANCELLED.has(status)) {
    const closedAt = at("cancelled") ?? at("no_show") ?? at("expired") ?? at("moved");
    return [
      ...single.filter((s) => s.state === "done"),
      { key: "closed", title: r.status_label, detail: closedNote(r), at: closedAt, state: "stopped" },
    ];
  }
  return single;
}

const CLOSED_NOTE: Record<ReservationStatus, string> = {
  hold: "این رزرو دیگر فعال نیست",
  confirmed: "این رزرو دیگر فعال نیست",
  checked_in: "این رزرو دیگر فعال نیست",
  completed: "اقامت به پایان رسید",
  cancelled_by_guest: "لغو به‌موقع — سهمیه بازگشت",
  cancelled_by_staff: "لغو از سوی پذیرش — سهمیه بازگشت",
  no_show: "حضور ثبت نشد",
  expired: "مهلت نگه‌داشت پایان یافت",
  superseded: "با رزرو تازه جایگزین شد",
};

function closedNote(r: Pick<Reservation, "status" | "is_late_cancel">): string {
  if (r.status === "cancelled_by_guest" && r.is_late_cancel) return "لغو دیرهنگام — سهمیه بازنگشت";
  return r.status ? CLOSED_NOTE[r.status] : "این رزرو دیگر فعال نیست";
}

/* ── ستون «ارزیابی» سابقهٔ اقامت ─────────────────────────────────────────── */

export type FeedbackCell =
  | { kind: "rated"; rating: number }
  | { kind: "open"; url: string }
  | { kind: "refunded" }
  | { kind: "late" }
  | { kind: "noshow" }
  | { kind: "closed" }
  | { kind: "none" };

/** ستون «ارزیابی» بر پایهٔ وضعیت (وقتی نه امتیازی هست نه پیوند نظرسنجی). */
const AFTER_STAY: Record<ReservationStatus, "refunded" | "noshow" | "closed" | "none"> = {
  hold: "none",
  confirmed: "none",
  checked_in: "none",
  completed: "closed",
  cancelled_by_guest: "refunded",
  cancelled_by_staff: "refunded",
  no_show: "noshow",
  expired: "none",
  superseded: "none",
};

export function feedbackCell(
  r: Pick<Reservation, "status" | "feedback_rating" | "feedback_url" | "is_late_cancel">,
): FeedbackCell {
  if (r.feedback_rating) return { kind: "rated", rating: r.feedback_rating };
  if (r.feedback_url) return { kind: "open", url: r.feedback_url };
  if (r.status === "cancelled_by_guest") return r.is_late_cancel ? { kind: "late" } : { kind: "refunded" };
  const kind = r.status ? AFTER_STAY[r.status] : "none";
  return { kind };
}

/** لحن نشان وضعیت (رنگ) — یک نگاشت برای جدول، کارت و نشان کارت فعال. */
export const STATUS_TONE: Record<ReservationStatus, "ok" | "live" | "hold" | "muted" | "danger"> = {
  hold: "hold",
  confirmed: "ok",
  checked_in: "live",
  completed: "muted",
  cancelled_by_guest: "danger",
  cancelled_by_staff: "danger",
  no_show: "danger",
  expired: "muted",
  superseded: "muted",
};

/* ── تقویم گوگل ───────────────────────────────────────────────────────── */

const gcalStamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** پیوند «افزودن به تقویم گوگل» (قالب ‎TEMPLATE‎ رسمی؛ زمان‌ها UTC). */
export function googleCalendarUrl(
  r: Pick<Reservation, "code" | "unit_title" | "unit_code" | "start" | "end" | "guests_count">,
  site: { name: string; phone: string; address: string },
): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `اقامت در ${site.name} — ${r.unit_title} (${r.unit_code})`,
    dates: `${gcalStamp(r.start)}/${gcalStamp(r.end)}`,
    details: [
      `کد پیگیری: ${r.code}`,
      `نفرات: ${faDigits(r.guests_count)} نفر`,
      site.phone ? `تلفن پذیرش: ${site.phone}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: site.address,
    ctz: "Asia/Tehran",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ── پلاک و یادداشت (ویرایش پس از ثبت) — منطق در ‎booking/model‎ (مشترک با ‎PlateInput‎) ── */
export { parseNote, parsePlate } from "@/widgets/booking/model";

/* ── بازرسی آفلاین گواهی ───────────────────────────────────────────────── */

/** ماه‌های شمسی — هم‌ترتیب ‎PERSIAN_MONTHS‎ بک‌اند (‎apps/core/jalali.py‎). */
export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/**
 * همان رشتهٔ چاپی گواهی (‎build_certificate‎): «۷ آبان ۱۴۰۵ · ساعت ۰۸:۰۰».
 * تاریخ را عددی («۱۴۰۵/۸/۷»، هر جداکننده و هر رقم) یا با نام ماه («۷ آبان ۱۴۰۵») می‌پذیرد.
 * سرور هم پیش از بازمحاسبه همین یکسان‌سازی را انجام می‌دهد (دفاع دولایه).
 */
export function certificateStamp(date: string, time: string): string | null {
  const dt = latinDigits(date.trim()).replace(/\s+/g, " ").replace(/[يى]/g, "ی");
  const numeric = /^(\d{4})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{1,2})$/.exec(dt);
  const named = /^(\d{1,2}) (\S+) (\d{4})$/.exec(dt);
  const t = /^(\d{1,2})\s*[:٫.]?\s*(\d{2})$/.exec(latinDigits(time.trim()));
  if (!t) return null;
  let y: number, mo: number, da: number;
  if (numeric) {
    [y, mo, da] = [Number(numeric[1]), Number(numeric[2]), Number(numeric[3])];
  } else if (named) {
    [da, mo, y] = [
      Number(named[1]),
      JALALI_MONTHS.indexOf(named[2] as (typeof JALALI_MONTHS)[number]) + 1,
      Number(named[3]),
    ];
  } else {
    return null;
  }
  const h = Number(t[1]);
  const mi = Number(t[2]);
  if (mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59) return null;
  return faDigits(
    `${da} ${JALALI_MONTHS[mo - 1]} ${y} · ساعت ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
  );
}

/** الفبای بی‌ابهام کد کوتاه سرور (بی ‎0/O/1/I‎) — ورودی بازرس پیش از ارسال پاک‌سازی می‌شود. */
export function normalizeShortCode(raw: string): string {
  return latinDigits(raw)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

/* ── نشست‌ها ─────────────────────────────────────────────────────────── */

/** «Chrome · Android» ⇒ آیکون دستگاه. */
export function deviceKind(device: string): "smartphone" | "monitor" {
  return /android|iphone|ipad|ios|mobile/i.test(device) ? "smartphone" : "monitor";
}
