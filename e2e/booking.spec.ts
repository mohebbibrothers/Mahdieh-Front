import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-05 «تکمیل و صدور رزرو» — همهٔ پاسخ‌ها از بک‌اند واقعی ضبط شده‌اند (‎e2e/fixtures/p05‎):
 * مهمان ⇐ ورود ⇐ پروفایل ⇐ اهلیت/استعلام ⇐ ثبت هم‌توان ⇐ گواهی؛ سانس پُر؛ مانع سهمیه؛ لغو؛ نظرسنجی؛ QR.
 */
const p05 = <T = unknown>(name: string) => fixture<T>(`p05/${name}`);
type Json = Record<string, unknown>;

const CODE = "M-1405-0011";
const CHECKOUT = "/booking/?unit=B2&day=2026-11-18&period=day&cells=4&guests=4";
const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };

/** «/api/v1/reservations» برای GET (فهرست) و POST (ثبت) یک مسیر است ⇒ تفکیک با متد. */
function reservations(
  api: MockApi,
  onPost?: (route: Route) => Promise<void>,
  list: unknown = p05("reservations-mine"),
) {
  api.set("/api/v1/reservations", async (route) => {
    if (route.request().method() === "POST" && onPost) return onPost(route);
    return route.fulfill({ json: list });
  });
}

function signedIn(api: MockApi, standing: unknown = p05("standing-ok")) {
  api.set("/api/v1/auth/session", { body: p05("session-complete") });
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/me/standing", { body: standing });
}

/** نمای یک رزرو (گواهی، گاه‌شمار، پیش‌نمایش لغو) از fixtureهای همان رزرو. */
function reservationView(api: MockApi, code: string, reservation: unknown) {
  api.set(`/api/v1/reservations/${code}`, { body: reservation });
  api.set(`/api/v1/reservations/${code}/certificate`, { body: p05("certificate") });
  api.set(`/api/v1/reservations/${code}/timeline`, { body: p05("timeline-confirmed") });
  api.set(`/api/v1/reservations/${code}/cancel-preview`, { body: p05("cancel-preview") });
}

const heading = (page: Page, name: string | RegExp) => page.getByRole("heading", { level: 2, name });
const currentStep = (page: Page) =>
  page.getByRole("navigation", { name: "مراحل صدور رزرو" }).locator('[aria-current="step"]');

