import AxeBuilder from "@axe-core/playwright";
import type { Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-08 «راهنمای زائر» — همه از ‎/api/v1/help‎ (fixture واقعی بک‌اند: ۶ دسته، ۲۵ پرسش، ۱۴ قاعده، تماس
 * تنظیم‌شده) و ‎/api/v1/prayer-times?days=8‎ (از ۲۸ مهر)؛ ساعت آزمون ۱۳:۵۰ ⇒ وقت پیش‌رو «غروب آفتاب».
 */
const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };

function feedbackApi(api: MockApi, status = 204) {
  const sent: unknown[] = [];
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/help/feedback", async (route: Route) => {
    sent.push(route.request().postDataJSON());
    if (status === 204) return route.fulfill({ status: 204, body: "" });
    return route.fulfill({ status, json: { code: "throttled", detail: "بیش از حد." } });
  });
  return sent;
}

test.describe("P-08 راهنمای زائر", () => {
  test("نوارهای پیمایش گوشی: دکمهٔ بعدی/قبلی فقط هنگام سرریز، تب کلیک‌شده کامل در دید", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "نوار افقی دسته‌ها فقط در عرض گوشی/تبلت");
    await page.goto("/help/");
    const frame = page.locator(".hp-cats-frame");
    const rail = frame.locator(".hp-cats");
    await expect(frame).toHaveAttribute("data-overflow", "true");
    await expect(frame).toHaveAttribute("data-at-start", "true");
    const next = frame.locator(".rail-frame__btn--next");
    const prev = frame.locator(".rail-frame__btn--prev");
    await expect(prev).toBeHidden();
    await next.click();
    await expect.poll(() => rail.evaluate((el) => Math.abs(el.scrollLeft))).toBeGreaterThan(100);
    await expect(prev).toBeVisible();
    await prev.click();
    await expect(frame).toHaveAttribute("data-at-start", "true");

    // تبی که نیمه بیرون است با کلیک کامل به دید می‌آید (از زیر دکمه‌ها هم بیرون)
    const last = frame.getByRole("tab").last();
    await last.click({ force: true });
    await expect(last).toHaveAttribute("aria-selected", "true");
    await expect
      .poll(() =>
        last.evaluate((t) => {
          const r = t.getBoundingClientRect();
          return r.left >= 0 && r.right <= window.innerWidth;
        }),
      )
      .toBe(true);
    await expect(frame).toHaveAttribute("data-at-end", "true");
    await expect(next).toBeHidden();
    // دکمه‌ها کمک موس/لمس‌اند: بیرون از ترتیب Tab و درخت دسترس‌پذیری
    await expect(next).toHaveAttribute("tabindex", "-1");
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("محرم و صفر: نقاره‌خانه خاموش ⇒ پیام احترام به‌جای ساعت‌ها و بی برچسب «آیین سنتی»", async ({ page, api }) => {
    const pt = fixture<{ days: { hijri: string; naqqareh: boolean }[] }>("prayer-times");
    pt.days.forEach((d, i) => {
      d.naqqareh = false;
      d.hijri = `${["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸"][i]} محرم ۱۴۴۹`;
    });
    api.set("/api/v1/prayer-times", { body: pt });
    await page.goto("/help/");
    const today = page.locator(".hp-ritual__today");
    await expect(today).toHaveAttribute("data-silent", "");
    await expect(today).toContainText("نقاره‌خانه در این روزها خاموش است");
    await expect(today).toContainText("محرم ۱۴۴۹");
    await expect(page.locator(".hp-ritual__time")).toHaveCount(0);
    await expect(page.locator(".hp-slot[data-ritual]")).toHaveCount(0);
    await expect(page.locator(".hp-slot").nth(1)).toContainText("آغاز روز");
    await expect(page.locator(".hp-slot").nth(1)).not.toContainText("نقاره");
  });

  test("نمای کامل: سرتیتر، گام‌ها با مقصد درست، قواعد زنده، اوقات شرعی، تماس؛ بی‌سرریز و دسترس‌پذیر", async ({
    page,
  }, info) => {
    await page.goto("/help/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("مرکز راهنمای زائر");
    await expect(page).toHaveTitle(/راهنمای زائر/);
    if (info.project.name !== "mobile") {
      await expect(page.locator('.site-header a[aria-current="page"]')).toHaveAttribute("href", "/help/");
      await expect(page.locator("#hp-search-count")).toHaveText("۲۵ پرسش در دسترس");
    } else {
      await expect(page.locator(".hp-search__caption")).toHaveText("۲۵ پرسش در دسترس");
    }

    const steps = page.locator(".hp-step");
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(1).getByRole("link")).toHaveAttribute("href", "/calendar/");
    await expect(steps.nth(2).getByRole("link")).toHaveAttribute("href", "/units/");
    await expect(steps.nth(3).getByRole("link")).toHaveAttribute("href", "/portal/#stay");
    await expect(steps.nth(0).getByRole("button", { name: "ورود با پیامک" })).toBeVisible();

    await expect(page.locator(".hp-cat")).toHaveCount(7);
    await expect(page.locator(".hp-faq")).toHaveCount(25);
    await expect(page.locator(".hp-rule")).toHaveCount(14);
    await expect(page.locator(".hp-rule").first()).toContainText("نصف روز");

    const slots = page.locator(".hp-slot");
    await expect(slots).toHaveCount(6);
    await expect(page.locator(".hp-slot[data-next]")).toContainText("غروب آفتاب");
    await expect(page.locator(".hp-slot[data-next] .hp-slot__badge")).toHaveText("نوبت بعدی");
    await expect(page.locator(".hp-slot[data-past]")).toHaveCount(3);
    await expect(page.locator(".hp-prayer__next")).toContainText("تا غروب آفتاب");
    await expect(page.locator(".hp-day")).toHaveCount(7);
    await expect(page.locator(".hp-ritual__today")).toContainText("پیش از طلوع");
    await expect(page.locator(".hp-ritual__time time")).toHaveCount(2);
    await expect(page.locator(".hp-prayer__hijri")).toContainText("۹ جمادی‌الاول ۱۴۴۸");

    await expect(page.locator("#contact-desk a[href^='tel:']")).toHaveAttribute("href", "tel:05131234567");
    await expect(page.locator("#contact-desk").getByRole("button", { name: "استعلام گواهی اقامت" })).toBeVisible();
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}") as {
      mainEntity: unknown[];
    };
    expect(ld.mainEntity.length).toBeGreaterThan(3);

    // روز دیگر: وقت پیش‌رو فقط در امروز برجسته است
    await page.locator(".hp-day").nth(2).click();
    await expect(page.locator(".hp-slot[data-next]")).toHaveCount(0);
    await expect(page.locator(".hp-slot[data-past]")).toHaveCount(0);

    expect(await horizontalOverflow(page)).toBeNull();
    // کنتراست روی حالت نشستهٔ صفحه سنجیده می‌شود، نه کارتی که در لبهٔ نما نیمه‌راهِ «ورود تدریجی» است
    await page.emulateMedia({ reducedMotion: "reduce" });
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("جست‌وجو: یکسان‌سازی عربی، برجسته‌سازی، شمار دسته‌ها، نشانی قابل اشتراک و حالت تهی", async ({ page }) => {
    await page.goto("/help/");
    const input = page.getByRole("searchbox", { name: "جست‌وجو در پرسش‌ها و پاسخ‌ها" });
    // داده رسیده و صفحه هیدراته است (نوشتهٔ پیش از هیدراته‌شدن جداگانه در آزمون بعدی سنجیده می‌شود)
    await expect(page.locator("#hp-search-count")).toHaveText("۲۵ پرسش در دسترس");
    await input.fill("كد"); // «ك» عربی
    await expect(page.locator(".hp-faq")).toHaveCount(8);
    await expect(page.locator(".hp-faq mark").first()).toContainText("کد");
    await expect(page.locator("#hp-tab-all .hp-cat__count")).toContainText("۸");
    await expect(page.locator("#hp-search-count")).toHaveText("۸ پاسخ یافت شد");
    await expect(page).toHaveURL(/[?&]q=/);

    await page.locator("#hp-tab-trouble").click();
    await expect(page.locator(".hp-controls__status")).toContainText("در «مشکل و پشتیبانی»");
    await expect(page).toHaveURL(/[?&]cat=trouble/);
    // نشانی قابل اشتراک: بازکردن همان نشانی همان نما را می‌سازد
    await page.reload();
    await expect(input).toHaveValue("كد");
    await expect(page.locator("#hp-tab-trouble")).toHaveAttribute("aria-selected", "true");

    await input.fill("نیم‌روز؟");
    await page.locator("#hp-tab-all").click();
    await expect(page.locator(".hp-faq").first()).toContainText("نیم‌روز");

    await input.fill("xyz");
    await expect(page.locator(".hp-empty")).toBeVisible();
    await page.getByRole("button", { name: /نمایش همهٔ ۲۵ پرسش/ }).click();
    await expect(page.locator(".hp-faq")).toHaveCount(25);
    await expect(input).toHaveValue("");

    // تراشهٔ موضوع ⇒ جست‌وجو؛ کلید «/» ⇒ فوکوس جست‌وجو؛ Escape ⇒ پاک
    await page.locator(".hp-chip", { hasText: "لغو رایگان تا" }).click();
    await expect(input).toHaveValue("لغو");
    await expect(page.locator(".hp-faq")).toHaveCount(7);
    await page.keyboard.press("/");
    await expect(input).toBeFocused();
    await input.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("نوشتهٔ پیش از هیدراته‌شدن گم نمی‌شود (اینترنت کند)", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    // جاوااسکریپت صفحه تا تایپ کاربر نگه داشته می‌شود ⇒ تایپ روی HTML ایستا رخ می‌دهد
    await page.route(/\/_next\/static\/chunks\/.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/help/", { waitUntil: "domcontentloaded" });
    await page.locator(".hp-search__input").fill("کلید");
    release();
    await expect(page.locator("#hp-search-count")).toHaveText("۳ پاسخ یافت شد");
    await expect(page.locator(".hp-faq")).toHaveCount(3);
    await expect(page).toHaveURL(/[?&]q=/);
  });

  test("آکاردئون: پیوند مستقیم ‎#item-slug‎، پرسش مرتبط، باز و بستن همه و زبانه با صفحه‌کلید", async ({ page }) => {
    await page.goto("/help/#item-cancel");
    const card = page.locator("#item-cancel");
    await expect(card.locator(".hp-faq__head")).toHaveAttribute("aria-expanded", "true");
    await expect(card.locator(".hp-faq__answer")).toBeVisible();
    await expect(card.getByRole("link", { name: "رزروهای من" })).toHaveAttribute("href", "/portal/#stay");

    await card.locator(".hp-faq__related a").first().click();
    const related = page.locator("#item-late-cancel");
    await expect(related.locator(".hp-faq__head")).toHaveAttribute("aria-expanded", "true");
    await expect(related.locator(".hp-faq__head")).toBeFocused();

    await page.getByRole("button", { name: "بازکردن همه" }).click();
    await expect(page.locator(".hp-faq[data-open]")).toHaveCount(25);
    await expect(page.getByRole("button", { name: "بازکردن همه" })).toBeDisabled();
    await page.getByRole("button", { name: "بستن همه" }).click();
    await expect(page.locator(".hp-faq[data-open]")).toHaveCount(0);

    await page.locator("#hp-tab-all").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#hp-tab-before")).toBeFocused();
    await expect(page.locator("#hp-tab-before")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".hp-faq")).toHaveCount(4);
    await page.keyboard.press("End");
    await expect(page.locator("#hp-tab-trouble")).toHaveAttribute("aria-selected", "true");
  });

  test("«مفید بود؟»: رأی بی‌نام به سرور، یک بار در هر مرورگر؛ محدودیت نرخ ⇒ پیام و بی‌ثبت", async ({ page, api }) => {
    const sent = feedbackApi(api);
    await page.goto("/help/#item-halfday");
    const card = page.locator("#item-halfday");
    await card.getByRole("button", { name: "بله", exact: true }).click();
    await expect(card.locator(".hp-helpful--done")).toContainText("نظر شما ثبت شد");
    expect(sent).toEqual([{ slug: "halfday", helpful: true }]);
    await page.reload();
    await expect(page.locator("#item-halfday .hp-faq__head")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#item-halfday .hp-helpful--done")).toBeVisible();

    api.set("/api/v1/help/feedback", async (route: Route) =>
      route.fulfill({ status: 429, json: { code: "throttled", detail: "بیش از حد." } }),
    );
    api.allowConsole(/429/);
    const other = page.locator("#item-limits");
    await other.locator(".hp-faq__head").click();
    await other.getByRole("button", { name: "نه", exact: true }).click();
    await expect(page.locator(".toast").last()).toContainText("کمی بعد");
    await expect(other.getByRole("button", { name: "نه", exact: true })).toBeEnabled();
  });

  test("خانه: «راهنمای کامل زائر» به ‎/help/‎ و بی پنجرهٔ تکراری مرکز راهنما", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /راهنمای کامل زائر/ });
    await expect(link).toHaveAttribute("href", "/help/");
    // «پرسش دیگری دارید؟» دیگر پنجرهٔ تکراری باز نمی‌کند؛ همان پیوند صفحهٔ کامل است
    await expect(page.locator("button.faq-link")).toHaveCount(0);
  });
});
