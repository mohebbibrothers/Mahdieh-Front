import { describe, expect, it } from "vitest";
import { formatMobile, normalizeIranMobile } from "./phone";

describe("normalizeIranMobile", () => {
  it.each([
    ["09123456789", "09123456789"],
    ["9123456789", "09123456789"],
    ["+989123456789", "09123456789"],
    ["00989123456789", "09123456789"],
    ["۰۹۱۲ ۳۴۵ ۶۷۸۹", "09123456789"],
    ["٠٩١٢٣٤٥٦٧٨٩", "09123456789"],
    ["0912-345-6789", "09123456789"],
  ])("%s → %s", (raw, want) => expect(normalizeIranMobile(raw)).toBe(want));

  it.each(["", "0912345678", "08123456789", "091234567890", "abc"])("rejects %s", (raw) =>
    expect(normalizeIranMobile(raw)).toBeNull(),
  );

  it("formats for display", () => {
    expect(formatMobile("09123456789")).toBe("0912 345 6789");
  });
});