test.describe("P-05 تکمیل و صدور رزرو", () => {
  test("مهمان: گام ۱ ورود، خلاصهٔ انتخاب از نشانی، بی‌استعلام و بی‌سرریز", async ({ page, api }) => {
    await page.goto(CHECKOUT);
    await expect(heading(page, "ورود با شمارهٔ تلفن همراه")).toBeVisible();
    await expect(currentStep(page)).toContainText("شماره همراه");
    const ribbon = page.getByRole("region", { name: "خلاصهٔ انتخاب شما" });
    await expect(ribbon).toContainText("B2");
    await expect(ribbon).toContainText("۴ نفر");
    await expect(ribbon).toContainText("رایگان");
    expect(await horizontalOverflow(page)).toBeNull();
    // مهمان هنوز اهلیت ندارد ⇒ هیچ استعلام/ثبتی
    expect(api.calls.filter((c) => c.startsWith("POST"))).toEqual([]);
  });

  test("مسیر کامل: کد ⇐ پروفایل ⇐ اهلیت ⇐ ثبت با کلید هم‌توان ⇐ گواهی", async ({ page, api }, info) => {
    const sent: Record<string, Json> = {};
    let idem: string | undefined;
    const user = p05<Json>("session-complete");
    const incomplete = p05<Json>("session-incomplete");
    api.set("/api/v1/auth/csrf", { body: CSRF });
    api.set("/api/v1/auth/otp/request", { status: 202, body: p05("otp-request") });
    api.set("/api/v1/auth/otp/verify", async (route) => {
      api.set("/api/v1/auth/session", { body: incomplete });
      await route.fulfill({ json: p05("otp-verify") });
    });
    api.set("/api/v1/me/profile", async (route) => {
      sent.profile = route.request().postDataJSON() as Json;
      api.set("/api/v1/auth/session", { body: user });
      await route.fulfill({ json: p05("profile-saved") });
    });
    api.set("/api/v1/me/standing", { body: p05("standing-ok") });
    api.set("/api/v1/reservations/quote", async (route) => {
      sent.quote = route.request().postDataJSON() as Json;
      await route.fulfill({ json: p05("quote-ok") });
    });
    reservations(api, async (route) => {
      sent.create = route.request().postDataJSON() as Json;
      idem = route.request().headers()["idempotency-key"];
      await route.fulfill({ status: 201, json: p05("reservation-confirmed") });
    });
    reservationView(api, CODE, p05("reservation-confirmed"));

    await page.goto(CHECKOUT);
    await page.getByRole("textbox", { name: /شمارهٔ تلفن همراه/ }).fill("09123456789");
    await page.getByRole("button", { name: /دریافت کد یک‌بارمصرف/ }).click();
    await page.getByRole("textbox", { name: "کد پنج رقمی" }).fill("12345");

    await expect(heading(page, "مشخصات سجلی و هویتی سرپرست زائران")).toBeVisible();
    await expect(currentStep(page)).toContainText("مشخصات سجلی");
    await page.getByRole("textbox", { name: /^نام\s*\*?$/ }).fill("مرتضی");
    await page.getByRole("textbox", { name: /^نام خانوادگی\s*\*?$/ }).fill("رضوی");
    await page.getByRole("textbox", { name: /^کد ملی/ }).fill("0499370899");
    await expect(page.getByText("رقم کنترل کد ملی درست است.")).toBeVisible();
    await page.getByRole("button", { name: "تهران", exact: true }).click();
    await page.getByRole("textbox", { name: /^شهر محل سکونت\s*\*?$/ }).fill("مشهد");
    await page.getByRole("button", { name: /ثبت مشخصات/ }).click();

    await expect(heading(page, "بررسی اهلیت رزرو و جزئیات سفر زیارتی")).toBeVisible();
    expect(sent.profile).toMatchObject({ first_name: "مرتضی", national_id: "0499370899", province: "tehran" });
    await expect(page.getByText("اهلیت رزرو زائر: مجاز و دارای سهمیه")).toBeVisible();
    await expect(page.getByText(/این سانس برای شما آزاد و مجاز است/)).toBeVisible();
    expect(sent.quote).toMatchObject({ unit_code: "B2", guests_count: 4 });
    if (info.project.name === "mobile") expect(await horizontalOverflow(page)).toBeNull();

    await page.getByRole("button", { name: "تأیید نهایی و صدور گواهی اقامت" }).click();
    await expect(heading(page, "گواهی رسمی اقامت و بلیط دیجیتال")).toBeVisible();
    expect(sent.create).toMatchObject({
      unit_code: "B2",
      start: "2026-11-18T08:00:00+03:30",
      end: "2026-11-20T08:00:00+03:30",
      guests_count: 4,
    });
    expect(idem, "سرآیند Idempotency-Key").toMatch(/^[\w-]{16,}$/);
    expect(new URL(page.url()).searchParams.get("code")).toBe(CODE);
    await expect(page.getByText("زیارت قبول · رزرو شما با موفقیت قطعی شد")).toBeVisible();
    const cert = page.locator(".cert");
    await expect(cert).toContainText(CODE);
    await expect(cert).toContainText("F6Z2-XDTG");
    await expect(page.getByRole("button", { name: /چاپ گواهی اقامت/ })).toBeVisible();
    await expect(currentStep(page)).toContainText("گواهی رسمی");
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("سانس پُر: پیام، دکمهٔ ثبت غیرفعال و جایگزینی یک‌لمسی", async ({ page, api }) => {
    signedIn(api);
    reservations(api);
    api.set("/api/v1/reservations/quote", { body: p05("quote-taken") });
    await page.goto("/booking/?unit=B1&day=2026-11-14&period=day&cells=4&guests=4");
    await expect(page.getByText("این سانس دیگر آزاد نیست")).toBeVisible();
    await expect(page.getByRole("button", { name: "تأیید نهایی و صدور گواهی اقامت" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "عضویت در صف انتظار" })).toBeVisible();
    await page.locator(".alt-chip").first().click();
    await expect.poll(() => new URL(page.url()).searchParams.get("day")).toBe("2026-11-12");
    expect(new URL(page.url()).searchParams.get("unit")).toBe("B1");
    expect(api.calls.filter((c) => c === "POST /api/v1/reservations")).toEqual([]);
  });

  test("مانع سهمیه: پیام بک‌اند، ثبت غیرفعال و پیوند به رزرو فعال", async ({ page, api }) => {
    signedIn(api, fixture("standing-active"));
    reservations(api, undefined, fixture("reservations-upcoming"));
    api.set("/api/v1/reservations/quote", { body: p05("quote-ok") });
    await page.goto(CHECKOUT);
    await expect(page.getByRole("alert").filter({ hasText: "یک رزرو فعال دارید" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تأیید نهایی و صدور گواهی اقامت" })).toBeDisabled();
    await expect(page.locator('a[href="/booking/?code=MHD-7K3Q9"]').first()).toBeVisible();
    expect(api.calls.filter((c) => c === "POST /api/v1/reservations")).toEqual([]);
  });

  test("لغو: پیش‌نمایش سرور ⇐ دلیل ⇐ تأیید؛ گواهی و چاپ ناپدید و گواهی دوباره واکشی نمی‌شود", async ({ page, api }) => {
    signedIn(api);
    reservations(api);
    reservationView(api, CODE, p05("reservation-confirmed"));
    let body: Json | undefined;
    api.set(`/api/v1/reservations/${CODE}/cancel`, async (route) => {
      body = route.request().postDataJSON() as Json;
      api.set(`/api/v1/reservations/${CODE}`, { body: p05("reservation-cancelled") });
      api.set(`/api/v1/reservations/${CODE}/timeline`, { body: p05("timeline-cancelled") });
      await route.fulfill({ json: p05("reservation-cancelled") });
    });
    await page.goto(`/booking/?code=${CODE}`);
    await expect(page.locator(".cert")).toBeVisible();
    await page.getByRole("button", { name: /پیش‌نمایش شرایط لغو رزرو/ }).click();
    const dialog = page.getByRole("dialog", { name: "پیش‌نمایش شرایط لغو رزرو" });
    await expect(dialog).toContainText("لغو رایگان");
    await dialog.getByRole("button", { name: "تغییر برنامهٔ سفر" }).click();
    await dialog.getByRole("button", { name: /لغو قطعی رزرو/ }).click();
    await expect(dialog).toBeHidden();
    expect(body).toMatchObject({ reason_kind: "guest_request", reason: "تغییر برنامهٔ سفر" });
    await expect(page.getByText(/این رزرو لغو توسط زائر است/)).toBeVisible();
    await expect(page.locator(".cert")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /چاپ گواهی اقامت/ })).toHaveCount(0);
    expect(api.calls.filter((c) => c.endsWith("/certificate"))).toHaveLength(1);
  });

  test("نظرسنجی پس از اقامت: امتیاز، توصیه و نظر ⇐ ثبت از راه API (نه صفحهٔ قدیمی)", async ({ page, api }) => {
    signedIn(api);
    reservations(api);
    const done = p05<{ code: string; feedback_url: string }>("reservation-completed");
    const token = decodeURIComponent(/\/feedback\/([^/]+)\//.exec(done.feedback_url)?.[1] ?? "");
    reservationView(api, done.code, done);
    let body: Json | undefined;
    api.set(`/api/v1/feedback/${encodeURIComponent(token)}`, async (route) => {
      if (route.request().method() === "POST") {
        body = route.request().postDataJSON() as Json;
        return route.fulfill({ status: 201, json: p05("feedback-submitted") });
      }
      return route.fulfill({ json: p05("feedback-open") });
    });
    await page.goto(`/booking/?code=${done.code}`);
    await expect(page.getByText("اقامت شما به پایان رسید · زیارت قبول")).toBeVisible();
    await expect(page.locator('a[href*="/feedback/"]')).toHaveCount(0);
    await page.getByRole("button", { name: /نظرسنجی پس از اقامت/ }).click();
    const dialog = page.getByRole("dialog", { name: "نظرسنجی پس از اقامت" });
    const submit = dialog.getByRole("button", { name: /ثبت نظر/ });
    await expect(submit).toBeDisabled();
    await dialog
      .getByRole("group", { name: /امتیاز کلی اقامت/ })
      .locator(".stars__item")
      .nth(4)
      .click();
    await expect(dialog.locator("output")).toHaveText("عالی");
    await dialog.getByRole("group", { name: "پاکیزگی" }).locator(".stars__item").nth(3).click();
    await dialog.getByRole("button", { name: /بله/ }).click();
    await dialog.getByRole("textbox").fill("خادمان بسیار مهربان بودند.");
    await submit.click();
    await expect(dialog).toBeHidden();
    expect(body).toMatchObject({
      rating: 5,
      would_recommend: true,
      comment: "خادمان بسیار مهربان بودند.",
      scores: { cleanliness: 4 },
    });
    await expect(page.getByRole("status").filter({ hasText: "سپاس از نظرتان" })).toBeVisible();
  });

  test("پیوند QR گواهی (‎/?verify=‎): پنجرهٔ استعلام خودکار باز و پارامتر پاک می‌شود", async ({ page, api }) => {
    const { token, response } = p05<{ token: string; response: unknown }>("verify-ok");
    api.set(`/api/v1/certificates/verify/${encodeURIComponent(token)}`, { body: response });
    await page.goto(`/?verify=${encodeURIComponent(token)}`);
    const dialog = page.getByRole("dialog", { name: "استعلام گواهی اقامت" });
    await expect(dialog).toContainText("گواهی معتبر است");
    await expect(dialog).toContainText("M-1405-0004");
    expect(new URL(page.url()).searchParams.has("verify")).toBe(false);
  });

  test("بی‌انتخاب، مهمان: میان‌بُرهای انتخاب و «ورود» درون‌برنامه‌ای", async ({ page }) => {
    await page.goto("/booking/");
    await expect(heading(page, "نخست زمان اقامت و واحد را انتخاب کنید")).toBeVisible();
    await expect(page.getByRole("link", { name: /انتخاب زمان اقامت/ })).toBeVisible();
    await page.getByRole("button", { name: "ورود", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "ورود یا ثبت‌نام" })).toBeVisible();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`دسترس‌پذیری axe گام ۳ بدون خطای جدی (${theme})`, async ({ page, api }) => {
      test.slow();
      signedIn(api);
      reservations(api);
      api.set("/api/v1/reservations/quote", { body: p05("quote-ok") });
      await page.addInitScript((t) => localStorage.setItem("mahdieh-theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(CHECKOUT);
      await expect(page.getByText(/این سانس برای شما آزاد و مجاز است/)).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .options({
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
          resultTypes: ["violations"],
          rules: { "label-content-name-mismatch": { enabled: true } },
        })
        .analyze();
      const serious = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        );
      expect(serious).toEqual([]);
    });
  }
});
