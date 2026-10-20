import { describe, expect, it } from "vitest";
import { checkPhone, isValidNationalId, mmss, prettyPhone } from "./identity";

describe("checkPhone", () => {
  it.each([
    ["09123456789", "+989123456789"],
    ["9123456789", "+989123456789"],
    ["+989123456789", "+989123456789"],
    ["00989123456789", "+989123456789"],
    ["989123456789", "+989123456789"],
    ["۰۹۱۲ ۳۴۵ ۶۷۸۹", "+989123456789"],
    ["٠٩١٢-٣٤٥-٦٧٨٩", "+989123456789"],
    ["(0912) 345 6789", "+989123456789"],
  ])("%s ⇒ %s", (raw, e164) => {
    expect(checkPhone(raw)).toEqual({ ok: true, e164 });
  });

  it("rejects short, landline and garbage", () => {
    expect(checkPhone("")).toEqual({ ok: false, reason: "empty" });
    expect(checkPhone("0912345")).toEqual({ ok: false, reason: "invalid" });
    expect(checkPhone("02112345678")).toEqual({ ok: false, reason: "invalid" });
    expect(checkPhone("abc")).toEqual({ ok: false, reason: "invalid" });
  });

  it("foreign numbers only behind the feature flag", () => {
    expect(checkPhone("+905321234567")).toEqual({ ok: false, reason: "foreign" });
    expect(checkPhone("+905321234567", true)).toEqual({ ok: true, e164: "+905321234567" });
  });
});

describe("isValidNationalId", () => {
  it("accepts valid checksums (incl. Persian digits)", () => {
    expect(isValidNationalId("0499370899")).toBe(true);
    expect(isValidNationalId("۰۴۹۹۳۷۰۸۹۹")).toBe(true);
  });
  it("rejects bad checksum, repeated digits and wrong length", () => {
    expect(isValidNationalId("0499370898")).toBe(false);
    expect(isValidNationalId("1111111111")).toBe(false);
    expect(isValidNationalId("123")).toBe(false);
  });
});

it("formats helpers", () => {
  expect(mmss(118)).toBe("01:58");
  expect(mmss(-3)).toBe("00:00");
  expect(prettyPhone("+989123456789")).toBe("+98 912 345 6789");
});
