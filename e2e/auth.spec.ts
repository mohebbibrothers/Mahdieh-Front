import type { Page } from "@playwright/test";
import { expect, fixture, test, type MockApi } from "./support/fixtures";

/** صفحه‌های قدیمیِ جنگو — هیچ پیوندی از فرانت جدید نباید به این‌ها برسد. */
const LEGACY = /^\/(units|calendar|help|my|login|book|verify|reserve)(\/|$|\?)/;

const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };

function mockLogin(api: MockApi, opts: { delivery?: string } = {}) {
  const bodies: Array<{ path: string; body: unknown; csrf: string | null }> = [];
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/auth/otp/request", async (route) => {
    bodies.push({
      path: "request",
      body: route.request().postDataJSON(),
      csrf: await route.request().headerValue("x-csrftoken"),
    });
    await route.fulfill({
      status: 202,
      json: { expires_in: 120, resend_after: 60, delivery_status: opts.delivery ?? "sent" },
    });
  });
  return bodies;
}

async function openLogin(page: Page, mobile: boolean) {
  if (mobile) await page.getByRole("navigation", { name: "میان‌بُرها" }).getByRole("button", { name: "ورود" }).click();
  else await page.locator("header").getByRole("button", { name: "ورود / ثبت‌نام با شمارهٔ همراه" }).click();
  const dialog = page.getByRole("dialog", { name: "ورود یا ثبت‌نام" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("ورود، حساب و پیوندها", () => {
  test("هیچ پیوندی به صفحه‌های قدیمی جنگو نمی‌رود", async ({ page, api }) => {
    api.set("/api/v1/auth/session", { body: fixture("session-user") });
    api.set("/api/v1/reservations", { body: fixture("reservations-upcoming") });
    api.set("/api/v1/me/standing", { body: fixture("standing-active") });
    await page.goto("/");
    await expect(page.getByRole("complementary", { name: "سفر پیش رو" })).toBeVisible();
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    const bad = hrefs.filter((h) => LEGACY.test(h));
    expect(bad).toEqual([]);
    expect(hrefs.length).toBeGreaterThan(10);
  });

  test("ورود کامل با کد پیامکی درون همین صفحه", async ({ page, api }, info) => {
    const sent = mockLogin(api);
    api.set("/api/v1/auth/otp/verify", async (route) => {
      sent.push({ path: "verify", body: route.request().postDataJSON(), csrf: null });
      // پس از ورود، نشست واردشده است.
      api.set("/api/v1/auth/session", { body: fixture("session-user") });
      api.set("/api/v1/reservations", { body: fixture("reservations-empty") });
      api.set("/api/v1/me/standing", { body: fixture("standing-active") });
      await route.fulfill({
        json: {
          profile: (fixture("session-user") as { profile: unknown }).profile,
          is_new_user: false,
          next_step: "home",
        },
      });
    });
    await page.goto("/");
    const dialog = await openLogin(page, info.project.name === "mobile");
    const phone = dialog.getByLabel("شمارهٔ تلفن همراه");
    await expect(phone).toBeFocused();
    // شمارهٔ نامعتبر ⇒ خطای فوری بدون درخواست
    await phone.fill("۰۹۱۲");
    await dialog.getByRole("button", { name: "دریافت کد یک‌بارمصرف" }).click();
    await expect(dialog.getByRole("alert")).toContainText("معتبر نیست");
    expect(sent).toEqual([]);
    // ارقام فارسی ⇒ نرمال‌شده
    await phone.fill("۰۹۱۲ ۳۴۵ ۶۷۸۹");
    await dialog.getByRole("button", { name: "دریافت کد یک‌بارمصرف" }).click();
    await expect(dialog.getByText("0912 345 6789")).toBeVisible();
    expect(sent[0]).toEqual({ path: "request", body: { phone: "09123456789" }, csrf: "e2e-token" });
    await expect(dialog.getByRole("button", { name: /ارسال دوباره تا/ })).toBeDisabled();
    // تایپ ۵ رقم ⇒ ارسال خودکار
    await dialog.getByLabel("رقم اول").pressSequentially("12345");
    await expect(dialog).toBeHidden();
    expect(sent[1]).toMatchObject({ path: "verify", body: { phone: "09123456789", code: "12345" } });
    await expect(page.getByRole("status").filter({ hasText: "خوش آمدید، زهرا" })).toBeVisible();
    if (info.project.name === "desktop")
      await expect(page.locator("header .account-button")).toHaveAttribute("data-state", "in");
    else
      await expect(
        page.getByRole("navigation", { name: "میان‌بُرها" }).getByRole("button", { name: "حساب من" }),
      ).toBeVisible();
    expect(api.unexpected).toEqual([]);
  });

  test("کد نادرست: پیام سرور، تلاش‌های باقی‌مانده و پاک شدن خانه‌ها", async ({ page, api }, info) => {
    mockLogin(api);
    api.allowConsole(/422/);
    api.set("/api/v1/auth/otp/verify", {
      status: 422,
      body: {
        type: "about:blank",
        title: "x",
        status: 422,
        code: "otp_mismatch",
        detail: "کد وارد‌شده درست نیست.",
        remaining_attempts: 2,
        errors: {},
      },
    });
    await page.goto("/");
    const dialog = await openLogin(page, info.project.name === "mobile");
    await dialog.getByLabel("شمارهٔ تلفن همراه").fill("09123456789");
    await dialog.getByRole("button", { name: "دریافت کد یک‌بارمصرف" }).click();
    await dialog.getByLabel("رقم اول").pressSequentially("99999");
    await expect(dialog.getByRole("alert")).toContainText("کد وارد‌شده درست نیست. ۲ تلاش دیگر باقی است.");
    await expect(dialog.getByLabel("رقم اول")).toHaveValue("");
  });

  test("پیامک خاموش: اطلاع روشن به کاربر", async ({ page, api }, info) => {
    mockLogin(api, { delivery: "blocked" });
    await page.goto("/");
    const dialog = await openLogin(page, info.project.name === "mobile");
    await dialog.getByLabel("شمارهٔ تلفن همراه").fill("09123456789");
    await dialog.getByRole("button", { name: "دریافت کد یک‌بارمصرف" }).click();
    await expect(dialog.getByRole("status").filter({ hasText: "ارسال پیامک" })).toBeVisible();
  });

  test("حساب واردشده: منوی حساب، سفر پیش رو و خروج", async ({ page, api }, info) => {
    api.set("/api/v1/auth/session", { body: fixture("session-user") });
    api.set("/api/v1/reservations", { body: fixture("reservations-upcoming") });
    api.set("/api/v1/me/standing", { body: fixture("standing-active") });
    api.set("/api/v1/auth/csrf", { body: CSRF });
    let loggedOut = false;
    api.set("/api/v1/auth/logout", async (route) => {
      loggedOut = true;
      await route.fulfill({ status: 204 });
    });
    await page.goto("/");
    if (info.project.name === "mobile")
      await page.getByRole("navigation", { name: "میان‌بُرها" }).getByRole("button", { name: "حساب من" }).click();
    else await page.locator("header .account-button").click();
    const panel = page.locator(".account-panel:visible");
    await expect(panel).toContainText("زهرا محمدی");
    await expect(panel).toContainText("0912***4567");
    await expect(panel).toContainText("MHD-7K3Q9");
    // پرتال هنوز ساخته نشده ⇒ اعلان «به‌زودی»، نه رفتن به صفحهٔ قدیمی
    await panel.getByRole("button", { name: /رزروها، گواهی و پیگیری/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "پرتال زائر" })).toBeVisible();
    expect(page.url()).not.toMatch(/\/my\//);
    // اعلان «به‌زودی» منو را نمی‌بندد؛ اگر بسته شده بود دوباره باز می‌شود.
    if (!(await panel.isVisible())) {
      if (info.project.name === "mobile")
        await page.getByRole("navigation", { name: "میان‌بُرها" }).getByRole("button", { name: "حساب من" }).click();
      else await page.locator("header .account-button").click();
    }
    await page.locator(".account-panel:visible").getByRole("button", { name: "خروج از حساب" }).click();
    await expect(page.getByRole("status").filter({ hasText: "از حساب خارج شدید" })).toBeVisible();
    expect(loggedOut).toBe(true);
    await expect(page.getByRole("complementary", { name: "سفر پیش رو" })).toBeHidden();
  });

  test("مهمان: «ادامهٔ رزرو» ورود را همین‌جا باز می‌کند", async ({ page, api }) => {
    await page.goto("/");
    await page.locator('.cell:visible[data-status="free"]:not([disabled])').first().click();
    const unit = page.getByRole("dialog");
    await unit.getByRole("button", { name: /ورود و ادامهٔ رزرو/ }).click();
    await expect(page.getByRole("dialog", { name: "ورود یا ثبت‌نام" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "ورود یا ثبت‌نام" }).getByLabel("شمارهٔ تلفن همراه")).toBeFocused();
    expect(api.unexpected).toEqual([]);
  });
});
