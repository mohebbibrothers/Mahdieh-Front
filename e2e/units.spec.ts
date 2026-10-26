import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-02 «واحدهای اقامتی» — کاتالوگ از ‎/api/v1/property‎ (fixture خانه) و «نزدیک‌ترین شروع آزاد»
 * از ‎/api/v1/calendar/windows‎ (fixture P-04). وضعیت صفحه (سفر، فیلترها، ترتیب، نما و مقایسه)
 * در نشانی است و با بازگشت/اشتراک همان صفحه بازسازی می‌شود.
 */
function windows(api: MockApi, seen: string[] = []) {
  api.set("/api/v1/calendar/windows", async (route: Route) => {
    const q = new URL(route.request().url()).searchParams;
    seen.push(`${q.get("guests")}/${q.get("min_cells")}`);
    await route.fulfill({ json: fixture(Number(q.get("guests")) >= 7 ? "p04/windows-g7" : "p04/windows") });
  });
}

const cards = (page: Page) => page.locator(".up-grid > li.uc:not(.uc--skeleton)");
const compareBtn = (page: Page, i: number) => page.locator(".uc__compare").nth(i);

test.describe("P-02 واحدهای اقامتی", () => {
  test("مهمان: پنج واحد، سربرگ فعال، فیلتر نوع/طبقه در نشانی و پاک‌کردن — بی‌سرریز", async ({ page, api }, info) => {
    test.skip(info.project.name === "mobile", "ستون فیلتر کناری فقط در دسکتاپ؛ گوشی آزمون جدا دارد");
    const seen: string[] = [];
    windows(api, seen);
    await page.goto("/units/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('.site-header a[aria-current="page"]')).toHaveAttribute("href", "/units/");
    await expect(cards(page)).toHaveCount(5);
    await expect(page.locator(".up-count")).toHaveText("۵ واحد");
    // سفر پیش‌فرض: ۴ نفر · دو شبانه‌روز (۴ نیم‌روز)
    await expect.poll(() => seen.at(-1)).toBe("4/4");

    const aside = page.locator(".up-content > .uf");
    await aside.getByRole("button", { name: /سوئیت/ }).click();
    await expect(cards(page)).toHaveCount(2);
    await expect(page).toHaveURL(/[?&]kind=suite/);
    await expect(page.locator(".up-chips")).toBeVisible();

    await aside.getByRole("button", { name: /طبقهٔ دوم/ }).click();
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/[?&]floor=2/);
    await expect(cards(page).first()).toContainText("A2");

    // بازسازی از نشانی (بازگشت/اشتراک)
    await page.reload();
    await expect(cards(page)).toHaveCount(1);

    await aside.getByRole("button", { name: "پاک کردن" }).click();
    await expect(cards(page)).toHaveCount(5);
    await expect(page).not.toHaveURL(/kind=|floor=/);
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("مقایسه: سینی، سقف سه واحد، جدول با ردیف‌های متفاوت و پیش‌انتخاب ‎?cmp‎", async ({ page, api }) => {
    windows(api);
    await page.goto("/units/");
    await expect(cards(page)).toHaveCount(5);

    await compareBtn(page, 0).click();
    await expect(compareBtn(page, 0)).toHaveAttribute("aria-pressed", "true");
    const tray = page.locator(".ucmp-tray");
    await expect(tray).toBeVisible();
    await compareBtn(page, 1).click();
    await compareBtn(page, 2).click();
    await expect(page).toHaveURL(/[?&]cmp=/);
    // سقف سه واحد: چهارمی جایگزین بی‌صدا نمی‌شود؛ پیام راهنما می‌آید
    await compareBtn(page, 3).click();
    await expect(page.getByText(/حداکثر ۳ واحد/)).toBeVisible();
    await expect(compareBtn(page, 3)).toHaveAttribute("aria-pressed", "false");

    await page.locator("#compare-open").click();
    const dlg = page.getByRole("dialog", { name: "مقایسهٔ واحدها" });
    await expect(dlg).toBeVisible();
    await expect(dlg.locator(".ucmp__unit")).toHaveCount(3);
    await expect(dlg.locator(".ucmp__row.is-diff").first()).toBeVisible();
    // حذف یک واحد از درون جدول ⇒ دو ستون
    await dlg
      .getByRole("button", { name: /حذف .* از مقایسه/ })
      .first()
      .click();
    await expect(dlg.locator(".ucmp__unit")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();

    await page.goto("/units/?cmp=B2");
    await expect(page.locator(".ucmp-tray")).toContainText("B2");
  });

  test("نمای سریع: باز شدن با عنوان کارت، افزودن به مقایسه و پیوند تقویم", async ({ page, api }) => {
    windows(api);
    await page.goto("/units/");
    await page.locator(".uc__title").first().click();
    const dlg = page.getByRole("dialog", { name: "سوئیت طبقهٔ اول" });
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText("A1");
    await dlg.getByRole("button", { name: /افزودن به مقایسه/ }).click();
    await expect(page.locator(".ucmp-tray")).toContainText("A1");
    // هیچ پیوندی به صفحهٔ قدیمی ‎/units/<code>/‎ (P-03 هنوز ساخته نشده)
    expect(await page.locator('a[href^="/units/"]:not([href="/units/"]):not([href^="/units/?"])').count()).toBe(0);
  });

  test("گوشی: نوار ابزار چسبان، برگهٔ فیلتر، سفر ۵ نفره و درخواست درست — بی‌سرریز", async ({ page, api }) => {
    const seen: string[] = [];
    windows(api, seen);
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto("/units/");
    await expect(cards(page)).toHaveCount(5);
    expect(await horizontalOverflow(page)).toBeNull();

    await page.locator("#mobile-filter-open").click();
    const sheet = page.getByRole("dialog", { name: "کدام فضا؟" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /اتاق بزرگ/ }).click();
    await sheet.getByRole("button", { name: /نمایش ۳ واحد/ }).click();
    await expect(sheet).toBeHidden();
    await expect(cards(page)).toHaveCount(3);
    await expect(page.locator("#mobile-filter-open .up-badge")).toHaveText("۱");

    // نوار پایینی طرح P-02: «واحدها» زبانهٔ جاری و «زمان سفر» بازکنندهٔ پنجرهٔ سفر
    const dock = page.locator(".mobile-bottom");
    await expect(dock.getByRole("link", { name: "واحدها" })).toHaveAttribute("aria-current", "page");
    await dock.getByRole("button", { name: "زمان سفر" }).click();
    const trip = page.getByRole("dialog", { name: "شرایط سفرتان را بگویید" });
    await trip.getByRole("button", { name: "یک نفر بیشتر" }).click();
    await trip.getByRole("button", { name: "نمایش واحدهای مناسب" }).click();
    await expect(trip).toBeHidden();
    await expect(page).toHaveURL(/[?&]guests=5/);
    await expect.poll(() => seen.at(-1)).toBe("5/4");

    // نوار ابزار پس از پیمایش زیر سربرگ می‌ماند
    await page.mouse.wheel(0, 1400);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const t = document.querySelector(".up-tools")?.getBoundingClientRect();
          const h = document.querySelector(".site-header")?.getBoundingClientRect();
          return t && h ? Math.abs(t.top - h.bottom) < 2 : false;
        }),
      )
      .toBe(true);
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("سفر ۷ نفره: سوئیت‌ها ظرفیت ندارند و صادقانه گفته می‌شود", async ({ page, api }) => {
    windows(api);
    await page.goto("/units/?guests=7");
    await expect(cards(page)).toHaveCount(5);
    const a1 = cards(page).filter({ hasText: "A1" });
    await expect(a1).toContainText(/ظرفیت/);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`دسترس‌پذیری (axe) در تم ${theme === "dark" ? "تیره" : "روشن"}: صفحه و جدول مقایسه`, async ({ page, api }) => {
      windows(api);
      await page.addInitScript((t) => localStorage.setItem("mahdieh-theme", t), theme);
      await page.goto("/units/");
      await expect(cards(page)).toHaveCount(5);
      await page.waitForTimeout(600);
      const scan = () => new AxeBuilder({ page }).exclude("nextjs-portal").analyze();
      expect((await scan()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);

      await compareBtn(page, 0).click();
      await compareBtn(page, 1).click();
      await page.locator("#compare-open").click();
      await expect(page.getByRole("dialog", { name: "مقایسهٔ واحدها" })).toBeVisible();
      await page.waitForTimeout(500);
      expect((await scan()).violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
    });
  }
});
