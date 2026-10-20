import { describe, expect, it } from "vitest";
import { addDays, durationLabel, faDigits, formatClock, formatDayLabel, latinDigits, tehranToday } from "./fa";

describe("قالب‌بندی فارسی", () => {
  it("ارقام فارسی و برگشت", () => {
    expect(faDigits("M-1405-0012")).toBe("M-۱۴۰۵-۰۰۱۲");
    expect(latinDigits("۰۹۱۲٣")).toBe("09123");
  });
  it("تاریخ خورشیدی به افق تهران، مستقل از منطقهٔ زمانی دستگاه", () => {
    expect(formatDayLabel("2026-10-20")).toBe("سه‌شنبه، ۲۸ مهر");
    expect(formatClock("2026-10-20T20:00:00+03:30")).toBe("۲۰:۰۰");
  });
  it("امروزِ تهران پس از نیمه‌شب تهران عوض می‌شود، نه نیمه‌شب UTC", () => {
    expect(tehranToday(new Date("2026-10-20T20:29:00Z"))).toBe("2026-10-20");
    expect(tehranToday(new Date("2026-10-20T20:31:00Z"))).toBe("2026-10-21");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("برچسب مدت", () => {
    expect(durationLabel(1)).toBe("نیم‌روز");
    expect(durationLabel(2)).toBe("یک شبانه‌روز");
    expect(durationLabel(5)).toBe("۲ شبانه‌روز و نیم");
    expect(durationLabel(14)).toBe("۷ شبانه‌روز");
  });
});
