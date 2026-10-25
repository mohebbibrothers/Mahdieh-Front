import { beforeEach, describe, expect, it } from "vitest";
import type { Reservation } from "@/shared/api/schemas";
import {
  alternativeToSelection,
  arrivalLabel,
  arrivalOptions,
  composeNote,
  composePlate,
  forgetIdempotencyKey,
  groupShortCode,
  idempotencyKeyFor,
  milestones,
  plateFilled,
  plateLetter,
  qrDataUri,
  shortKey,
  stayRange,
} from "./model";

const base: Reservation = {
  id: "r1",
  code: "M-1405-0142",
  status: "confirmed",
  status_label: "قطعی",
  is_active: true,
  unit_code: "A1",
  unit_title: "سوئیت طبقهٔ اول",
  floor_number: 1,
  start: "2026-10-23T08:00:00+03:30",
  end: "2026-10-25T08:00:00+03:30",
  date_jalali: "۱ آبان ۱۴۰۵",
  weekday: "جمعه",
  cells_count: 4,
  duration_label: "۲ شبانه‌روز",
  guests_count: 4,
  can_cancel: true,
  free_cancel_until: "2026-10-22T08:00:00+03:30",
  created_at: "2026-10-20T14:00:00+03:30",
  expected_arrival: null,
  vehicle_plate: "",
  hold_expires_at: null,
  feedback_url: null,
  feedback_rating: null,
  is_late_cancel: false,
  details_editable: true,
};

describe("بازهٔ درخواست روی شبکهٔ نیم‌روز", () => {
  it("روز ۰۸:۰۰ و شب ۲۰:۰۰ به افق تهران؛ مدت = نیم‌روزها × ۱۲ ساعت", () => {
    expect(stayRange({ day: "2026-10-23", period: "day", cells: 4 })).toEqual({
      start: "2026-10-23T08:00:00+03:30",
      end: "2026-10-25T08:00:00+03:30",
    });
    expect(stayRange({ day: "2026-10-23", period: "night", cells: 1 })).toEqual({
      start: "2026-10-23T20:00:00+03:30",
      end: "2026-10-24T08:00:00+03:30",
    });
  });

  it("پیشنهاد جایگزین سرور ⇒ انتخاب یک‌کلیکی (واحد، روز، نیم‌روز، مدت)", () => {
    expect(
      alternativeToSelection({ unit_code: "B2", start: "2026-10-24T20:00:00+03:30", end: "2026-10-26T08:00:00+03:30" }),
    ).toEqual({ unit: "B2", day: "2026-10-24", period: "night", cells: 3 });
    // همان لحظه با ‎Z‎ (اگر روزی سرور UTC بدهد) همان انتخاب را می‌سازد.
    expect(
      alternativeToSelection({ unit_code: "A1", start: "2026-10-24T04:30:00Z", end: "2026-10-24T16:30:00Z" }),
    ).toEqual({ unit: "A1", day: "2026-10-24", period: "day", cells: 1 });
  });
});

describe("کلید هم‌توانی", () => {
  const p = { unit_code: "A1", start: "a", end: "b", guests_count: 4 };
  beforeEach(() => sessionStorage.clear());

  it("همان درخواست ⇒ همان کلید (حتی پس از رفرش)؛ تغییر نفرات ⇒ کلید تازه", () => {
    const k = idempotencyKeyFor(p);
    expect(k).toMatch(/^web-/);
    expect(idempotencyKeyFor({ ...p })).toBe(k);
    expect(idempotencyKeyFor({ ...p, guests_count: 5 })).not.toBe(k);
    expect(shortKey(k)).toMatch(/^IDEMP-[0-9A-F]{5}$/);
  });

  it("پس از موفقیت دور ریخته می‌شود تا رزرو دوبارهٔ همان سانس، بازپخش رزرو قبلی نگیرد", () => {
    const k = idempotencyKeyFor(p);
    forgetIdempotencyKey(p);
    expect(idempotencyKeyFor(p)).not.toBe(k);
  });
});

describe("پلاک، ساعت رسیدن و یادداشت", () => {
  it("پلاک ایرانی با ارقام فارسی و زیر سقف ۲۰ نویسهٔ بک‌اند", () => {
    const plate = { two: "12", letter: "ب", three: "345", region: "36" };
    expect(plateFilled(plate)).toBe(true);
    expect(composePlate(plate)).toBe("۱۲ ب ۳۴۵ ایران ۳۶");
    expect(composePlate(plate).length).toBeLessThanOrEqual(20);
    expect(plateLetter("الف")).toBe("ا");
    expect(plateLetter("x")).toBe("");
  });

  it("گزینه‌های ساعت از آغاز سانس، با عبور از نیمه‌شب", () => {
    const night = arrivalOptions("2026-10-23T20:00:00+03:30");
    expect(night[0]).toMatchObject({ value: "20:00", label: "ساعت ۲۰:۰۰ شب" });
    expect(night.at(-1)).toMatchObject({ value: "00:00", label: "ساعت ۰۰:۰۰ بامداد" });
    expect(arrivalLabel("08:30:00")).toBe("ساعت ۰۸:۳۰ صبح");
    expect(arrivalLabel(null)).toBeNull();
  });

  it("نیازهای ویژه پیش از متن آزاد و هرگز بیش از ۳۰۰ نویسه", () => {
    expect(composeNote(["نیاز به ویلچر"], "  طبقهٔ پایین  ")).toBe("نیازها: نیاز به ویلچر — طبقهٔ پایین");
    expect(composeNote([], "x".repeat(400))).toHaveLength(300);
  });
});

describe("گاه‌شمار رزرو", () => {
  it("رزرو قطعی پیش از ورود: ثبت انجام، آماده‌سازی جاری، پذیرش و تخلیه پیش‌رو", () => {
    const m = milestones(base, [], Date.parse("2026-10-21T10:00:00+03:30"));
    expect(m.map((x) => x.state)).toEqual(["done", "current", "upcoming", "upcoming"]);
    expect(m[2]?.at).toBe(base.start);
  });

  it("نگه‌داشت: ثبت «جاری» تا تأیید پذیرش", () => {
    const m = milestones({ ...base, status: "hold" }, [], Date.parse("2026-10-21T10:00:00+03:30"));
    expect(m[0]).toMatchObject({ state: "current" });
    expect(m[1]?.state).toBe("upcoming");
  });

  it("لغوشده: فقط گام‌های انجام‌شده + گام پایانی «لغو»", () => {
    const events = [{ id: "e", kind: "cancelled" as const, kind_label: "لغو", at: "2026-10-21T09:00:00+03:30" }];
    const m = milestones({ ...base, status: "cancelled_by_guest", status_label: "لغو به درخواست زائر" }, events, 0);
    expect(m.map((x) => x.key)).toEqual(["booked", "closed"]);
    expect(m.at(-1)).toMatchObject({ state: "stopped", at: events[0]?.at });
  });
});

describe("گواهی", () => {
  it("کد کوتاه گروه‌بندی و QR بی‌فضای‌نام برای ‎<img>‎ قابل‌نمایش می‌شود", () => {
    expect(groupShortCode("7K9M2B4X")).toBe("7K9M-2B4X");
    expect(decodeURIComponent(qrDataUri('<svg width="10"></svg>'))).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
