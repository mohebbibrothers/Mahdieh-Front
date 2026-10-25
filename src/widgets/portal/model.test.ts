import { describe, expect, it } from "vitest";
import type { Reservation, ReservationEvent } from "@/shared/api/schemas";
import { composeNote, composePlate } from "@/widgets/booking/model";
import {
  arrivalCue,
  certificateStamp,
  deviceKind,
  feedbackCell,
  googleCalendarUrl,
  journey,
  normalizeCode,
  normalizeShortCode,
  parseNote,
  parsePlate,
  pickFeatured,
} from "./model";

const base: Reservation = {
  id: "1",
  code: "M-1405-0011",
  status: "confirmed",
  status_label: "تأییدشده",
  is_active: true,
  unit_code: "A1",
  unit_title: "سوئیت رضوان",
  floor_number: 1,
  start: "2026-10-30T20:00:00+03:30",
  end: "2026-11-01T20:00:00+03:30",
  date_jalali: "۱۴۰۵/۰۸/۰۸",
  weekday: "پنجشنبه",
  cells_count: 4,
  duration_label: "۲ شبانه‌روز",
  guests_count: 3,
  can_cancel: true,
  free_cancel_until: "2026-10-29T20:00:00+03:30",
  created_at: "2026-10-25T10:00:00+03:30",
  guest_note: "",
  expected_arrival: null,
  vehicle_plate: "",
  hold_expires_at: null,
  feedback_url: null,
  feedback_rating: null,
  is_late_cancel: false,
  details_editable: true,
};
const r = (over: Partial<Reservation>): Reservation => ({ ...base, ...over });
const ev = (kind: ReservationEvent["kind"], at: string): ReservationEvent => ({
  id: kind,
  kind,
  kind_label: kind,
  at,
});
const NOW = Date.parse("2026-10-26T12:00:00+03:30");

describe("pickFeatured", () => {
  const a = r({ code: "M-1", start: "2026-10-28T08:00:00+03:30" });
  const b = r({ code: "M-2", start: "2026-11-05T08:00:00+03:30" });
  it("کد نشانی (بی‌حساسیت به حروف) برنده است", () => expect(pickFeatured([a, b], "m-2")?.code).toBe("M-2"));
  it("کد ناموجود ⇒ نخستین سفر فعال", () => expect(pickFeatured([a, b], "X")?.code).toBe("M-1"));
  it("فهرست خالی ⇒ null", () => expect(pickFeatured([], null)).toBeNull());
});

describe("normalizeCode", () => {
  it("ارقام فارسی، فاصله و خط تیرهٔ بلند", () => expect(normalizeCode(" m–۱۴۰۵ ۰۰۱۱ ")).toBe("M-14050011"));
  it("کد استاندارد دست‌نخورده", () => expect(normalizeCode("M-1405-0011")).toBe("M-1405-0011"));
});

describe("arrivalCue", () => {
  it("چند روز دیگر با روز هفته", () => expect(arrivalCue(base, NOW)).toMatch(/^۴ روز دیگر · .+ساعت ۲۰:۰۰$/));
  it("امروز", () =>
    expect(arrivalCue(base, Date.parse("2026-10-30T09:00:00+03:30"))).toBe("امروز · تحویل کلید از ساعت ۲۰:۰۰"));
  it("فردا", () =>
    expect(arrivalCue(base, Date.parse("2026-10-29T23:30:00+03:30"))).toBe("فردا · تحویل کلید از ساعت ۲۰:۰۰"));
  it("در حال اقامت", () => expect(arrivalCue(r({ status: "checked_in" }), NOW)).toMatch(/^در حال اقامت/));
});

describe("journey", () => {
  it("تأییدشده بی هماهنگی ⇒ «هماهنگی ورود» مرحلهٔ جاری و یکتا", () => {
    const steps = journey(base, [ev("created", base.created_at)], NOW);
    expect(steps.map((s) => s.state)).toEqual(["done", "done", "current", "upcoming", "upcoming"]);
  });
  it("پلاک ثبت‌شده ⇒ هماهنگی انجام و پذیرش (یک روز مانده) جاری", () => {
    const steps = journey(
      r({ vehicle_plate: "۱۲ ب ۳۴۵ ایران ۳۶", expected_arrival: "21:30:00" }),
      [],
      Date.parse("2026-10-30T10:00:00+03:30"),
    );
    expect(steps[2]).toMatchObject({ state: "done", detail: "پلاک ثبت شد · رسیدن ساعت ۲۱:۳۰" });
    expect(steps[3]?.state).toBe("current");
  });
  it("نگه‌داشت ⇒ تأیید جاری، بقیه پیش‌رو", () => {
    const steps = journey(r({ status: "hold" }), [], NOW);
    expect(steps.map((s) => s.state)).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
  });
  it("لغو دیرهنگام ⇒ مراحل انجام‌شده + بستن با پیام سهمیه", () => {
    const steps = journey(
      r({ status: "cancelled_by_guest", status_label: "لغو زائر", is_late_cancel: true }),
      [ev("cancelled", "2026-10-30T10:00:00+03:30")],
      NOW,
    );
    expect(steps.at(-1)).toMatchObject({ key: "closed", state: "stopped", detail: "لغو دیرهنگام — سهمیه بازنگشت" });
    expect(steps.filter((s) => s.state === "done").map((s) => s.key)).toEqual(["booked", "confirmed"]);
  });
  it("پایان‌یافته با نظر ⇒ همه انجام", () => {
    const steps = journey(r({ status: "completed", feedback_rating: 5 }), [], NOW);
    expect(steps.every((s) => s.state === "done")).toBe(true);
    expect(steps.at(-1)?.detail).toBe("نظر شما ثبت شد");
  });
});

