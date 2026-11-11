import { describe, expect, it } from "vitest";
import type { Desk } from "@/shared/api/desk";
import {
  checkInNote,
  exportRange,
  freshSeconds,
  latticeRange,
  liveProgress,
  phoneLooksValid,
  readLattice,
  recoveryReady,
  releasePresets,
  safeNext,
  selectionOf,
  tehranClock,
  tehranDay,
  tehranIso,
  tehranLabel,
} from "./model";

// ۲۸ مهر ۱۴۰۵، ۱۳:۵۰ به افق تهران (همان «اکنونِ» آزمون‌های e2e).
const NOW = Date.parse("2026-10-20T13:50:00+03:30");

describe("زمان تهران", () => {
  it("لحظه ⇒ ISO، روز و ساعت دیواری تهران", () => {
    expect(tehranIso(NOW)).toBe("2026-10-20T13:50:00+03:30");
    expect(tehranDay(Date.parse("2026-10-20T22:00:00Z"))).toBe("2026-10-21");
    expect(tehranClock(NOW)).toBe("13:50");
    expect(tehranLabel(NOW)).toContain("۱۳:۵۰");
  });

  it("پنجرهٔ تأیید تازه: ثانیه‌های باقی‌مانده و صفر برای کهنه/خالی", () => {
    expect(freshSeconds(null, NOW)).toBe(0);
    expect(freshSeconds(new Date(NOW + 90_500).toISOString(), NOW)).toBe(90);
    expect(freshSeconds(new Date(NOW - 1000).toISOString(), NOW)).toBe(0);
  });
});

describe("شبکهٔ نیم‌روز (آینهٔ count_cells سرور)", () => {
  it("روز + نوبت + مدت ⇒ بازهٔ ISO", () => {
    expect(latticeRange({ day: "2026-10-21", period: "day", cells: 1 })).toEqual({
      start: "2026-10-21T08:00:00+03:30",
      end: "2026-10-21T20:00:00+03:30",
    });
    expect(latticeRange({ day: "2026-10-21", period: "night", cells: 3 })).toEqual({
      start: "2026-10-21T20:00:00+03:30",
      end: "2026-10-23T08:00:00+03:30",
    });
  });

  it("تنظیم شبکه از پیکربندی سرور با پیش‌فرض امن", () => {
    expect(readLattice(undefined)).toEqual({ cellHours: 12, gridStartHour: 8 });
    const six = readLattice({ cell_hours: 6, grid_start_hour: 6 });
    expect(latticeRange({ day: "2026-10-21", period: "night", cells: 2 }, six)).toEqual({
      start: "2026-10-21T12:00:00+03:30",
      end: "2026-10-22T00:00:00+03:30",
    });
  });

  it("بازهٔ رزرو ⇒ انتخاب، رفت‌وبرگشت بی‌اتلاف و سقف یک هفته", () => {
    const sel = { day: "2026-10-22", period: "night", cells: 4 } as const;
    expect(selectionOf(latticeRange(sel))).toEqual(sel);
    const long = selectionOf({ start: "2026-10-01T08:00:00+03:30", end: "2026-10-20T08:00:00+03:30" });
    expect(long.cells).toBe(14);
  });
});

describe("پذیرش و فرم‌ها", () => {
  it("شمارهٔ همراه ایرانی و بین‌المللی (ارقام فارسی و فاصله پذیرفته)", () => {
    expect(phoneLooksValid("۰۹۱۲ ۴۵۸ ۷۳۴۴")).toBe(true);
    expect(phoneLooksValid("+989124587344")).toBe(true);
    expect(phoneLooksValid("+964 770 123 4567")).toBe(true);
    expect(phoneLooksValid("00964-7701234567")).toBe(true);
    expect(phoneLooksValid("0912458734")).toBe(false);
    expect(phoneLooksValid("0812-4587344")).toBe(false);
    expect(phoneLooksValid("abc")).toBe(false);
  });

  it("یادداشت حسابرسی پذیرش: شمار چک‌لیست + متن آزاد، با سقف ۳۰۰ نویسه", () => {
    expect(checkInNote(new Set(["identity", "key"]), "  ")).toBe("چک‌لیست پذیرش: ۲ از ۳ تأیید شد");
    expect(checkInNote(new Set(["identity", "rules", "key"]), "همراه سالمند")).toBe(
      "چک‌لیست پذیرش: ۳ از ۳ تأیید شد · همراه سالمند",
    );
    expect(checkInNote(new Set(), "ا".repeat(400))).toHaveLength(300);
  });

  it("پیشرفت نظافت: درصد، دقیقهٔ باقی‌مانده و دیرکرد", () => {
    const task = { started_at: "2026-10-20T13:30:00+03:30", due_at: "2026-10-20T14:10:00+03:30" };
    expect(liveProgress(task, NOW)).toEqual({ percent: 50, remaining: 20, overdue: false });
    expect(liveProgress(task, NOW + 30 * 60_000)).toMatchObject({ percent: 100, overdue: true });
  });

  it("پیشنهادهای زمان رفع مسدودی: فقط آینده (≥۱۵ دقیقه) و مرتب", () => {
    const presets = releasePresets(NOW);
    expect(presets.map((p) => p.id)).toEqual(["afternoon", "tonight", "morning", "evening", "two-days"]);
    expect(presets[0]?.end).toBe("2026-10-20T18:00:00+03:30");
    const late = releasePresets(Date.parse("2026-10-20T22:50:00+03:30"));
    expect(late.map((p) => p.id)).toEqual(["morning", "evening", "two-days"]);
  });
});

describe("خروجی اکسل", () => {
  const desk = {
    day: "2026-10-20",
    shift: { report_from: "2026-10-20", report_to: "2026-10-21" },
  } as unknown as Desk;

  it("شیفت، امروز، هفتهٔ اخیر و بازهٔ دلخواه", () => {
    const custom = { from: "2026-09-01", to: "2026-09-30" };
    expect(exportRange("shift", desk, custom)).toEqual({ from: "2026-10-20", to: "2026-10-21" });
    expect(exportRange("today", desk, custom)).toEqual({ from: "2026-10-20", to: "2026-10-20" });
    expect(exportRange("week", desk, custom)).toEqual({ from: "2026-10-14", to: "2026-10-20" });
    expect(exportRange("custom", desk, custom)).toBe(custom);
  });
});

describe("عامل دوم", () => {
  it("کد بازیابی فقط با ۱۰ نویسهٔ واقعی آماده است", () => {
    expect(recoveryReady("ABCDE-FGHJK")).toBe(true);
    expect(recoveryReady("abcde fghjk")).toBe(true);
    expect(recoveryReady("ABCDE-FGH")).toBe(false);
  });

  it("بازگشت پس از تأیید فقط به مسیر نسبی همین مبدأ", () => {
    expect(safeNext("/portal/?tab=bookings")).toBe("/portal/?tab=bookings");
    expect(safeNext(null)).toBeNull();
    expect(safeNext("https://evil.example/")).toBeNull();
    expect(safeNext("//evil.example/")).toBeNull();
    expect(safeNext("/\\evil.example/")).toBeNull();
    expect(safeNext("/reception/")).toBeNull();
  });
});
