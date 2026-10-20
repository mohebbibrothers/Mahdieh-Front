import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { NOW, expect, fixture, horizontalOverflow, test } from "./support/fixtures";

const cells = (page: Page) => page.locator(".cell:visible");

test.describe("P-01 صفحهٔ خانه", () => {
  test("با دادهٔ واقعی API کامل رندر می‌شود", async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("اقامتی با آرامش");
    // تاریخ هیرو = نخستین سانس قابل رزرو، با ساعت واقعی شروع از بک‌اند
    await expect(page.getByText(/سه‌شنبه، ۲۸ مهر · شب، از ساعت ۲۰:۰۰/)).toBeVisible();
    await expect(cells(page).first()).toBeVisible();
    // درخواست‌ها: نشست بی‌۴۰۱ و تقویم با پارامتر روزها
    expect(api.calls).toContain("GET /api/v1/auth/session");
    expect(api.calls.some((c) => c.startsWith("GET /api/v1/calendar?days="))).toBe(true);
    expect(api.calls.some((c) => c.startsWith("GET /api/v1/me"))).toBe(false);
  });

  test("سانس آغازشده و سانسِ داخل حداقل فاصلهٔ ثبت غیرفعال‌اند", async ({ page, api }, info) => {
    test.skip(info.project.name !== "desktop", "شبکهٔ هفتگی فقط در دسکتاپ");
    await page.goto("/");
    const today = page.locator(".week-grid .week-grid__row").nth(1).locator(".cell");
    await expect(today.nth(0)).toBeDisabled();
    await expect(today.nth(0)).toHaveAttribute("aria-label", /آغاز شده/);
    await expect(today.nth(1)).toBeEnabled(); // شب، ۲۰:۰۰ — بیش از ۲ ساعت مانده
    // ۱۸:۳۰: شب هنوز آزاد است ولی کمتر از ۲ ساعت مانده
    await page.clock.setFixedTime(new Date("2026-10-20T18:30:00+03:30"));
    await page.reload();
    await expect(today.nth(1)).toBeDisabled();
    await expect(today.nth(1)).toHaveAttribute("aria-label", /کمتر از ۲ ساعت/);
    expect(api.unexpected).toEqual([]);
  });

  test("وضعیت تعمیر و مناسبت تقویمی نمایش داده می‌شود", async ({ page, api }, info) => {
    test.skip(info.project.name !== "desktop", "شبکهٔ هفتگی فقط در دسکتاپ");
    await page.goto("/");
    await expect(page.locator('.week-grid .cell[data-status="blocked"]')).toHaveCount(1);
    await expect(page.locator('.week-grid .cell[data-status="blocked"]')).toHaveAttribute(
      "aria-label",
      /تعمیر و نگهداری، تعمیر سرمایش/,
    );
    await expect(page.locator(".day-head__occasion")).toContainText("مناسبت نمونهٔ آزمون");
    expect(api.calls.some((c) => c === "GET /api/v1/occasions?from=2026-10-20&to=2026-11-03")).toBe(true);
  });

  test("انتخاب خانهٔ آزاد، پنجرهٔ واحد را باز می‌کند؛ مهمان بی‌درخواست quote", async ({ page, api }) => {
    await page.goto("/");
    const free = page.locator('.cell:visible[data-status="free"]:not([disabled])').first();
    await free.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/طبقهٔ/);
    expect(api.calls.some((c) => c.includes("reservations/quote"))).toBe(false);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("تم شب روی html و body، ماندگار پس از بارگذاری دوباره", async ({ page, api }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /ظاهر سایت/ }).click();
    await page.getByRole("button", { name: /^شب/ }).click();
    for (const el of ["html", "body"]) await expect(page.locator(el)).toHaveAttribute("data-theme", "dark");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#132823");
    await page.reload();
    for (const el of ["html", "body"]) await expect(page.locator(el)).toHaveAttribute("data-theme", "dark");
    // در تم شب هیچ زمینهٔ سفید خامی نباید باشد (یادداشت ۲ طراح)
    const white = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => el.checkVisibility() && getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)")
        .map((el) => `${el.tagName}.${el.className}`),
    );
    expect(white).toEqual([]);
    expect(api.unexpected).toEqual([]);
  });

  test("سرصفحهٔ موبایل: دکمهٔ حساب پنهان و دقیقاً سه دکمهٔ گرد", async ({ page, api }, info) => {
    test.skip(info.project.name !== "mobile", "قانون ≤۹۰۰ پیکسل");
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header.locator(".account-button")).toBeHidden();
    await expect(header.locator(".icon-button:visible")).toHaveCount(3);
    expect(api.unexpected).toEqual([]);
  });

  test("کاربر واردشده: «رزروهای من» و بنر سفر پیش رو", async ({ page, api }) => {
    api.set("/api/v1/auth/session", { body: fixture("session-user") });
    api.set("/api/v1/reservations", { body: fixture("reservations-upcoming") });
    api.set("/api/v1/me/standing", { body: fixture("standing-active") });
    await page.goto("/");
    const account = page.locator("header .account-button");
    if (test.info().project.name === "desktop") await expect(account).toHaveAttribute("data-state", "in");
    const trip = page.getByRole("complementary", { name: "سفر پیش رو" });
    await expect(trip).toContainText("MHD-7K3Q9");
    await expect(trip).toContainText("سوئیت طبقهٔ دوم");
    expect(api.calls).toContain("GET /api/v1/reservations?scope=upcoming");
  });

  test("کاربر واردشده بی‌سفر، با مانع رزرو: بنر هشدار با پیام بک‌اند", async ({ page, api }) => {
    api.set("/api/v1/auth/session", { body: fixture("session-user") });
    api.set("/api/v1/reservations", { body: fixture("reservations-empty") });
    api.set("/api/v1/me/standing", { body: fixture("standing-cooldown") });
    await page.goto("/");
    const banner = page.getByRole("complementary", { name: "وضعیت رزرو شما" });
    await expect(banner).toContainText("لغو دیرهنگام");
    await expect(banner.getByRole("button", { name: /مشاهدهٔ وضعیت/ })).toBeVisible();
  });

  test("خطای تقویم: پیام قابل‌فهم و «تلاش دوباره» بازیابی می‌کند", async ({ page, api }) => {
    let fail = true;
    api.set("/api/v1/calendar", async (route) =>
      fail
        ? route.fulfill({ status: 503, json: { detail: "maintenance" } })
        : route.fulfill({ status: 200, json: fixture("calendar") }),
    );
    // خطای شبکهٔ عمدی در کنسول مرورگر هم لاگ می‌شود؛ فقط همین را مجاز می‌کنیم.
    api.allowConsole(/Failed to load resource: the server responded with a status of 503/);
    await page.goto("/");
    const alert = page.getByRole("alert").filter({ hasText: "تقویم دریافت نشد" });
    // react-query پیش از اعلام خطا با عقب‌نشینی نمایی دوباره می‌کوشد؛ ساعت را جلو می‌بریم
    // تا آزمون به زمان واقعی و بار ماشین وابسته نباشد.
    await expect(async () => {
      await page.clock.runFor(5_000);
      await expect(alert).toBeVisible({ timeout: 250 });
    }).toPass({ timeout: 20_000 });
    fail = false;
    await alert.getByRole("button", { name: /تلاش دوباره/ }).click();
    await expect(alert).toBeHidden();
    await expect(cells(page).first()).toBeVisible();
  });
});

