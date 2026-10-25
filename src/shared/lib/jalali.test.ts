import { describe, expect, it } from "vitest";
import { addMonths, fromJalali, jalaliNumeric, monthGrid, monthLength, toJalali, weekColumn } from "./jalali";

describe("تقویم خورشیدی", () => {
  it("میلادی ⇒ خورشیدی (نوروز، گواهی نمونه، پایان سال کبیسه)", () => {
    expect(toJalali("2026-03-21")).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(toJalali("2026-10-29")).toEqual({ jy: 1405, jm: 8, jd: 7 });
    expect(toJalali("2025-03-20")).toEqual({ jy: 1403, jm: 12, jd: 30 });
  });

  it("خورشیدی ⇒ میلادی، رفت‌وبرگشت برای کل یک سال", () => {
    expect(fromJalali(1405, 8, 7)).toBe("2026-10-29");
    expect(fromJalali(1403, 12, 30)).toBe("2025-03-20");
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= monthLength(1405, m); d++) {
        const g = fromJalali(1405, m, d);
        expect(g && toJalali(g)).toEqual({ jy: 1405, jm: m, jd: d });
      }
    }
  });

  it("کبیسه: ۳۰ اسفند فقط در سال کبیسه", () => {
    expect(monthLength(1403, 12)).toBe(30);
    expect(monthLength(1404, 12)).toBe(29);
    expect(fromJalali(1404, 12, 30)).toBeNull();
    expect(fromJalali(1405, 13, 1)).toBeNull();
  });

  it("هفتهٔ ایرانی از شنبه و جدول ماه", () => {
    expect(weekColumn("2026-10-24")).toBe(0); // شنبه
    expect(weekColumn("2026-10-30")).toBe(6); // جمعه
    const grid = monthGrid(1405, 8); // ۱ آبان ۱۴۰۵ = جمعه ۲۳ اکتبر (۷ آبان = پنجشنبه، مثل گواهی)
    expect(grid.findIndex(Boolean)).toBe(6);
    expect(grid.filter(Boolean)).toHaveLength(30);
  });

  it("گذر ماه و قالب عددی گواهی", () => {
    expect(addMonths(1405, 12, 1)).toEqual({ jy: 1406, jm: 1 });
    expect(addMonths(1405, 1, -1)).toEqual({ jy: 1404, jm: 12 });
    expect(jalaliNumeric("2026-10-29")).toBe("1405/8/7");
  });
});
