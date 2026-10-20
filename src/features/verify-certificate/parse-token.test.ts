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
  it("ورودی نامعتبر", () => {
    expect(parseCertificateToken("")).toBeNull();
    expect(parseCertificateToken("کد گواهی من")).toBeNull();
    expect(parseCertificateToken("abc")).toBeNull();
  });
});
