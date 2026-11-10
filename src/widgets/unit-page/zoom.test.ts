import { describe, expect, it } from "vitest";
import { centerOn, clampView, fitSize, IDENTITY, MAX_SCALE, panBy, viewportRect, zoomAt } from "./zoom";

const stage = { w: 1000, h: 600 };

describe("fitSize", () => {
  it("تصویر پهن به عرض صحنه و تصویر بلند به ارتفاع صحنه می‌نشیند", () => {
    expect(fitSize(stage, 2)).toEqual({ w: 1000, h: 500 });
    expect(fitSize(stage, 1)).toEqual({ w: 600, h: 600 });
    expect(fitSize(stage, Number.NaN)).toEqual(stage);
  });
});

describe("محدودسازی جابه‌جایی", () => {
  const fit = fitSize(stage, 4 / 3); // 800×600
  it("در اندازهٔ عادی هیچ جابه‌جایی‌ای ممکن نیست", () => {
    expect(panBy(IDENTITY, 300, -200, stage, fit)).toEqual(IDENTITY);
  });
  it("در بزرگ‌نمایی، گوشه‌ها دقیقاً تا لبهٔ صحنه می‌رسند و نه بیشتر", () => {
    const v = clampView({ s: 2, x: 9999, y: -9999 }, stage, fit);
    // ‎(800·2 − 1000)/2 = 300‎ و ‎(600·2 − 600)/2 = 300‎
    expect(v).toEqual({ s: 2, x: 300, y: -300 });
  });
  it("مقیاس بین ۱ و بیشینه می‌ماند", () => {
    expect(clampView({ s: 99, x: 0, y: 0 }, stage, fit).s).toBe(MAX_SCALE);
    expect(clampView({ s: 0.2, x: 0, y: 0 }, stage, fit).s).toBe(1);
  });
});

describe("zoomAt", () => {
  const fit = fitSize(stage, 4 / 3);
  it("نقطهٔ زیر نشانگر پس از بزرگ‌نمایی ثابت می‌ماند", () => {
    const p = { x: 200, y: -100 };
    const v = zoomAt(IDENTITY, 2, p, stage, fit);
    // نقطهٔ محتوایی زیر ‎p‎ پیش و پس از بزرگ‌نمایی
    const before = (p.x - IDENTITY.x) / IDENTITY.s;
    const after = (p.x - v.x) / v.s;
    expect(after).toBeCloseTo(before);
    expect((p.y - v.y) / v.s).toBeCloseTo(p.y);
  });
  it("کوچک‌نمایی تا ۱ همیشه به مرکز بازمی‌گردد", () => {
    const zoomed = zoomAt(IDENTITY, 3, { x: 400, y: 250 }, stage, fit);
    expect(zoomAt(zoomed, 1, { x: -300, y: 0 }, stage, fit)).toEqual(IDENTITY);
  });
});

describe("نقشهٔ کوچک", () => {
  const fit = fitSize(stage, 4 / 3);
  it("در اندازهٔ عادی قاب دید کل تصویر است", () => {
    expect(viewportRect(IDENTITY, stage, fit)).toEqual({ left: 0, top: 0, width: 1, height: 1 });
  });
  it("کلیک روی گوشه، همان گوشه را می‌آورد و قاب به گوشه می‌چسبد", () => {
    const v = centerOn({ s: 2, x: 0, y: 0 }, 0, 0, stage, fit);
    expect(v).toEqual({ s: 2, x: 300, y: 300 });
    const r = viewportRect(v, stage, fit);
    expect(r.left).toBeCloseTo(0);
    expect(r.top).toBeCloseTo(0);
    expect(r.width).toBeCloseTo(1000 / 1600);
    expect(r.height).toBeCloseTo(0.5);
  });
});