test.describe("ورود درون‌برنامه‌ای (بدون صفحهٔ قدیمی)", () => {
  test("شماره ⇐ کد (اشتباه، سپس درست) ⇐ تکمیل پروفایل ⇐ «حساب من»", async ({ page, api }, info) => {
    type Session = { authenticated: boolean; mfa_pending: boolean; profile: Record<string, unknown> | null };
    const user = fixture<Session>("session-user");
    const incomplete = { ...user.profile, first_name: "", last_name: "", display_name: "", is_profile_complete: false };
    const sent: Record<string, unknown>[] = [];
    let csrfHeader: string | null = null;
    api.allowConsole(/status of 422/);
    api.set("/api/v1/auth/csrf", { body: { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" } });
    api.set("/api/v1/reservations", { body: fixture("reservations-empty") });
    api.set("/api/v1/me/standing", { body: fixture("standing-active") });
    api.set("/api/v1/auth/otp/request", async (route) => {
      sent.push(route.request().postDataJSON() as Record<string, unknown>);
      csrfHeader = route.request().headers()["x-csrftoken"] ?? null;
      await route.fulfill({ status: 202, json: { expires_in: 120, resend_after: 60, delivery_status: "suppressed" } });
    });
    api.set("/api/v1/auth/otp/verify", async (route) => {
      const body = route.request().postDataJSON() as { phone: string; code: string };
      if (body.code !== "12345") {
        return route.fulfill({
          status: 422,
          json: { code: "otp_mismatch", detail: "کد وارد‌شده درست نیست.", remaining_attempts: 4 },
        });
      }
      api.set("/api/v1/auth/session", { body: { ...user, profile: incomplete } });
      return route.fulfill({ json: { profile: incomplete, is_new_user: true, next_step: "complete_profile" } });
    });
    api.set("/api/v1/me/profile", async (route) => {
      sent.push(route.request().postDataJSON() as Record<string, unknown>);
      api.set("/api/v1/auth/session", { body: user });
      await route.fulfill({ json: user.profile });
    });

    await page.goto("/");
    const opener =
      info.project.name === "mobile"
        ? page.getByRole("navigation", { name: "میان‌بُرها" }).getByRole("button", { name: "حساب" })
        : page.getByRole("button", { name: "ورود / ثبت‌نام" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "ورود یا ثبت‌نام" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "دریافت کد ورود" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("شمارهٔ تلفن همراه را وارد کنید.");
    expect(sent).toHaveLength(0);

    await dialog.getByLabel("شمارهٔ تلفن همراه").fill("۰۹۱۲ ۳۴۵ ۶۷۸۹");
    await dialog.getByRole("button", { name: "دریافت کد ورود" }).click();
    const codeDialog = page.getByRole("dialog", { name: "کد تأیید" });
    await expect(codeDialog).toBeVisible();
    expect(sent[0]).toEqual({ phone: "+989123456789" });
    expect(csrfHeader).toBe("e2e-token");
    // پیامک خاموش است ⇒ پیام صادقانه، نه «کد ارسال شد»
    await expect(codeDialog.getByRole("status")).toContainText("خاموش است");
    await expect(codeDialog.getByText("+98 912 345 6789")).toBeVisible();

    const otp = codeDialog.getByRole("textbox", { name: "کد پنج رقمی" });
    await otp.fill("11111");
    await expect(codeDialog.getByRole("alert")).toContainText("چهار بار دیگر");
    await otp.fill("۱۲۳۴۵");

    const profileDialog = page.getByRole("dialog", { name: "مشخصات سرپرست زائران" });
    await expect(profileDialog).toBeVisible();
    await profileDialog.getByRole("button", { name: "ذخیره و ادامه" }).click();
    await expect(profileDialog.getByText("کد ملی ۱۰ رقمی معتبر نیست؛ دوباره بررسی کنید.")).toBeVisible();
    expect(sent).toHaveLength(1);

    await profileDialog.getByRole("textbox", { name: /^نام\s*\*?$/ }).fill("زهرا");
    await profileDialog.getByRole("textbox", { name: /^نام خانوادگی\s*\*?$/ }).fill("محمدی");
    await profileDialog.getByRole("textbox", { name: /^کد ملی/ }).fill("۰۴۹۹۳۷۰۸۹۹");
    const province = profileDialog.getByRole("combobox", { name: /استان/ });
    await province.fill("تهران");
    await expect(profileDialog.getByRole("option", { name: "تهران" })).toBeVisible();
    await province.press("Enter");
    await expect(province).toHaveValue("تهران");
    await profileDialog.getByRole("textbox", { name: /^شهر\s*\*?$/ }).fill("تهران");
    await profileDialog.getByRole("button", { name: "ذخیره و ادامه" }).click();

    await expect(profileDialog).toBeHidden();
    expect(sent[1]).toMatchObject({
      first_name: "زهرا",
      last_name: "محمدی",
      nationality: "IR",
      province: "tehran",
      national_id: "0499370899",
      passport_number: "",
      city: "تهران",
    });
    if (info.project.name === "desktop") {
      await expect(page.getByRole("button", { name: /^حساب من/ })).toBeVisible();
    }
  });
});

test.describe("کیفیت سراسری", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`دسترس‌پذیری axe بدون خطای جدی (${theme})`, async ({ page, api }) => {
      test.slow(); // ممیزی کامل DOM روی ماشین ۲ هسته‌ای CI
      await page.addInitScript((t) => localStorage.setItem("mahdieh-theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await expect(cells(page).first()).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        // runOnly صریح درون options (‎.options()‎ گزینه‌های withTags را بازنویسی می‌کند).
        // فقط تخلف‌ها: هزاران نتیجهٔ «قبول» جدول دسکتاپ را بی‌دلیل منتقل نکن (علت کندی/ناپایداری).
        .options({
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
          resultTypes: ["violations"],
          // WCAG 2.5.3 «برچسب در نام» در axe آزمایشی است و با runOnly برچسبی اجرا نمی‌شود؛ صریحاً روشن.
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
      expect(api.unexpected).toEqual([]);
    });
  }

  test("بدون سرریز افقی", async ({ page, api }) => {
    await page.goto("/");
    await expect(cells(page).first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await horizontalOverflow(page)).toBeNull();
    expect(api.unexpected).toEqual([]);
  });

  test("صفحهٔ ۴۰۴ اختصاصی با راه بازگشت", async ({ page, api }) => {
    api.allowConsole(/Failed to load resource: the server responded with a status of 404/);
    const response = await page.goto("/no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /صفحهٔ نخست|خانه/ }).first()).toBeVisible();
    expect(api.unexpected).toEqual([]);
  });

  test("ساعت آزمون همان لحظهٔ fixtureهاست", async () => {
    expect(fixture<{ days: Array<{ day: string }> }>("calendar").days[0]?.day).toBe("2026-10-20");
    expect(NOW.toISOString()).toBe("2026-10-20T10:20:00.000Z");
  });
});
