import { describe, expect, it } from "vitest";
import type { Reservation } from "@/shared/api/schemas";
import { isLiveStay, isSettling, settleMoment, statusBadge, stayPhaseOf } from "./stay";

type R = Pick<Reservation, "status" | "start" | "end" | "phase" | "status_label" | "settles_at">;
const stay = (over: Partial<R> = {}): R => ({
  status: "confirmed",
  status_label: "تأییدشده",
  start: "2026-10-25T08:00:00+03:30",
  end: "2026-10-27T08:00:00+03:30",
  phase: "upcoming",
  settles_at: "2026-10-27T14:00:00+03:30",
  ...over,
});
const at = (iso: string) => Date.parse(iso);

describe("stayPhaseOf — فاز زنده با ساعت کاربر", () => {
  it("پیش از آغاز", () => expect(stayPhaseOf(stay(), at("2026-10-24T10:00:00+03:30"))).toBe("upcoming"));
  it("در جریان", () => expect(stayPhaseOf(stay(), at("2026-10-26T10:00:00+03:30"))).toBe("ongoing"));
  it("لحظهٔ پایان دیگر فعال نیست (هم‌سان با سرور)", () =>
    expect(stayPhaseOf(stay(), at("2026-10-27T08:00:00+03:30"))).toBe("settling"));
  it("پروندهٔ بسته‌شده همیشه بسته", () =>
    expect(stayPhaseOf(stay({ status: "completed" }), at("2026-10-26T10:00:00+03:30"))).toBe("closed"));
  it("لغوشدهٔ آینده هم بسته", () => expect(stayPhaseOf(stay({ status: "cancelled_by_guest" }), 1)).toBe("closed"));
  it("پیش از hydration ⇒ فاز سرور", () => expect(stayPhaseOf(stay({ phase: "settling" }), 0)).toBe("settling"));
});

describe("isLiveStay / isSettling", () => {
  it("گزارش کارفرما: سفر یک هفته گذشته «فعال» نیست", () => {
    const now = at("2026-11-03T12:00:00+03:30");
    expect(isLiveStay(stay(), now)).toBe(false);
    expect(isSettling(stay(), now)).toBe(true);
  });
  it("در جریان اقامت فعال است", () => expect(isLiveStay(stay(), at("2026-10-26T10:00:00+03:30"))).toBe(true));
});

describe("settleMoment", () => {
  it("امروز", () => expect(settleMoment(stay(), at("2026-10-27T09:00:00+03:30"))).toBe("امروز ساعت ۱۴:۰۰"));
  it("فردا", () =>
    expect(settleMoment(stay({ settles_at: "2026-10-28T02:00:00+03:30" }), at("2026-10-27T22:00:00+03:30"))).toBe(
      "فردا ساعت ۰۲:۰۰",
    ));
  it("گذشته یا نامعلوم ⇒ null", () => {
    expect(settleMoment(stay(), at("2026-10-27T15:00:00+03:30"))).toBeNull();
    expect(settleMoment(stay({ settles_at: null }), 1)).toBeNull();
  });
});

describe("statusBadge", () => {
  it("تأییدشدهٔ گذشته «تأییدشده» خوانده نمی‌شود", () =>
    expect(statusBadge(stay(), at("2026-10-28T10:00:00+03:30"))).toEqual({
      label: "پایان اقامت · در حال بستن پرونده",
      settling: true,
    }));
  it("در غیر این صورت برچسب سرور", () =>
    expect(statusBadge(stay({ status: "completed", status_label: "پایان‌یافته" }), 1)).toEqual({
      label: "پایان‌یافته",
      settling: false,
    }));
});
