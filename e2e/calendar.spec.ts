import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-04 «تقویم موجودی و کشف زمان‌های آزاد» — ماتریس ‎/api/v1/calendar‎ همان fixture ضبط‌شدهٔ خانه است
 * (۲۱ روز از ۲۸ مهر) و «کشف سریع» با تابع واقعی بک‌اند (‎first_free_windows‎) روی همان داده ساخته شده
 * (‎e2e/fixtures/p04‎). لحظهٔ آزمون: سه‌شنبه ۲۸ مهر ۱۴۰۵، ساعت ۱۳:۵۰ ⇒ نخستین سانس قابل ثبت: شب همان روز.
 */
const p04 = <T = unknown>(name: string) => fixture<T>(`p04/${name}`);
const p05 = <T = unknown>(name: string) => fixture<T>(`p05/${name}`);
type Json = Record<string, unknown>;
type Calendar = { days: Array<{ day: string }> } & Json;

const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };

/** ‎/calendar?from&days‎ ⇒ برش همان بازه از fixture (مثل بک‌اند؛ نه یک پاسخ ثابت برای همه). */
function calendarRange(api: MockApi) {
  const full = fixture<Calendar>("calendar");
  api.set("/api/v1/calendar", async (route: Route) => {
    const q = new URL(route.request().url()).searchParams;
    const from = q.get("from") ?? full.days[0]?.day ?? "";
    const days = Number(q.get("days") ?? 14);
    const start = Math.max(
      0,
      full.days.findIndex((d) => d.day >= from),
    );
    await route.fulfill({ json: { ...full, days: full.days.slice(start, start + days) } });
  });
}

/** ‎/calendar/windows‎ ⇒ ۷ نفر: سوئیت‌ها (ظرفیت ۶) بی‌بازه؛ در غیر این صورت پاسخ ۲ نفره. */
function windows(api: MockApi, seen: string[] = []) {
  api.set("/api/v1/calendar/windows", async (route: Route) => {
    const q = new URL(route.request().url()).searchParams;
    seen.push(`${q.get("guests")}/${q.get("min_cells")}`);
    await route.fulfill({ json: p04(Number(q.get("guests")) >= 7 ? "windows-g7" : "windows") });
  });
}

function signedIn(api: MockApi) {
  api.set("/api/v1/auth/session", { body: p05("session-complete") });
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/me/standing", { body: p05("standing-ok") });
  api.set("/api/v1/reservations/quote", { body: p05("quote-ok") });
}

/** خانهٔ ماتریس: واحد، روز ISO و نوع سانس (نام دسترس‌پذیر کامل از متن دیداری + زمینهٔ پنهان می‌آید). */
const slot = (page: Page, unit: string, day: string, kind: "day" | "night") =>
  page.locator(`.cp-matrix .cp-slot[data-unit="${unit}"][data-day="${day}"][data-kind="${kind}"]`);
const drawer = (page: Page) => page.locator(".cp-drawer");

