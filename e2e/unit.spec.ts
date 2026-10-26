import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-03 «جزئیات واحد» — یک قالب ایستا برای همهٔ واحدها (‎/units/[code]/‎)؛ جزئیات از
 * ‎/api/v1/units/{code}‎، نیم‌روزها از ‎/api/v1/calendar‎ (fixture خانه: A1 در ۲۹ مهر رزروشده،
 * ۳۰ مهر روز «غیرقابل‌رزرو»، ۱ تا ۳ آبان آزاد) و «نزدیک‌ترین شروع» از ‎/calendar/windows‎.
 */
function unitApi(api: MockApi, seen: string[] = []) {
  api.set("/api/v1/calendar/windows", async (route: Route) => {
    await route.fulfill({ json: fixture("p04/windows") });
  });
  for (const code of ["A1", "B1"]) {
    api.set(`/api/v1/units/${code}`, async (route: Route) => {
      seen.push(code);
      await route.fulfill({ json: fixture(`p03/unit-${code}`) });
    });
  }
}

const FREE_TRIP = "/units/A1/?day=2026-10-23&period=day&cells=2&guests=4";
const panelCta = (page: Page) => page.locator(".ud-layout .ud-panel__cta");

test.describe("P-03 جزئیات واحد", () => {
  test("بازهٔ آزاد: عنوان، جدول هفته با بازهٔ برجسته، پنل رایگان و تحویل به صدور رزرو", async ({ page, api }, info) => {
    test.skip(info.project.name === "mobile", "پنل کناری فقط در دسکتاپ؛ گوشی آزمون جدا دارد");
    unitApi(api);
    await page.goto(FREE_TRIP);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سوئیت طبقهٔ اول");
    await expect(page).toHaveTitle(/سوئیت طبقهٔ اول/);
    await expect(page.locator(".ud-crumbs [aria-current='page']")).toHaveText("سوئیت طبقهٔ اول");
    // «واحدها» در سربرگ جاری است (صفحهٔ واحد زیرمجموعهٔ واحدهاست)
    await expect(page.locator('.site-header a[aria-current="page"]')).toHaveAttribute("href", "/units/");

    const week = page.locator(".ud-week");
    await expect(week.locator("tbody tr")).toHaveCount(2);
    await expect(week.locator("thead th")).toHaveCount(8);
    await expect(week.locator(".ud-slot[data-selected]")).toHaveCount(2);
    await expect(week.locator(".ud-slot[data-start]")).toHaveCount(1);
    await expect(week.locator(".ud-slot[data-conflict]")).toHaveCount(0);

    await expect(page.locator(".ud-layout .ud-panel__feedback")).toHaveAttribute("data-tone", "free");
    await expect(panelCta(page)).toHaveText(/ادامه با این انتخاب/);
    await panelCta(page).click();
    const dialog = page.getByRole("dialog", { name: "این بازه آزاد است" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("کاملاً رایگان");
    const go = dialog.getByRole("link", { name: /ورود با شمارهٔ همراه و ادامه/ });
    await expect(go).toHaveAttribute("href", /^\/booking\/\?unit=A1&day=2026-10-23&period=day&cells=2&guests=4$/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    expect(await horizontalOverflow(page)).toBeNull();
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("آغاز ناآزاد: تعارض، پیشنهاد نزدیک‌ترین شروع و انتخاب از جدول در نشانی", async ({ page, api }, info) => {
    test.skip(info.project.name === "mobile", "جدول هفت‌روزه فقط در دسکتاپ");
    unitApi(api);
    await page.goto("/units/A1/?day=2026-10-21&period=day&cells=2&guests=4");

    const week = page.locator(".ud-week");
    await expect(week.locator(".ud-slot[data-conflict]").first()).toBeVisible();
    await expect(panelCta(page)).toHaveText(/بازهٔ دیگری بررسی کنیم/);
    await expect(page.locator(".ud-layout .ud-nearest").first()).toBeVisible();

    // ۱ آبان (۲۳ اکتبر)، روز: آزاد ⇒ بازهٔ تازه بی‌تعارض و در نشانی
    await week.locator(".ud-slot[data-col='2'][data-row='0']").click();
    await expect(page).toHaveURL(/[?&]day=2026-10-23&period=day/);
    await expect(week.locator(".ud-slot[data-conflict]")).toHaveCount(0);
    // هفته زیر نشانگر جابه‌جا نمی‌شود: همان ستون حالا آغاز بازه است
    await expect(week.locator(".ud-slot[data-col='2'][data-row='0']")).toHaveAttribute("data-start", "true");
    await expect(panelCta(page)).toHaveText(/ادامه با این انتخاب/);

    // جابه‌جایی با صفحه‌کلید (راست‌به‌چپ: ArrowLeft ⇒ روز بعد)
    await week.locator(".ud-slot[data-start]").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(week.locator(".ud-slot[data-col='3'][data-row='0']")).toBeFocused();
  });

  test("تغییر واحد بی‌بارگذاری دوباره: شرایط سفر حفظ و «بازگشت» واحد قبلی", async ({ page, api }) => {
    const seen: string[] = [];
    unitApi(api, seen);
    await page.goto(FREE_TRIP);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سوئیت طبقهٔ اول");

    await page.getByRole("button", { name: "واحد دیگری ببینم" }).click();
    const dialog = page.getByRole("dialog", { name: "تغییر واحد" });
    await expect(dialog.getByRole("link")).toHaveCount(5);
    await expect(dialog.locator("a[aria-current='page']")).toContainText("A1");
    await dialog.getByRole("link", { name: /B1/ }).click();

    await expect(page).toHaveURL(/\/units\/B1\/\?day=2026-10-23&period=day&cells=2&guests=4$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("اتاق بزرگ طبقهٔ اول");
    expect(seen).toContain("B1");
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سوئیت طبقهٔ اول");
  });

  test("رسانه: نمای فضا ⇄ پلان شماتیک، نمایش بزرگ و توضیح امکان", async ({ page, api }) => {
    unitApi(api);
    await page.goto("/units/A1/");
    const tabs = page.getByRole("tablist", { name: "نمای واحد" });
    await expect(tabs.getByRole("tab")).toHaveCount(2); // بی‌عکس ⇒ زبانهٔ «تصاویر» نیست
    await tabs.getByRole("tab", { name: "پلان شماتیک" }).click();
    await expect(tabs.getByRole("tab", { name: "پلان شماتیک" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#ud-media-caption")).toContainText("بدون مقیاس");

    await page.getByRole("button", { name: "نمایش بزرگ" }).click();
    const gallery = page.getByRole("dialog", { name: "سوئیت طبقهٔ اول" });
    await expect(gallery).toBeVisible();
    await gallery.getByRole("button", { name: "بزرگ‌نمایی" }).click();
    await expect(gallery.locator(".ud-gallery__stage")).toHaveClass(/is-zoomed/);
    await gallery.getByRole("button", { name: "بستن نمایش بزرگ" }).click();
    await expect(gallery).toBeHidden();

    await page.locator(".ud-feature", { hasText: "آشپزخانه" }).click();
    const info = page.getByRole("dialog", { name: /آشپزخانه/ });
    await expect(info).toContainText("از امکانات ثبت‌شدهٔ سوئیت طبقهٔ اول");
  });

  test("کد ناموجود: صفحهٔ «پیدا نشد» با فهرست واحدهای فعال", async ({ page, api }) => {
    unitApi(api);
    api.set("/api/v1/units/ZZ9", { status: 404, body: { detail: "یافت نشد." } });
    api.allowConsole(/404/);
    await page.goto("/units/ZZ9/");
    await expect(page.getByRole("heading", { level: 1, name: "این واحد پیدا نشد" })).toBeVisible();
    await expect(page.locator(".ud-state__units a")).toHaveCount(5);
    await expect(page).toHaveTitle(/واحد پیدا نشد/);
  });

  test("گوشی: نوار رزرو بالای زبانه‌ها، روزمحور و پنجرهٔ کامل وضعیت", async ({ page, api }, info) => {
    test.skip(info.project.name !== "mobile", "فقط گوشی");
    unitApi(api);
    await page.goto(FREE_TRIP);
    const cta = page.locator(".ud-cta");
    await expect(cta).toBeVisible();
    await expect(page.locator(".ud-layout > .ud-panel")).toBeHidden();
    await expect(page.locator(".ud-week-wrap")).toBeHidden();
    await expect(page.locator(".ud-days button")).toHaveCount(7);
    await expect(page.locator(".ud-day-slots .ud-slot")).toHaveCount(2);

    const dock = await page.locator(".mobile-bottom").boundingBox();
    const bar = await cta.boundingBox();
    expect(dock && bar && Math.abs(bar.y + bar.height - dock.y)).toBeLessThan(2);

    await cta.locator(".ud-cta__summary").click();
    const sheet = page.getByRole("dialog", { name: "رزرو همین واحد" });
    await expect(sheet).toBeVisible();
    await expect(sheet.locator(".ud-panel__cta")).toHaveText(/ادامه با این انتخاب/);
    expect(await horizontalOverflow(page)).toBeNull();
  });
});
