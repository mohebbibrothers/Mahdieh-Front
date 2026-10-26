import { describe, expect, it } from "vitest";
import type { CalendarCell, Standing } from "@/shared/api/schemas";
import type { Clock, Trip } from "@/widgets/units-page/model";
import {
  accountGate,
  codeFromPath,
  mainAction,
  periodHour,
  relatedUnits,
  shiftWeek,
  slotView,
  usablePhotos,
  weekDays,
  weekStart,
  type ActionInput,
} from "./model";

const clock: Clock = {
  now: Date.parse("2026-10-27T07:00:00+03:30"),
  minLeadHours: 2,
  horizonDays: 90,
  gridStartHour: 8,
  cellHours: 12,
};
const NOW = clock.now;

const quota = (remaining: number, limit = remaining || 1) => ({
  limit,
  remaining,
  used: limit - remaining,
  window_days: null,
});
const standing = (over: Partial<Standing> = {}): Standing => ({
  can_book: true,
  profile_complete: true,
  blockers: [],
  active: quota(1),
  window: quota(14),
  year: quota(60),
  cooldown_until: null,
  next_eligible_at: null,
  suspended_until: null,
  ...over,
});

const cell = (index: number, start: string, status: CalendarCell["status"] = "free"): CalendarCell => ({
  index,
  kind: index % 2 ? "night" : "day",
  label: "",
  start,
  end: start,
  status,
  detail: "",
});

describe("codeFromPath", () => {
  it("کد را از نشانی می‌خواند و بزرگ می‌کند", () => {
    expect(codeFromPath("/units/A1/")).toBe("A1");
    expect(codeFromPath("/units/b2")).toBe("B2");
  });
  it("قالب مشترک و مسیر نامعتبر ⇒ null", () => {
    expect(codeFromPath("/units/_/")).toBeNull();
    expect(codeFromPath("/units/")).toBeNull();
    expect(codeFromPath("/units/a b/")).toBeNull();
    expect(codeFromPath("/units/A1/extra/")).toBeNull();
  });
});

describe("هفتهٔ تقویم", () => {
  const today = "2026-10-27";
  it("بی‌تاریخ یا گذشته ⇒ امروز", () => {
    expect(weekStart(null, today, 90)).toBe(today);
    expect(weekStart("2026-10-01", today, 90)).toBe(today);
  });
  it("هرگز آخرین روز هفته از افق نمی‌گذرد", () => {
    expect(weekStart("2027-03-01", today, 90)).toBe("2027-01-19");
    expect(shiftWeek("2027-01-19", 1, today, 90)).toBe("2027-01-19");
  });
  it("جابه‌جایی هفته‌ای و هفت روز پیوسته", () => {
    expect(shiftWeek(today, 1, today, 90)).toBe("2026-11-03");
    expect(shiftWeek("2026-11-03", -1, today, 90)).toBe(today);
    expect(weekDays(today)).toHaveLength(7);
    expect(weekDays(today).at(-1)).toBe("2026-11-02");
  });
});

describe("slotView", () => {
  it("نیم‌روز انتخابیِ غیرآزاد ⇒ تعارض؛ گذشته قابل انتخاب نیست", () => {
    const busy = slotView(cell(4, "2026-10-29T08:00:00+03:30", "occupied"), clock, new Set([4]), 4);
    expect(busy).toMatchObject({ selected: true, conflict: true, start: true, pickable: true });
    const past = slotView(cell(0, "2026-10-26T08:00:00+03:30"), clock, new Set(), null);
    expect(past).toMatchObject({ state: "past", pickable: false });
    const free = slotView(cell(6, "2026-10-30T08:00:00+03:30"), clock, new Set([6]), 4);
    expect(free).toMatchObject({ state: "free", selected: true, conflict: false, start: false });
  });
  it("بیرون از افق ⇒ قابل انتخاب نیست", () => {
    const far = slotView(cell(400, "2027-03-01T08:00:00+03:30"), clock, new Set(), null);
    expect(far).toMatchObject({ state: "beyond", pickable: false });
  });
});

describe("accountGate", () => {
  it("مهمان و در حال دریافت", () => {
    expect(accountGate(false, undefined, NOW)).toEqual({ kind: "guest" });
    expect(accountGate(true, undefined, NOW)).toEqual({ kind: "loading" });
  });
  it("ترتیب اهمیت: محرومیت ⇒ رزرو فعال ⇒ فاصله ⇒ سهمیه ⇒ پروفایل", () => {
    const later = "2026-10-28T10:00:00+03:30";
    expect(accountGate(true, standing({ suspended_until: later, active: quota(0) }), NOW).kind).toBe("suspended");
    expect(accountGate(true, standing({ active: quota(0, 1), cooldown_until: later }), NOW)).toEqual({
      kind: "active",
      limit: 1,
    });
    expect(accountGate(true, standing({ cooldown_until: later }), NOW)).toEqual({ kind: "cooldown", until: later });
    expect(
      accountGate(
        true,
        standing({ window: quota(0, 14), blockers: [{ code: "window_quota", message: "سهمیه پر است" }] }),
        NOW,
      ),
    ).toEqual({ kind: "quota", message: "سهمیه پر است" });
    expect(accountGate(true, standing({ profile_complete: false }), NOW)).toEqual({ kind: "profile" });
    expect(accountGate(true, standing(), NOW)).toEqual({ kind: "ok" });
  });
  it("مهلت‌های گذشته نادیده گرفته می‌شوند", () => {
    const before = "2026-10-20T10:00:00+03:30";
    expect(accountGate(true, standing({ suspended_until: before, cooldown_until: before }), NOW)).toEqual({
      kind: "ok",
    });
  });
});

