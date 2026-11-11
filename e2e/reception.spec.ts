import AxeBuilder from "@axe-core/playwright";
import type { Page, Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/** عنصرهایی که از لبهٔ والد (غیرپیمایشی) بیرون زده‌اند — سرریز پنهانی که سرریز سند نمی‌بیند. */
async function escapedChildren(page: Page): Promise<string[]> {
  return page.locator("main").evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>("*")]
      .filter((e) => {
        const parent = e.parentElement;
        if (!parent || e.closest(".rc-ledger__panel, .sr-only, [popover]")) return false;
        const ox = getComputedStyle(parent).overflowX;
        if (ox === "auto" || ox === "hidden" || ox === "scroll") return false;
        const r = e.getBoundingClientRect();
        const p = parent.getBoundingClientRect();
        return r.width > 0 && (r.left < p.left - 1 || r.right > p.right + 1);
      })
      .slice(0, 5)
      .map(
        (e) =>
          `${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} ⊄ ${String(e.parentElement?.className)}`,
      ),
  );
}

/**
 * P-06 «میز پذیرش خادمان» — fixtureها پاسخ واقعی بک‌اند در لحظهٔ ثابت آزمون‌ها (۲۸ مهر ۱۴۰۵، ۱۳:۵۰):
 * A1 مقیم، B1 تأخیر در ورود، A2 در نظافت (۵۰٪)، B2 مسدود برای تعمیرات، B3 آماده.
 * نگهبان‌ها: نشست کارمندی ⇒ عامل دوم ⇒ تصویر زنده؛ هر کنش حساس با بدنهٔ دقیق قرارداد سرور.
 */
const p06 = <T = unknown>(name: string) => fixture<T>(`p06/${name}`);
const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };
const DELAYED = "M-1405-0003"; // B1 — زهرا محمدی
const RESIDENT = "M-1405-0001"; // A1 — مرتضی رضوی
const GUEST = "01a1c9c7-9e86-7073-bc2b-dca5c99e4b47"; // شناسهٔ زهرا محمدی در همان پاسخ سرور

/** خادم واردشده با عامل دوم تازه و تصویر میز. */
function staff(api: MockApi, desk: unknown = p06("desk")) {
  api.set("/api/v1/auth/session", { body: p06("session-staff") });
  api.set("/api/v1/auth/mfa/status", { body: p06("mfa-status") });
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/staff/desk", { body: desk });
}

/** بدنهٔ JSON آخرین درخواست POST یک مسیر را نگه می‌دارد و پاسخ می‌دهد. */
function capture(api: MockApi, path: string, reply: { status?: number; body: unknown }) {
  const bodies: unknown[] = [];
  api.set(path, async (route: Route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status: reply.status ?? 200, json: reply.body });
  });
  return bodies;
}

const ready = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("پیشخوان خادمان");
  await expect(page.locator(".rc-unit")).toHaveCount(5);
};