describe("feedbackCell", () => {
  it("امتیاز ثبت‌شده", () => expect(feedbackCell(r({ feedback_rating: 4 }))).toEqual({ kind: "rated", rating: 4 }));
  it("پیوند باز", () => expect(feedbackCell(r({ feedback_url: "/feedback/t/" })).kind).toBe("open"));
  it("لغو به‌موقع ⇒ سهمیه بازگشت", () =>
    expect(feedbackCell(r({ status: "cancelled_by_guest" })).kind).toBe("refunded"));
  it("لغو دیرهنگام", () =>
    expect(feedbackCell(r({ status: "cancelled_by_guest", is_late_cancel: true })).kind).toBe("late"));
  it("لغو پذیرش ⇒ سهمیه بازگشت", () => expect(feedbackCell(r({ status: "cancelled_by_staff" })).kind).toBe("refunded"));
  it("پایان‌یافتهٔ بی‌پیوند (پنجره بسته)", () => expect(feedbackCell(r({ status: "completed" })).kind).toBe("closed"));
  it("پایان زمان بی ثبت تخلیه ⇒ در انتظار گشایش", () =>
    expect(feedbackCell(r({ status: "checked_in" })).kind).toBe("awaiting"));
});

describe("googleCalendarUrl", () => {
  it("زمان UTC و متن فارسی رمزگذاری‌شده", () => {
    const url = new URL(googleCalendarUrl(base, { name: "مهدیه", phone: "051", address: "مشهد" }));
    expect(url.searchParams.get("dates")).toBe("20261030T163000Z/20261101T163000Z");
    expect(url.searchParams.get("text")).toContain("سوئیت رضوان");
    expect(url.searchParams.get("details")).toContain("M-1405-0011");
  });
});

describe("parsePlate / parseNote", () => {
  it("رفت‌وبرگشت با composePlate", () => {
    const parts = { two: "12", letter: "ب", three: "345", region: "36" };
    expect(parsePlate(composePlate(parts))).toEqual(parts);
  });
  it("پلاک آزاد ⇒ null", () => expect(parsePlate("ABC 1234")).toBeNull());
  it("رفت‌وبرگشت با composeNote", () => {
    expect(parseNote(composeNote(["زائر سالمند", "نیاز به ویلچر"], "کالسکه"))).toEqual({
      needs: ["زائر سالمند", "نیاز به ویلچر"],
      text: "کالسکه",
    });
  });
  it("یادداشت آزاد", () => expect(parseNote("سلام")).toEqual({ needs: [], text: "سلام" }));
});

describe("بازرسی آفلاین", () => {
  // همان رشتهٔ ‎build_certificate‎ بک‌اند: «{روز} {نام ماه} {سال} · ساعت HH:MM» با ارقام فارسی
  it("عددی ⇒ رشتهٔ چاپی گواهی", () => expect(certificateStamp("1405/8/7", "8:00")).toBe("۷ آبان ۱۴۰۵ · ساعت ۰۸:۰۰"));
  it("ارقام فارسی و جداکنندهٔ دیگر", () =>
    expect(certificateStamp("۱۴۰۵-۰۸-۱۰", "۲۰۰۰")).toBe("۱۰ آبان ۱۴۰۵ · ساعت ۲۰:۰۰"));
  it("با نام ماه (همان‌طور که روی برگه چاپ شده)", () =>
    expect(certificateStamp(" ۷  آبان ۱۴۰۵ ", "۰۸:۰۰")).toBe("۷ آبان ۱۴۰۵ · ساعت ۰۸:۰۰"));
  it("اردیبهشت با «ي» عربی", () =>
    expect(certificateStamp("2 اردي‌بهشت 1405".replace("‌", ""), "9:30")).toBe("۲ اردیبهشت ۱۴۰۵ · ساعت ۰۹:۳۰"));
  it("نامعتبر ⇒ null", () => {
    expect(certificateStamp("1405/13/01", "08:00")).toBeNull();
    expect(certificateStamp("۷ بهار ۱۴۰۵", "08:00")).toBeNull();
    expect(certificateStamp("1405/08/07", "24:00")).toBeNull();
  });
  it("کد کوتاه", () => expect(normalizeShortCode("7k9m-2b4x")).toBe("7K9M2B4X"));
});

it("deviceKind", () => {
  expect(deviceKind("Chrome · Android")).toBe("smartphone");
  expect(deviceKind("Firefox · Windows")).toBe("monitor");
});
