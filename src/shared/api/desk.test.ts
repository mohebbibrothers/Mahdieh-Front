import { describe, expect, it } from "vitest";
import checkIn from "../../../e2e/fixtures/p06/check-in.json";
import complete from "../../../e2e/fixtures/p06/complete.json";
import deskAfter from "../../../e2e/fixtures/p06/desk-after-checkin.json";
import deskMfaRequired from "../../../e2e/fixtures/p06/desk-mfa-required.json";
import desk from "../../../e2e/fixtures/p06/desk.json";
import events from "../../../e2e/fixtures/p06/events.json";
import guest from "../../../e2e/fixtures/p06/guest.json";
import lookupCode from "../../../e2e/fixtures/p06/lookup-code.json";
import lookupName from "../../../e2e/fixtures/p06/lookup-name.json";
import lookupNone from "../../../e2e/fixtures/p06/lookup-none.json";
import mfaSetup from "../../../e2e/fixtures/p06/mfa-setup.json";
import mfaStatusUnenrolled from "../../../e2e/fixtures/p06/mfa-status-unenrolled.json";
import mfaStatus from "../../../e2e/fixtures/p06/mfa-status.json";
import revealStepUp from "../../../e2e/fixtures/p06/reveal-step-up.json";
import waitlist from "../../../e2e/fixtures/p06/waitlist.json";
import {
  deskSchema,
  guestDetailSchema,
  lookupSchema,
  mfaEnrollmentSchema,
  mfaStatusSchema,
  staffEventsSchema,
  staffReservationSchema,
  staffWaitlistSchema,
  unitResponse,
} from "./desk";

/**
 * قرارداد پیشخوان: هر fixture پاسخ **واقعی** بک‌اند در لحظهٔ ثابت آزمون‌هاست (۲۸ مهر ۱۴۰۵، ۱۳:۵۰).
 * ‎satisfies‎ خروجیِ باریک‌تر از سند را نمی‌گیرد (مثلاً ‎string‎ به‌جای ‎string | null‎)؛ این آزمون
 * همان شکاف را می‌بندد تا پاسخ درست سرور در مرورگر «خطا» دیده نشود.
 */
describe("قرارداد API پیشخوان با پاسخ واقعی سرور", () => {
  it.each([
    ["تصویر میز", deskSchema, desk],
    ["تصویر میز پس از پذیرش", deskSchema, deskAfter],
    ["جست‌وجو با کد رزرو", lookupSchema, lookupCode],
    ["جست‌وجو با نام", lookupSchema, lookupName],
    ["جست‌وجوی بی‌نتیجه", lookupSchema, lookupNone],
    ["وضعیت عامل دوم", mfaStatusSchema, mfaStatus],
    ["عامل دوم ثبت‌نشده", mfaStatusSchema, mfaStatusUnenrolled],
    ["ثبت TOTP", mfaEnrollmentSchema, mfaSetup],
    ["صف انتظار", staffWaitlistSchema, waitlist],
    ["پروندهٔ زائر", guestDetailSchema, guest],
    ["رخدادهای رزرو", staffEventsSchema, events],
    ["پاسخ پذیرش", staffReservationSchema, checkIn],
    ["پایان نظافت", unitResponse, complete],
  ] as const)("%s", (_name, schema, body) => {
    const parsed = schema.safeParse(body);
    expect(parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)).toEqual([]);
  });

  it("تصویر میز: هر پنج واحد، هر وضعیت یک‌بار و شاخص‌ها هم‌خوان با واحدها", () => {
    const d = deskSchema.parse(desk);
    expect(d.units.map((u) => u.state).sort()).toEqual(["buffer", "expected", "maintenance", "occupied", "ready"]);
    for (const state of ["occupied", "ready", "buffer", "expected", "maintenance"] as const) {
      expect(d.kpis[state]).toBe(d.units.filter((u) => u.state === state).length);
    }
    expect(d.ledger.every((r) => r.superseded_by_code === null)).toBe(true);
  });

  it("سد عامل دوم و تأیید تازه با کد ماشینی", () => {
    expect(deskMfaRequired).toMatchObject({ status: 403, code: "mfa_required" });
    expect(revealStepUp).toMatchObject({ status: 403, code: "step_up_required" });
  });
});