test.describe("P-04 تقویم موجودی", () => {
  test.beforeEach(({ api }) => {
    calendarRange(api);
    windows(api);
  });

  test("مهمان: ماتریس ۱۴ روزه، آمار، کشف سریع و درخواست‌های درست — بی‌سرریز", async ({ page, api }) => {
    await page.goto("/calendar/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تقویم موجودی و کشف زمان‌های آزاد");
    await expect(page.getByRole("heading", { level: 2, name: /۲۸ مهر تا ۱۱ آبان/ })).toBeVisible();
    // ۱۴ روز × ۵ واحد × ۲ سانس
    await expect(page.locator(".cp-matrix .cp-slot")).toHaveCount(140);
    await expect(page.locator(".cp-tag--today")).toHaveText("امروز");
    // سانس روزِ امروز آغاز شده ⇒ بسته؛ شبِ امروز (پس از ۲ ساعت مهلت) آزاد
    await expect(slot(page, "B1", "2026-10-20", "day")).toHaveAttribute("aria-disabled", "true");
    await expect(slot(page, "B1", "2026-10-20", "night")).toHaveAttribute("data-state", "free");
    // نام دسترس‌پذیر: زمینهٔ پنهان + متن دیداری پیوسته «شب آزاد» + ساعت و دلیل (WCAG 2.5.3)
    await expect(slot(page, "B1", "2026-10-20", "night")).toHaveAccessibleName(
      "B1، سه‌شنبه ۲۸ مهر، شب آزاد — سانس شبانه ۲۰:۰۰ تا ۰۸:۰۰؛ آزاد و قابل رزرو",
    );
    await expect(slot(page, "A1", "2026-10-21", "day")).toHaveAttribute("data-state", "occupied");
    await expect(slot(page, "A1", "2026-10-22", "day")).toHaveAttribute("data-state", "blocked");
    // کشف سریع: یک کارت برای هر واحد، از پاسخ واقعی ‎first_free_windows‎
    const cards = page.locator(".cp-dcard");
    await expect(cards).toHaveCount(5);
    await expect(cards.filter({ hasText: "A1" })).toContainText("پنجشنبه ۳۰ مهر");
    await expect(cards.filter({ hasText: "A1" })).toContainText("سانس شب · از ساعت ۲۰:۰۰");
    expect(api.calls).toContain("GET /api/v1/calendar?from=2026-10-20&days=14");
    expect(api.calls).toContain("GET /api/v1/calendar/windows?guests=2&min_cells=2");
    // مهمان ⇒ هیچ درخواست شخصی یا نوشتنی
    expect(api.calls.filter((c) => /\/me\/|\/waitlist|^POST/.test(c))).toEqual([]);
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("انتخاب سالم: کشو، نشانی قابل اشتراک و پیوند صدور رزرو با همان پارامترها", async ({ page }) => {
    await page.goto("/calendar/");
    await slot(page, "B1", "2026-10-21", "day").click();
    await expect(slot(page, "B1", "2026-10-21", "day")).toHaveAttribute("aria-pressed", "true");
    await expect(slot(page, "B1", "2026-10-21", "night")).toHaveAttribute("data-sel", /.+/);
    await expect(drawer(page)).toContainText("همهٔ نیم‌روزهای این بازه آزادند");
    await expect(drawer(page)).toContainText("یک شبانه‌روز");
    const cta = drawer(page).getByRole("link", { name: /ادامه و ثبت مشخصات زائر/ });
    await expect(cta).toHaveAttribute("href", /^\/booking\/\?unit=B1&/);
    const href = new URL((await cta.getAttribute("href")) ?? "", "http://x");
    expect(Object.fromEntries(href.searchParams)).toMatchObject({ day: "2026-10-21", period: "day", cells: "2" });
    // انتخاب در نشانی می‌ماند (بازگشت از P-05 همان‌جا را باز می‌کند)
    await expect(page).toHaveURL(/pick=B1/);
    // افزودن نیم‌روز ⇒ طول اقامت و پیوند به‌روز
    await drawer(page).getByRole("button", { name: "افزودن یک نیم‌روز" }).click();
    await expect(cta).toHaveAttribute("href", /cells=3/);
    // انصراف ⇒ کشو بسته و انتخاب پاک
    await drawer(page).getByRole("button", { name: "انصراف" }).click();
    await expect(drawer(page)).toHaveCount(0);
    await expect(page).not.toHaveURL(/pick=/);
  });

  test("تداخل: نیم‌روز پُر در بازه ⇒ ثبت بسته، جایگزین‌های نزدیک و مسیر صف انتظار", async ({ page }) => {
    await page.goto("/calendar/");
    await slot(page, "A1", "2026-10-20", "night").click();
    await expect(slot(page, "A1", "2026-10-21", "day")).toHaveAttribute("data-conflict", "true");
    await expect(drawer(page)).toHaveAttribute("data-tone", "danger");
    await expect(drawer(page)).toContainText("۱ نیم‌روز این بازه آزاد نیست (اشغال)");
    await expect(drawer(page).getByRole("button", { name: "این بازه قابل رزرو نیست" })).toBeDisabled();
    await expect(drawer(page).getByRole("link", { name: /ادامه و ثبت/ })).toHaveCount(0);
    const alts = drawer(page).locator(".cp-alt");
    await expect(alts.first()).toBeVisible();
    // برگزیدن نخستین جایگزین ⇒ بازهٔ سالم
    await alts.first().click();
    await expect(drawer(page)).toContainText("همهٔ نیم‌روزهای این بازه آزادند");
    await expect(drawer(page).getByRole("button", { name: /ثبت در صف انتظار/ })).toHaveCount(0);
  });

  test("مهمانِ صف انتظار ⇒ پنجرهٔ ورود با دلیل روشن (بی‌درخواست نوشتنی)", async ({ page, api }) => {
    await page.goto("/calendar/");
    await slot(page, "A1", "2026-10-20", "night").click();
    await drawer(page)
      .getByRole("button", { name: /ثبت در صف انتظار/ })
      .click();
    const login = page.getByRole("dialog", { name: "ورود یا ثبت‌نام" });
    await expect(login).toBeVisible();
    await expect(login).toContainText("برای ثبت در صف انتظار");
    expect(api.calls.filter((c) => c.startsWith("POST"))).toEqual([]);
  });

  test("زائر واردشده: صف انتظار با شمارهٔ حساب ⇒ بدنهٔ درست ⇒ رسید و پیوند پرتال", async ({ page, api }) => {
    signedIn(api);
    let body: Json | null = null;
    api.set("/api/v1/waitlist", async (route) => {
      if (route.request().method() !== "POST") return route.fulfill({ json: { results: [] } });
      body = route.request().postDataJSON() as Json;
      await route.fulfill({ status: 201, json: p04("waitlist-created") });
    });
    await page.goto("/calendar/");
    await slot(page, "A1", "2026-10-20", "night").click();
    await drawer(page)
      .getByRole("button", { name: /ثبت در صف انتظار/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "ثبت درخواست در صف انتظار" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("سه‌شنبه ۲۸ مهر");
    await expect(dialog.getByRole("button", { name: /واحد درخواستی/ })).toContainText("A1");
    await dialog.getByRole("textbox").fill("همراه سالمند داریم");
    await dialog.getByRole("button", { name: "ثبت در صف انتظار" }).click();
    const receipt = page.getByRole("dialog", { name: "درخواست شما در صف انتظار ثبت شد" });
    await expect(receipt).toBeVisible();
    expect(body).toMatchObject({
      unit_code: "A1",
      start: "2026-10-20T20:00:00+03:30",
      end: "2026-10-21T20:00:00+03:30",
      guests_count: 2,
      note: "همراه سالمند داریم",
    });
    await expect(receipt.getByRole("link", { name: "پیگیری در پرتال زائر" })).toHaveAttribute(
      "href",
      "/portal/#waitlist",
    );
    await receipt.getByRole("button", { name: "متوجه شدم و بازگشت به تقویم" }).click();
    await expect(receipt).toHaveCount(0);
  });

  test("همسفران: ۷ نفر ⇒ کشف سریع سوئیت‌ها را «کم‌ظرفیت» نشان می‌دهد و انتخابشان مجاز نیست", async ({ page, api }) => {
    const seen: string[] = [];
    windows(api, seen);
    await page.goto("/calendar/?guests=7");
    await expect.poll(() => seen).toContain("7/2");
    const a1 = page.locator(".cp-dcard").filter({ hasText: "A1" });
    await expect(a1).toHaveAttribute("data-state", "short");
    await expect(a1).toContainText("ظرفیت این واحد برای ۷ نفر کافی نیست");
    await expect(a1.getByRole("button", { name: /انتخاب/ })).toHaveCount(0);
    await slot(page, "A1", "2026-10-21", "night").click();
    await expect(drawer(page)).toContainText("ظرفیت این واحد ۶ نفر است");
  });

  test("نمای روزمحور: زبانه‌های روز با صفحه‌کلید، کارت هر واحد و انتخاب از همان‌جا", async ({ page }) => {
    await page.goto("/calendar/");
    await page.getByRole("radio", { name: /روزمحور/ }).click();
    await expect(page).toHaveURL(/view=day/);
    const tabs = page.getByRole("tablist", { name: "روزهای بازه" });
    await expect(tabs.getByRole("tab")).toHaveCount(14);
    await expect(tabs.getByRole("tab", { selected: true })).toContainText("امروز");
    await tabs.getByRole("tab", { selected: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.getByRole("tab", { selected: true })).toContainText("۲۹ مهر");
    const panel = page.getByRole("tabpanel");
    await expect(panel.locator(".cp-daycard")).toHaveCount(5);
    await expect(panel.locator(".cp-daycard").filter({ hasText: "A1" }).locator(".cp-bigslot").first()).toHaveAttribute(
      "data-state",
      "occupied",
    );
    await panel.locator(".cp-daycard").filter({ hasText: "B2" }).locator(".cp-bigslot").first().click();
    await expect(drawer(page)).toContainText("همهٔ نیم‌روزهای این بازه آزادند");
  });

  test("پیوند ویرایش P-05 همان انتخاب را بازمی‌سازد", async ({ page }) => {
    await page.goto("/calendar/?from=2026-10-23&pick=B2&day=2026-10-25&period=day&cells=4&guests=3");
    await expect(slot(page, "B2", "2026-10-25", "day")).toHaveAttribute("aria-pressed", "true");
    await expect(drawer(page)).toContainText("۲ شبانه‌روز");
    await expect(drawer(page).getByRole("link", { name: /ادامه و ثبت/ })).toHaveAttribute("href", /guests=3/);
  });

  test("موبایل: نوار پایینی «زمان‌های آزاد» فعال، کشوی تاشونده بالای آن", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "نوار پایینی فقط در گوشی");
    await page.goto("/calendar/");
    const dock = page.getByRole("navigation", { name: "میان‌بُرها" });
    await expect(dock.locator('[aria-current="page"]')).toContainText("زمان‌های آزاد");
    await slot(page, "B1", "2026-10-21", "day").click();
    const d = drawer(page);
    await expect(d).toBeVisible();
    // پایان حرکت ورود کشو (اندازه‌گیری وسط translateY خطا دارد)
    await d.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const [dockBox, drawerBox] = await Promise.all([dock.boundingBox(), d.boundingBox()]);
    expect(drawerBox && dockBox && drawerBox.y + drawerBox.height).toBeLessThanOrEqual((dockBox?.y ?? 0) + 1);
    await d.getByRole("button", { name: "جمع کردن جزئیات" }).click();
    await expect(d).not.toHaveAttribute("data-open", /.*/);
    await expect(d.getByRole("button", { name: "باز کردن جزئیات" })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("دسترس‌پذیری (axe) در تم تیره: ماتریس، نمای روزمحور و کشوی تداخل", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("mahdieh-theme", "dark"));
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto("/calendar/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".cp-dcard")).toHaveCount(5);
    const scan = () => new AxeBuilder({ page }).exclude("nextjs-portal").analyze();
    expect((await scan()).violations).toEqual([]);
    await slot(page, "A1", "2026-10-20", "night").click();
    await expect(drawer(page)).toHaveAttribute("data-tone", "danger");
    expect((await scan()).violations).toEqual([]);
    await page.getByRole("radio", { name: /روزمحور/ }).click();
    await expect(page.getByRole("tabpanel").locator(".cp-daycard")).toHaveCount(5);
    expect((await scan()).violations).toEqual([]);
  });

  test("دسترس‌پذیری (axe): صفحه، کشوی انتخاب و راهنما", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/calendar/");
    await expect(page.locator(".cp-dcard")).toHaveCount(5);
    const scan = () => new AxeBuilder({ page }).exclude("nextjs-portal").analyze();
    expect((await scan()).violations).toEqual([]);
    await slot(page, "A1", "2026-10-20", "night").click();
    await expect(drawer(page)).toHaveAttribute("data-tone", "danger");
    expect((await scan()).violations).toEqual([]);
    await page.getByRole("button", { name: /راهنمای زمان‌های تحویل/ }).click();
    await expect(page.getByRole("dialog", { name: /راهنمای زمان‌های تحویل/ })).toBeVisible();
    expect((await scan()).violations).toEqual([]);
  });
});