test.describe("P-06 میز پذیرش", () => {
  test("زائر یا مهمان: صفحهٔ قفل، بی هیچ درخواست دادهٔ کارکنان و بی‌نمایه", async ({ page, api }) => {
    await page.goto("/reception/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("این بخش ویژهٔ خادمان پیشخوان است");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(api.calls.filter((c) => /\/staff\/|\/mfa\//.test(c))).toEqual([]);
  });

  test("فعال‌سازی عامل دوم: QR ⇒ کد ⇒ کدهای بازیابی می‌مانند تا ذخیره ⇒ ورود به میز", async ({ page, api }) => {
    let enrolled = false;
    api.set("/api/v1/auth/session", { body: p06("session-staff-pending") });
    api.set("/api/v1/auth/csrf", { body: CSRF });
    api.set("/api/v1/auth/mfa/status", async (route) =>
      route.fulfill({ json: enrolled ? p06("mfa-status") : p06("mfa-status-unenrolled") }),
    );
    api.set("/api/v1/auth/mfa/totp/setup", { body: p06("mfa-setup") });
    const confirm = capture(api, "/api/v1/auth/mfa/totp/confirm", { body: p06("mfa-confirm") });
    api.set("/api/v1/staff/desk", { body: p06("desk") });

    await page.goto("/reception/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("فعال‌سازی تأیید دومرحله‌ای");
    await page.getByRole("button", { name: "آغاز فعال‌سازی و دریافت کد QR" }).click();
    await expect(page.getByRole("img", { name: "کد QR اتصال برنامهٔ Authenticator" })).toBeVisible();

    enrolled = true; // از این پس سرور «تأییدشده» می‌گوید — دروازه نباید زودتر از ذخیرهٔ کدها باز شود
    await page.getByRole("textbox", { name: "کد ۶ رقمی برنامه" }).fill("123456");
    await expect(page.getByRole("list", { name: "کدهای بازیابی" }).getByRole("listitem")).toHaveCount(10);
    expect(confirm).toEqual([{ code: "123456" }]);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("کدهای بازیابی را نگه دارید");
    expect(api.calls.some((c) => c.startsWith("GET /api/v1/staff/desk"))).toBe(false);

    const enter = page.getByRole("button", { name: "ورود به پیشخوان" });
    await expect(enter).toBeDisabled();
    await page.getByText("کدها را در جای امنی (جدا از گوشی) نگه داشتم.").click();
    await enter.click();
    await ready(page);
  });

  test("تصویر زنده: پنج وضعیت، شاخص‌ها فیلتر می‌کنند، نظافت زنده و دفتر و رخدادها", async ({ page, api }) => {
    staff(api);
    await page.goto("/reception/");
    await ready(page);
    const states = await page.locator(".rc-unit").evaluateAll((els) => els.map((e) => e.getAttribute("data-state")));
    expect(states.sort()).toEqual(["buffer", "expected", "maintenance", "occupied", "ready"]);
    await expect(page.locator('.rc-unit[data-state="buffer"]')).toContainText("برادر صادقی");
    await expect(page.locator('.rc-unit[data-state="buffer"] progress')).toHaveAttribute("value", "50");

    const cleaning = page.locator(".rc-kpi").filter({ hasText: "در حال نظافت" });
    await cleaning.click();
    await expect(cleaning).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".rc-unit")).toHaveCount(1);
    await page.getByRole("button", { name: "نمایش همهٔ واحدها" }).click();
    await expect(page.locator(".rc-unit")).toHaveCount(5);

    // جدول در دسکتاپ و کارت در موبایل — هر کدام که دیده می‌شود (برچسب زبانه هم در موبایل کوتاه است)
    const ledger = page.locator(".rc-ledger");
    const rows = ledger.locator("tbody tr:visible, .rc-cards > li:visible");
    await expect(rows).toHaveCount(4);
    await ledger.getByRole("tab", { name: /تأخیر|هشدار/ }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("زهرا محمدی");
    await expect(page.locator(".rc-event")).toHaveCount(3);
  });

  test("پذیرش سریع: کد رزرو ⇒ پرونده ⇒ چک‌لیست کامل ⇒ ثبت پذیرش با یادداشت حسابرسی", async ({ page, api }) => {
    staff(api);
    api.set("/api/v1/staff/desk/lookup", { body: p06("lookup-code") });
    const checkIn = capture(api, `/api/v1/staff/reservations/${DELAYED}/check-in`, { body: p06("check-in") });
    await page.goto("/reception/");
    await ready(page);

    const fast = page.locator("#rc-fast");
    await fast.getByRole("searchbox", { name: "ورودی اسکنر یا جست‌وجوی دستی" }).fill(DELAYED);
    await fast.getByRole("button", { name: "استعلام و فراخوانی" }).click();
    await expect(fast).toContainText("زهرا محمدی");
    const finalize = fast.locator(".rc-finalize");
    await expect(finalize).toBeDisabled();
    for (const box of await fast.getByRole("checkbox").all()) await box.check();
    api.set("/api/v1/staff/desk", { body: p06("desk-after-checkin") });
    await finalize.click();
    await expect(fast).toContainText("پذیرش زهرا محمدی ثبت شد.");
    expect(checkIn).toHaveLength(1);
    expect((checkIn[0] as { staff_note: string }).staff_note).toContain("۳ از ۳");
  });

  test("تخلیه: پنجرهٔ خروج با خادم خدمات و مدت نظافت ⇒ بدنهٔ دقیق قرارداد", async ({ page, api }) => {
    staff(api);
    const out = capture(api, `/api/v1/staff/reservations/${RESIDENT}/check-out`, { body: p06("check-in") });
    await page.goto("/reception/");
    await ready(page);
    await page
      .locator('.rc-unit[data-state="occupied"]')
      .getByRole("button", { name: /ثبت خروج و تحویل به نظافت/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "ثبت خروج زائر و تحویل واحد به نظافت" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "برادر صادقی" }).click();
    await dialog.locator(".app-dialog__actions .btn-primary").click();
    await expect(dialog).toBeHidden();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ housekeeper: "برادر صادقی" });
    expect((out[0] as { cleaning_minutes: number }).cleaning_minutes).toBeGreaterThan(0);
  });

  test("شمارهٔ کامل زائر: ۴۰۳ تأیید تازه ⇒ کد ۶ رقمی ⇒ تکرار خودکار ⇒ نمایش موقت", async ({ page, api }) => {
    staff(api);
    api.allowConsole(/status of 403/); // ۴۰۳ نخست عمدی است (سد تأیید تازه)
    api.set(`/api/v1/staff/guests/${GUEST}`, { body: p06("guest") });
    api.set(`/api/v1/staff/reservations/${DELAYED}/events`, { body: p06("events") });
    let attempts = 0;
    api.set(`/api/v1/staff/guests/${GUEST}/reveal-phone`, async (route) => {
      attempts += 1;
      return attempts === 1
        ? route.fulfill({ status: 403, json: p06("reveal-step-up") })
        : route.fulfill({ json: p06("reveal") });
    });
    const verify = capture(api, "/api/v1/auth/mfa/verify", {
      body: { method: "totp", status: p06("mfa-status") },
    });
    await page.goto("/reception/");
    await ready(page);

    await page
      .locator(".rc-ledger")
      .locator("tbody tr:visible, .rc-cards > li:visible")
      .filter({ hasText: "زهرا محمدی" })
      .locator(".rc-lock")
      .click();
    const dossier = page.getByRole("dialog").filter({ hasText: "زهرا محمدی" });
    await dossier.getByRole("button", { name: "نمایش شمارهٔ کامل (تأیید امنیتی)" }).click();
    const stepUp = page.getByRole("dialog", { name: "تأیید امنیتی دومرحله‌ای خادم" });
    await expect(stepUp).toBeVisible();
    await stepUp.getByRole("textbox", { name: "کد ۶ رقمی عامل دوم" }).fill("654321");
    await expect(stepUp).toBeHidden();
    expect(verify).toEqual([{ code: "654321" }]);
    await expect(dossier.locator(".rc-reveal__phone")).toContainText(p06<{ phone: string }>("reveal").phone);
    expect(attempts).toBe(2);
  });

  test("موبایل ۳۶۰: بی‌سرریز افقی، دفتر به شکل کارت و دو شاخص در هر ردیف نه", async ({ page, api }) => {
    staff(api);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/reception/");
    await ready(page);
    expect(await horizontalOverflow(page)).toBeNull();
    expect(await escapedChildren(page), "فرزند بیرون‌زده از قاب در ۳۶۰").toEqual([]);
    await expect(page.locator(".rc-table")).toBeHidden();
    await expect(page.locator(".rc-cards > li")).toHaveCount(4);
    const [a, b] = await page
      .locator(".rc-kpi")
      .evaluateAll((els) => els.slice(0, 2).map((e) => e.getBoundingClientRect().top));
    expect(b).toBeGreaterThan(a ?? 0); // ≤۳۶۰: یک ستون (طراح)
  });

  test("تبلت ۷۶۸ و دسکتاپ: بی‌سرریز و دسترس‌پذیر (axe)", async ({ page, api }) => {
    staff(api);
    await page.setViewportSize({ width: 768, height: 1000 });
    await page.goto("/reception/");
    await ready(page);
    expect(await horizontalOverflow(page)).toBeNull();
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect(await horizontalOverflow(page)).toBeNull();
    const result = await new AxeBuilder({ page }).include("main").analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });

  test("دور ۱: زبانه‌های یک‌ردیفه، کارت‌های هم‌تراز، منوی کنار دکمه و فرم بخش‌بندی‌شده", async ({ page, api }) => {
    staff(api);
    const tops = (loc: ReturnType<Page["locator"]>) =>
      loc.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));

    // ۳۶۰: زبانه‌های دفتر و شیوه‌نامه هر پنج در یک ردیف هم‌عرض (بی‌شکستن ۳+۲)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/reception/");
    await ready(page);
    expect(new Set(await tops(page.locator(".rc-ledger__bar .rc-tab"))).size).toBe(1);
    await page.getByRole("button", { name: "شیوه‌نامه و مقررات کشیک" }).click();
    const sop = page.getByRole("dialog", { name: "شیوه‌نامه و مقررات کشیک خادمان" });
    const sopTabs = sop.getByRole("tab");
    await expect(sopTabs).toHaveCount(5);
    expect(new Set(await tops(sopTabs)).size).toBe(1);
    await sopTabs.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(sop.getByRole("tab", { name: /حریم خصوصی/ })).toHaveAttribute("aria-selected", "true");
    await expect(sop.getByRole("heading", { name: "حریم خصوصی زائران" })).toBeVisible();
    await page.keyboard.press("Escape");

    // منوی ⋯ واحد در گوشی کنار دکمهٔ خودش باز می‌شود، نه بالای صفحه
    const card = page.locator(".rc-unit").filter({ has: page.getByText("B3", { exact: true }) });
    const more = card.locator(".rc-unit__more");
    await more.scrollIntoViewIfNeeded();
    await more.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const [btn, pop] = await Promise.all([more.boundingBox(), menu.boundingBox()]);
    expect(btn && pop && Math.abs(pop.y - (btn.y + btn.height)) < 24).toBe(true);
    await page.keyboard.press("Escape");

    // نوار وضعیت کارت از گوشه‌های گرد بیرون نمی‌زند
    const bar = await card.evaluate((e) => {
      const s = getComputedStyle(e, "::before");
      return { left: parseFloat(s.left), right: parseFloat(s.right) };
    });
    expect(bar.left).toBeGreaterThanOrEqual(16);
    expect(bar.right).toBeGreaterThanOrEqual(16);

    // ثبت حضوری: چهار گام، استان بی پرکردن خودکار مرورگر، پلاک یکسان با صفحهٔ رزرو
    await more.click();
    await page.getByRole("menuitem", { name: "ثبت نوبت حضوری" }).click();
    const create = page.getByRole("dialog", { name: "ثبت نوبت حضوری یا تلفنی" });
    await expect(create.locator(".rc-fsec")).toHaveCount(4);
    await expect(create.getByRole("combobox", { name: /استان مبدأ/ })).toHaveAttribute(
      "autocomplete",
      "mahdieh-picker",
    );
    await expect(create.getByRole("group", { name: /پلاک خودرو/ })).toBeVisible();
    await expect(create.getByText("ساعت تقریبی رسیدن", { exact: true })).toBeVisible();
    const overflow = await create.locator(".app-dialog__body").evaluate((b) => b.scrollWidth - b.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.keyboard.press("Escape");

    // ۱۲۸۰: عنوان گروه کارتی بیرون از شبکه؛ کارت‌های هم‌ردیف هم‌قد
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: "خروجی دفتر آمار شیفت" }).click();
    const exp = page.getByRole("dialog", { name: "خروجی اکسل دفتر شیفت" });
    const group = exp.getByRole("group", { name: "بازهٔ گزارش" });
    const boxes = await group
      .locator(".rc-choice")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.top, r.height]));
    expect(boxes).toHaveLength(4);
    expect(boxes[0]?.[0]).toBe(boxes[1]?.[0]); // دو کارت نخست در یک ردیف
    expect(new Set(boxes.map((b) => Math.round(b[1] ?? 0))).size).toBe(1); // همه هم‌قد
    const legend = await group.locator("legend").boundingBox();
    expect(legend && legend.y + legend.height <= (boxes[0]?.[0] ?? 0)).toBe(true);
    await page.keyboard.press("Escape");

    // ۱۲۸۰: شیوه‌نامه با فهرست عمودی فصل‌ها کنار متن
    await page.getByRole("button", { name: "شیوه‌نامه و مقررات کشیک" }).click();
    const rail = await tops(page.getByRole("dialog", { name: "شیوه‌نامه و مقررات کشیک خادمان" }).getByRole("tab"));
    expect(rail).toEqual([...rail].sort((a, b) => a - b));
    expect(new Set(rail).size).toBe(5);
  });
});