describe("mainAction", () => {
  const trip: Trip = { day: "2026-10-29", period: "day", cells: 2, guests: 4 };
  const base: ActionInput = {
    capacity: 6,
    maxCapacity: 8,
    trip,
    availability: { kind: "free", start: "2026-10-29T08:00:00+03:30", end: "2026-10-30T08:00:00+03:30" },
    online: true,
    timesReady: true,
    gate: { kind: "ok" },
    quoteAllowed: true,
  };
  it("بازهٔ آزاد ⇒ ادامه؛ پروفایل ناقص ⇒ برچسب تکمیل", () => {
    expect(mainAction(base)).toEqual({ label: "ادامه با این انتخاب", kind: "continue", disabled: false });
    expect(mainAction({ ...base, gate: { kind: "profile" } }).label).toBe("ادامه و تکمیل پروفایل");
  });
  it("آفلاین و موانع حساب بر همه مقدم‌اند", () => {
    expect(mainAction({ ...base, online: false })).toMatchObject({ disabled: true, label: "نیازمند اتصال" });
    expect(mainAction({ ...base, gate: { kind: "active", limit: 1 } })).toMatchObject({ disabled: true });
    expect(mainAction({ ...base, gate: { kind: "cooldown", until: "x" } })).toMatchObject({ disabled: true });
  });
  it("ظرفیت: واحد بزرگ‌تر یا تغییر تعداد", () => {
    expect(mainAction({ ...base, trip: { ...trip, guests: 7 } })).toMatchObject({ kind: "switch" });
    expect(mainAction({ ...base, trip: { ...trip, guests: 9 } })).toMatchObject({ kind: "time" });
  });
  it("بی‌تاریخ، در حال بررسی، ناآزاد، ردِ بررسی شخصی", () => {
    expect(mainAction({ ...base, trip: { ...trip, day: null } })).toMatchObject({ kind: "time", disabled: false });
    expect(mainAction({ ...base, timesReady: false })).toMatchObject({ disabled: true });
    expect(mainAction({ ...base, availability: { kind: "none" } })).toMatchObject({ kind: "time" });
    expect(mainAction({ ...base, quoteAllowed: false })).toMatchObject({ disabled: true, kind: "none" });
    expect(mainAction({ ...base, quoteAllowed: null })).toMatchObject({ kind: "continue" });
  });
});

describe("relatedUnits", () => {
  const u = (code: string, floor: number, cap: number) => ({ code, floor_number: floor, capacity_total: cap });
  const all = [u("A1", 1, 6), u("B1", 1, 8), u("A2", 2, 6), u("B2", 2, 8), u("B3", 3, 8)];
  it("هم‌طبقه اول، سپس جادار برای گروه", () => {
    expect(relatedUnits(all, all[0]!, 4).map((x) => x.code)).toEqual(["B1", "A2"]);
    expect(relatedUnits(all, all[4]!, 7).map((x) => x.code)).toEqual(["B1", "B2"]);
  });
});

describe("usablePhotos", () => {
  const p = (url: string | null, cover = false, order = 0) => ({
    url,
    alt_text: "",
    is_cover: cover,
    sort_order: order,
  });
  it("فقط http/https؛ شاخص اول و سپس ترتیب", () => {
    const out = usablePhotos(
      [
        p("/media/b.jpg", false, 2),
        p("javascript:alert(1)"),
        p(null),
        p("https://cdn.x/a.jpg", true, 5),
        p("/media/c.jpg", false, 1),
      ],
      "https://mahdieh.test/",
    );
    expect(out.map((x) => x.src)).toEqual([
      "https://cdn.x/a.jpg",
      "https://mahdieh.test/media/c.jpg",
      "https://mahdieh.test/media/b.jpg",
    ]);
  });
});

describe("periodHour", () => {
  it("روز ۸ و شب ۲۰ با شبکهٔ پیش‌فرض", () => {
    expect(periodHour("day", clock)).toBe(8);
    expect(periodHour("night", clock)).toBe(20);
    expect(periodHour("night", { gridStartHour: 14, cellHours: 12 })).toBe(2);
  });
});
