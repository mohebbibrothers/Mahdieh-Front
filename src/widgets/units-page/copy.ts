import type { Route } from "next";
import type { Policies } from "@/shared/api/policies";
import type { FreeWindow } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { durationLabel, faDigits, formatClock, formatDayLabel, formatMoment, guestsLabel } from "@/shared/lib/fa";
import type { Availability, Trip } from "./model";

/** لحن نمایش وضعیت (رنگ نشانه + نماد) — هرگز تنها با رنگ: عنوان همیشه متن کامل است. */
export type Tone = "free" | "busy" | "warn" | "muted";

/** کنش پیشنهادی هر وضعیت: انتخاب نزدیک‌ترین شروع، تنظیم سفر، تقویم کامل، یا ادامهٔ رزرو. */
export type Action =
  { kind: "pick"; window: FreeWindow } | { kind: "trip" } | { kind: "calendar" } | { kind: "book" } | { kind: "none" };

export type AvailCopy = { tone: Tone; title: string; sub: string; action: Action };

const periodWord = (p: "day" | "night") => (p === "day" ? "روز" : "شب");

/** «دوشنبه، ۲۷ مهر · روز ۰۸:۰۰» — زمان آغاز یک بازهٔ آزاد. */
export const windowLabel = (w: FreeWindow) =>
  `${formatDayLabel(w.day)} · ${periodWord(w.period)} ${formatClock(w.start)}`;

export function availCopy(
  a: Availability,
  trip: Trip,
  policies: Pick<Policies, "minLeadHours" | "horizonDays">,
): AvailCopy {
  const stay = durationLabel(trip.cells);
  switch (a.kind) {
    case "loading":
      return {
        tone: "muted",
        title: "در حال بررسی زمان‌ها…",
        sub: "وضعیت آزادی از تقویم زنده خوانده می‌شود.",
        action: { kind: "none" },
      };
    case "unknown":
      return a.offline
        ? {
            tone: "muted",
            title: "اتصال قطع است",
            sub: "پس از وصل‌شدن، زمان‌ها دوباره بررسی می‌شوند.",
            action: { kind: "none" },
          }
        : {
            tone: "muted",
            title: "زمان‌ها فعلاً دریافت نشد",
            sub: "می‌توانید در تقویم کامل ببینید.",
            action: { kind: "calendar" },
          };
    case "capacity":
      return {
        tone: "warn",
        title: `ظرفیت این واحد ${guestsLabel(a.capacity)} است`,
        sub: `برای ${guestsLabel(trip.guests)} جا ندارد؛ واحد بزرگ‌تر یا تعداد کمتر را ببینید.`,
        action: { kind: "trip" },
      };
    case "next":
      return {
        tone: "free",
        title: `شروع آزاد برای ${stay}`,
        sub: windowLabel(a.window),
        action: { kind: "pick", window: a.window },
      };
    case "none":
      return {
        tone: "busy",
        title: `بازهٔ پیوستهٔ ${stay} در افق رزرو نیست`,
        sub: "مدت کوتاه‌تر را امتحان کنید یا در فهرست انتظار بمانید.",
        action: { kind: "trip" },
      };
    case "policy":
      return a.reason === "lead"
        ? {
            tone: "warn",
            title: "مهلت ثبت این زمان گذشته است",
            sub: `ثبت رزرو دست‌کم ${faDigits(policies.minLeadHours)} ساعت پیش از ورود ممکن است.`,
            action: { kind: "trip" },
          }
        : {
            tone: "warn",
            title: "بیرون از افق رزرو",
            sub: `رزرو فقط تا ${faDigits(policies.horizonDays)} روز آینده باز است.`,
            action: { kind: "trip" },
          };
    case "free":
      return {
        tone: "free",
        title: `آزاد برای ${stay} شما`,
        sub: `ورود ${formatMoment(a.start)}`,
        action: { kind: "book" },
      };
    case "busy":
      return {
        tone: "busy",
        title: `${faDigits(a.blocking)} نیم‌روز از بازهٔ شما پر است`,
        sub: a.nearest ? `نزدیک‌ترین شروع: ${windowLabel(a.nearest)}` : "زمان دیگری را در تقویم ببینید.",
        action: a.nearest ? { kind: "pick", window: a.nearest } : { kind: "calendar" },
      };
  }
}

/** تقویم P-04 با همان واحد، نفرات و مدت؛ با تاریخ ⇒ همان بازه انتخاب‌شده و نیم‌روزهای پر نشان داده می‌شوند. */
export function calendarLink(code: string | null, trip: Trip): Route {
  const q: Record<string, string> = { guests: String(trip.guests), stay: String(trip.cells) };
  if (code) q.unit = code;
  if (trip.day) {
    q.from = trip.day;
    if (code) Object.assign(q, { pick: code, day: trip.day, period: trip.period, cells: String(trip.cells) });
  }
  return destHref("calendar", q);
}

/** خلاصهٔ یک‌خطی سفر برای نوار سفر و پنجره‌ها. */
export function tripSummary(trip: Trip): string {
  const head = `${guestsLabel(trip.guests)} · ${durationLabel(trip.cells)}`;
  return trip.day ? `${head} · از ${formatDayLabel(trip.day)}، ${periodWord(trip.period)}` : head;
}
