import { describe, expect, it } from "vitest";
import helpFixture from "../../../e2e/fixtures/help.json";
import prayerFixture from "../../../e2e/fixtures/prayer-times.json";
import { helpSchema, prayerTimesSchema } from "@/shared/api/schemas";
import {
  flatten,
  groupRules,
  highlight,
  nextSlot,
  normalizeFa,
  pickToday,
  quickTopics,
  readState,
  resolveTarget,
  search,
  searchTokens,
  snippetOf,
  untilLabel,
  writeState,
} from "./model";
import parity from "./search-parity.json";

const help = helpSchema.parse(helpFixture);
const items = flatten(help);

describe("یکسان‌سازی (آینهٔ normalize_fa)", () => {
  it("ی/ک عربی، اعراب، نیم‌فاصله، نویسهٔ نامرئی و ارقام", () => {
    expect(normalizeFa("كيفيّت\u200cها  ۲۴ ٣")).toBe("کیفیتها 24 3");
    expect(searchTokens("نیم‌روز؟")).toEqual(["نیمروز"]);
    expect(searchTokens("  ")).toEqual([]);
  });
});

describe("جست‌وجو", () => {
  it.each(Object.entries(parity))("هم‌خوان با بک‌اند: «%s»", (q, slugs) => {
    expect(search(items, q).map((i) => i.slug)).toEqual(slugs);
  });
  it("پرسش تهی همهٔ پرسش‌ها را به ترتیب اصلی می‌دهد", () => {
    expect(search(items, "")).toHaveLength(help.stats.questions);
  });
});

describe("برجسته‌سازی روی متن نمایشی", () => {
  it("واژهٔ عربی‌نویس روی متن فارسی و با نیم‌فاصله", () => {
    expect(highlight("کد تأیید پیامکی", "كد")).toEqual([
      { text: "کد", hit: true },
      { text: " تأیید پیامکی", hit: false },
    ]);
    const parts = highlight("نیم‌روز یا شب", "نیمروز");
    expect(parts[0]).toEqual({ text: "نیم‌روز", hit: true });
  });
  it("ارقام فارسی با پرسش لاتین و ادغام همپوشانی", () => {
    expect(highlight("تا ۲۴ ساعت", "24").find((p) => p.hit)?.text).toBe("۲۴");
    expect(highlight("رزرو", "رز رزرو")).toEqual([{ text: "رزرو", hit: true }]);
  });
});

describe("حالت نشانی", () => {
  it("خواندن و نوشتن ‎q/cat‎ و پیوند ‎#item-slug‎", () => {
    expect(readState("?q=لغو&cat=change", "#item-cancel")).toEqual({ q: "لغو", cat: "change", open: ["cancel"] });
    expect(readState("", "#contact-desk").open).toEqual([]);
    const href = writeState({ q: " لغو ", cat: "all", open: [] }, "https://x.ir/help/?cat=booking#faq");
    expect(new URL(href).search).toBe(`?q=${encodeURIComponent("لغو")}`);
    expect(href.endsWith("#faq")).toBe(true);
  });
});

describe("مقصد اقدام‌ها", () => {
  it("هر هدف بک‌اند به مسیر یا پنجرهٔ حساب می‌رسد", () => {
    const targets = new Set([
      ...items.flatMap((i) => (i.action ? [i.action.target] : [])),
      ...help.quick_steps.map((s) => s.target),
    ]);
    for (const t of targets) expect(resolveTarget(t), t).not.toBeNull();
    expect(resolveTarget("login")).toEqual({ kind: "account" });
    expect(resolveTarget("legacy")).toBeNull();
  });
  it("تراشه‌ها با عدد زندهٔ سیاست و هر کدام دست‌کم یک نتیجه", () => {
    const topics = quickTopics(help.values);
    expect(topics[0]?.label).toContain(help.values.quota_nights);
    for (const t of topics) if (t.query) expect(search(items, t.query).length, t.label).toBeGreaterThan(0);
  });
});

describe("اوقات شرعی", () => {
  const pt = prayerTimesSchema.parse(prayerFixture);
  it("روز جاری و وقت پیش‌رو", () => {
    expect(pickToday(pt.days, "2026-10-21")).toBe(1);
    expect(pickToday(pt.days, "2030-01-01")).toBe(0);
    const now = Date.parse("2026-10-20T13:50:00+03:30");
    expect(nextSlot(pt.days, now)).toEqual([0, 3]);
    expect(nextSlot(pt.days, Date.parse("2026-10-20T23:00:00+03:30"))).toEqual([1, 0]);
  });
  it("برچسب فاصله", () => {
    expect(untilLabel(30_000)).toBe("1 دقیقه");
    expect(untilLabel(0)).toBe("کمتر از یک دقیقه");
    expect(untilLabel(80 * 60_000)).toBe("1 ساعت و 20 دقیقه");
    expect(untilLabel(120 * 60_000)).toBe("2 ساعت");
  });
});

describe("برش متن", () => {
  it("پیرامون واژه، با سه‌نقطه و بی‌واژهٔ نیمه", () => {
    const long = `${"الف ".repeat(40)}کلید در پذیرش تحویل می‌شود ${"ب ".repeat(60)}`;
    const s = snippetOf(long, "کلید");
    expect(s.startsWith("… ")).toBe(true);
    expect(s.endsWith(" …")).toBe(true);
    expect(s).toContain("کلید در پذیرش");
    expect(snippetOf("بی‌ربط", "کلید")).toBe("");
    expect(snippetOf("کلید کوتاه", "کلید")).toBe("کلید کوتاه");
  });
});

describe("تابلوی قواعد", () => {
  it("هر ۱۴ قاعده در سه گروه و کلید ناشناخته در گروه آخر", () => {
    const groups = groupRules(help.rules);
    expect(groups).toHaveLength(3);
    expect(groups.flatMap((g) => g.rules)).toHaveLength(help.rules.length);
    const extra = groupRules([...help.rules, { key: "future", label: "تازه", value: "۱" }]);
    expect(extra.at(-1)?.rules.at(-1)?.key).toBe("future");
  });
});
