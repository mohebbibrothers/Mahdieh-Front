import { describe, expect, it } from "vitest";
import { parseCertificateToken } from "./parse-token";

const T = "eyJjb2RlIjoiTS0xNDA1In0:1t2abc:Qw-_ErTyUiOp1234";
describe("استخراج توکن گواهی", () => {
  it("از نشانی کامل QR", () => {
    expect(parseCertificateToken(`https://mahdei.n-cpanel.xyz/verify/${T}/`)).toBe(T);
  });
  it("از خود توکن با فاصلهٔ اضافی", () => {
    expect(parseCertificateToken(`  ${T}\n`)).toBe(T);
  });
  it("توکن فشردهٔ جدید (QR نسخهٔ ۴) — از نشانی، بی اسلش پایانی و با حروف کوچک", () => {
    const C = "M-1405-0001.5GBYDG9PA3";
    expect(parseCertificateToken(`https://mahdei.n-cpanel.xyz/verify/${C}/`)).toBe(C);
    expect(parseCertificateToken(`https://mahdei.n-cpanel.xyz/verify/${C}?utm=x`)).toBe(C);
    expect(parseCertificateToken(C.toLowerCase())).toBe(C.toLowerCase());
    expect(parseCertificateToken("M-1.5GBYDG9PA3")).toBe("M-1.5GBYDG9PA3");
  });
  it("ورودی نامعتبر", () => {
    expect(parseCertificateToken("")).toBeNull();
    expect(parseCertificateToken("کد گواهی من")).toBeNull();
    expect(parseCertificateToken("abc")).toBeNull();
  });
});
