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
    const stage = gallery.locator(".ud-gallery__stage");
    const img = stage.locator(".ud-zoom__img");
    await expect(stage).toHaveAttribute("data-zoomed", "false");
    await gallery.getByRole("button", { name: "بزرگ‌نمایی", exact: true }).click();
    await expect(stage).toHaveAttribute("data-zoomed", "true");
    await expect(gallery.locator(".ud-gallery__pct")).toContainText("۱۵۰٪");
    await expect(stage.locator(".ud-zoom__map")).toBeVisible();
    // کشیدن ⇒ جابه‌جایی واقعی تا لبه (نه بیشتر)؛ گوشهٔ تصویر دیدنی می‌شود
    await page.waitForTimeout(350);
    const box = await stage.boundingBox();
    if (!box) throw new Error("صحنه اندازه ندارد");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 600, box.y + box.height / 2 + 600, { steps: 8 });
    await page.mouse.up();
    const moved = await img.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform));
    expect(moved.e).toBeGreaterThan(0);
    const limit = await stage.evaluate((el) => {
      const pic = el.querySelector<HTMLImageElement>(".ud-zoom__img");
      if (!pic) return 0;
      const ratio = pic.naturalWidth / pic.naturalHeight;
      const fitW = Math.min(el.clientWidth, el.clientHeight * ratio);
      return (fitW * 1.5 - el.clientWidth) / 2;
    });
    expect(moved.e).toBeLessThanOrEqual(Math.max(0, limit) + 1);
    // صفر ⇒ اندازهٔ عادی؛ دوبار-کلیک ⇒ بزرگ‌نمایی در همان نقطه
    await stage.press("0");
    await expect(stage).toHaveAttribute("data-zoomed", "false");
    await stage.dblclick({ position: { x: 40, y: 40 } });
    await expect(stage).toHaveAttribute("data-zoomed", "true");
    await expect(gallery.locator(".ud-gallery__pct")).toContainText("۲۵۰٪");
    await gallery.getByRole("button", { name: "بستن نمایش بزرگ" }).click();
    await expect(gallery).toBeHidden();

    await page.locator(".ud-feature", { hasText: "آشپزخانه" }).click();
    const info = page.getByRole("dialog", { name: /آشپزخانه/ });
    await expect(info).toContainText("از امکانات ثبت‌شدهٔ سوئیت طبقهٔ اول");
    // نشانه کنار متن، نه سطری جدا بالای آن
    const head = await info.locator(".ud-explain__head").evaluate((el) => {
      const iconEl = el.querySelector<HTMLElement>(".ud-explain__icon");
      const icon = iconEl?.getBoundingClientRect();
      const text = el.querySelector("p")?.getBoundingClientRect();
      return icon && text
        ? { iconW: iconEl?.offsetWidth, sameRow: icon.top < text.bottom && text.top < icon.bottom }
        : null;
    });
    expect(head).toEqual({ iconW: 40, sameRow: true });
  });

  test("جملهٔ معرفی از سرور، کلید «تاریخم قطعی نیست» و پنل چسبان در حالت آسان", async ({ page, api }, info) => {
    test.skip(info.project.name === "mobile", "پنل چسبان فقط لپ‌تاپ/رومیزی؛ گوشی نوار پایینی دارد");
    unitApi(api);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/units/A1/");
    await expect(page.locator(".ud-band .ud-eyebrow")).toHaveText("حریمی دنج و خانوادگی، برای آسودن میان زیارت‌ها");

    await page.locator(".ud-layout .ud-trip").click();
    const trip = page.getByRole("dialog");
    const flex = trip.getByRole("switch", { name: /تاریخم قطعی نیست/ });
    // بی تاریخ در نشانی ⇒ «قطعی نیست» روشن؛ لمس هر جای کاشی کلید را جابه‌جا می‌کند
    await expect(flex).toBeChecked();
    await expect(trip.locator(".ut-days")).toBeHidden();
    await trip.locator(".ut-flex").click({ position: { x: 60, y: 20 } });
    await expect(flex).not.toBeChecked();
    await expect(trip.locator(".ut-days")).toBeVisible();
    await flex.press("Space");
    await expect(flex).toBeChecked();
    await page.keyboard.press("Escape");

    // پنل رزرو هنگام اسکرول کنار محتوا می‌ماند — حتی در حالت آسان
    for (const easy of [false, true]) {
      if (easy) {
        await page.locator(".easy-toggle:visible").click();
        await expect(page.locator(".ud--easy")).toBeVisible();
      }
      await page.locator("#ud-availability").scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(250);
      const top = await page.locator(".ud-layout > .ud-panel").evaluate((el) => el.getBoundingClientRect().top);
      const header = await page.evaluate(
        () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0,
      );
      expect(top).toBeGreaterThanOrEqual(header);
      expect(top).toBeLessThan(header + 40);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
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
