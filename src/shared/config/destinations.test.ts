import { afterEach, describe, expect, it } from "vitest";
import { DEST, destHref, pendingDestinations, PAGES, unitPageHref, type DestKey, type PageId } from "./destinations";

/** همان الگوی آزمون نگهبان e2e: قالب‌های قدیمی جنگو (apps/web، apps/core) و پیشخوان مدیریت. */
const LEGACY =
  /^(?:https?:\/\/[^/]+)?\/(?:board|book|calendar|demo|feedback|help|login|logout|my|profile|units|verify|django-admin)(?:[/?#]|$)/;
const KEYS = Object.keys(DEST) as DestKey[];
const IDS = Object.keys(PAGES) as PageId[];
const snapshot = structuredClone(PAGES);

afterEach(() => {
  for (const id of IDS) PAGES[id] = { ...snapshot[id] };
});

describe("نقشهٔ مقصدها", () => {
  it("تا وقتی صفحه‌ای ساخته نشده، هیچ مقصدی به قالب قدیمی جنگو یا صفحهٔ بیرونی نمی‌رود", () => {
    for (const id of IDS) PAGES[id] = { ...PAGES[id], ready: false };
    for (const key of KEYS) {
      const href = destHref(key);
      if (href === null) continue;
      expect(href, key).not.toMatch(LEGACY);
      expect(href, key).toMatch(/^\/#[a-z][\w-]*$/); // فقط لنگر بخش‌های صفحهٔ خانه
    }
    expect(unitPageHref("A1")).toBeNull();
  });

  it("پیوندهای منو و پانویس همیشه مقصد دارند؛ دکمه‌های وابسته به صفحه تا آن زمان پنهان‌اند", () => {
    for (const id of IDS) PAGES[id] = { ...PAGES[id], ready: false };
    expect(destHref("units")).toBe("/#units");
    expect(destHref("calendar")).toBe("/#availability");
    expect(destHref("guide")).toBe("/#rules");
    for (const key of [
      "calendarFull",
      "guideFull",
      "unitsCompare",
      "contact",
      "portal",
      "verifyOffline",
      "booking",
      "bookingNav",
      "reservation",
    ] as const) {
      expect(destHref(key), key).toBeNull();
    }
  });

  it("با انتشار صفحه، همهٔ قصدهای آن یک‌جا به همان صفحه وصل می‌شوند (با پارامتر و لنگر)", () => {
    for (const id of IDS) PAGES[id] = { ...PAGES[id], ready: true };
    expect(destHref("calendar")).toBe("/calendar/");
    expect(destHref("calendarFull")).toBe("/calendar/");
    expect(destHref("contact")).toBe("/guide/#contact-desk");
    expect(destHref("booking", { unit: "A1", day: "2026-10-23", period: "day", cells: "4", guests: "4" })).toBe(
      "/booking/?unit=A1&day=2026-10-23&period=day&cells=4&guests=4",
    );
    expect(destHref("reservation", { code: "M-1405-0142" })).toBe("/booking/?code=M-1405-0142");
    expect(unitPageHref("B 2")).toBe("/units/B%202/");
    // جنگو فقط مسیر دقیق ‎routes.json‎ (با اسلش پایانی) را به فرانت می‌دهد.
    for (const key of KEYS) expect(destHref(key), key).toMatch(/^\/[a-z][a-z/-]*\/(?:[?#]|$)/);
  });

  it("صفحه‌های منتشرشده واقعاً آماده‌اند: «تکمیل و صدور رزرو» (P-05) فعال است", () => {
    expect(PAGES["P-05"].ready).toBe(true);
    expect(destHref("bookingNav")).toBe("/booking/");
    expect(destHref("booking", { unit: "A1" })).not.toMatch(LEGACY);
  });

  it("فهرست صفحه‌های منتظر کامل است و هر قصد دقیقاً به یک صفحه تعلق دارد", () => {
    const pending = pendingDestinations();
    expect(pending.map((p) => p.page)).toEqual(IDS.filter((id) => !PAGES[id].ready));
    const all = pending.flatMap((p) => p.intents);
    expect(new Set(all).size).toBe(all.length);
    for (const key of KEYS) expect(DEST[key].page in PAGES, key).toBe(true);
    // پذیرش (P-06) فقط کارکنان است و هرگز در نقشهٔ عمومی نمی‌آید.
    expect(IDS).not.toContain("P-06");
  });
});
