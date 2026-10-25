import AxeBuilder from "@axe-core/playwright";
import type { Route } from "@playwright/test";
import { expect, fixture, horizontalOverflow, test, type MockApi } from "./support/fixtures";

/**
 * P-07 «پرتال زائر و مدیریت اقامت» — fixtureها از بک‌اند واقعی (‎p05‎ و ‎p07‎؛ رزرو ‎M-1405-0011‎).
 * مهمان ⇐ ورود؛ زائر ⇐ کارت اقامت، هماهنگی ورود (PATCH فقط فیلد تغییرکرده)، صف و پیشنهاد سانس،
 * سابقه، نشست‌ها، بازرسی آفلاین گواهی (رشتهٔ یگانهٔ سرور) و حالت‌های خطا.
 */
const p05 = <T = unknown>(name: string) => fixture<T>(`p05/${name}`);
const p07 = <T = unknown>(name: string) => fixture<T>(`p07/${name}`);
const CODE = "M-1405-0011";
const CSRF = { csrf_token: "e2e-token", header_name: "HTTP_X_CSRFTOKEN" };

/** فهرست رزروها: ‎scope‎ در پرس‌وجوست، مسیر یکی ⇒ تفکیک با ‎scope‎. */
function lists(
  api: MockApi,
  upcoming: unknown = p07("reservations-upcoming"),
  past: unknown = p07("reservations-past"),
) {
  api.set("/api/v1/reservations", async (route: Route) => {
    const scope = new URL(route.request().url()).searchParams.get("scope");
    return route.fulfill({ json: scope === "past" ? past : upcoming });
  });
}

/** زائر واردشده با یک رزرو فعال و همهٔ بخش‌های پرتال. */
function pilgrim(api: MockApi, waitlist: unknown = p07("waitlist-empty")) {
  api.set("/api/v1/auth/session", { body: p05("session-complete") });
  api.set("/api/v1/auth/csrf", { body: CSRF });
  api.set("/api/v1/me/standing", { body: fixture("standing-active") });
  api.set("/api/v1/me/sessions", { body: p07("sessions") });
  api.set("/api/v1/waitlist", { body: waitlist });
  api.set(`/api/v1/reservations/${CODE}`, { body: p05("reservation-confirmed") });
  api.set(`/api/v1/reservations/${CODE}/timeline`, { body: p05("timeline-confirmed") });
  api.set(`/api/v1/reservations/${CODE}/certificate`, { body: p05("certificate") });
  lists(api);
}

test.describe("P-07 پرتال زائر", () => {
  test("مهمان: ورود درجا، استعلام گواهی و راهنما؛ بی درخواست حساب و بی‌سرریز", async ({ page, api }) => {
    await page.goto("/portal/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("پرتال زائر");
    await expect(page.getByRole("heading", { name: /ورود به پرتال با شمارهٔ همراه/ })).toBeVisible();
    await expect(page.locator("#verify")).toBeVisible();
    await expect(page.locator("#companion")).toBeVisible();
    expect(api.calls.filter((c) => /\/me\/|\/waitlist|\/reservations/.test(c))).toEqual([]);
    expect(await horizontalOverflow(page)).toBeNull();
  });

  test("زائر: نوار وضعیت با سه سهمیهٔ سرور، کارت اقامت، سابقه، نشست‌ها؛ دسترس‌پذیر", async ({ page, api }) => {
    pilgrim(api);
    await page.goto("/portal/");
    await expect(page.getByText("مرتضی رضوی").first()).toBeVisible();
    await expect(page.getByRole("group", { name: "سهمیه‌های شما" })).toContainText("۱۰ از ۱۴");
    await expect(page.getByText("سقف رزرو فعال پر است")).toBeVisible();

    const stay = page.locator("#stay");
    await expect(stay).toContainText(CODE);
    await expect(stay).toContainText("اتاق بزرگ طبقهٔ دوم");
    await expect(stay.getByRole("link", { name: /افزودن به تقویم/ })).toHaveAttribute(
      "href",
      `/api/v1/reservations/${CODE}/calendar.ics`,
    );

    await expect(page.locator("#history")).toContainText("M-1405-0003");
    await expect(page.locator("#account")).toContainText("Safari · iPhone");
    expect(api.calls).toEqual(
      expect.arrayContaining([
        "GET /api/v1/reservations?scope=upcoming",
        "GET /api/v1/waitlist",
        "GET /api/v1/me/sessions",
      ]),
    );
    expect(api.calls.some((c) => c.startsWith("GET /api/v1/reservations?scope=past"))).toBe(true);
    expect(await horizontalOverflow(page)).toBeNull();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`دسترس‌پذیری WCAG AA همهٔ بخش‌ها (همراه پیشنهاد صف) — تم ${theme}`, async ({ page, api }) => {
      await page.addInitScript((t) => localStorage.setItem("mahdieh-theme", t), theme);
      pilgrim(api, p07("waitlist-offer"));
      await page.goto("/portal/");
      await expect(page.locator("#stay")).toContainText(CODE);
      await expect(page.getByRole("region", { name: "پیشنهاد سانس آزادشده" })).toBeVisible();
      await expect(page.locator("#history")).toContainText("M-1405-0003");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
      const issues = axe.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} — ${n.any[0]?.message ?? n.failureSummary ?? ""}`),
      );
      expect(issues).toEqual([]);
    });
  }

  test("هماهنگی ورود: فقط فیلد تغییرکرده (پلاک) با PATCH؛ پیام موفق و بستن پنجره", async ({ page, api }) => {
    pilgrim(api);
    let body: Record<string, unknown> = {};
    api.set(`/api/v1/reservations/${CODE}`, async (route) => {
      if (route.request().method() === "PATCH") {
        expect(await route.request().headerValue("x-csrftoken")).toBe("e2e-token");
        body = route.request().postDataJSON() as Record<string, unknown>;
        return route.fulfill({ json: p07("reservation-arrival-saved") });
      }
      return route.fulfill({ json: p05("reservation-confirmed") });
    });
    await page.goto("/portal/");
    await page.getByRole("button", { name: /ثبت ساعت و پلاک/ }).click();
    const dialog = page.getByRole("dialog", { name: /هماهنگی ساعت ورود/ });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("دو رقم نخست پلاک").click();
    await page.keyboard.type("12");
    await dialog.locator(".plate__letter").click();
    await dialog.locator(".plate__letters button", { hasText: "ب" }).first().click();
    await page.keyboard.type("45622");
    await dialog.getByRole("button", { name: /ثبت و به‌روزرسانی/ }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: "هماهنگی ورود به‌روز شد" })).toBeVisible();
    expect(Object.keys(body)).toEqual(["vehicle_plate"]);
    expect(String(body.vehicle_plate)).toContain("۴۵۶");
  });

  test("پیشنهاد صف انتظار: شمارش معکوس و پذیرش ⇒ رزرو تازه", async ({ page, api }) => {
    pilgrim(api, p07("waitlist-offer"));
    let action: unknown = null;
    api.set("/api/v1/waitlist/offers/01a17400-0000-7000-8000-00000000a0f1/respond", async (route) => {
      action = (route.request().postDataJSON() as { action?: string }).action;
      return route.fulfill({ status: 201, json: p07("offer-accepted") });
    });
    api.set("/api/v1/reservations/M-1405-0012", { status: 404, body: { detail: "یافت نشد", code: "not_found" } });
    api.allowConsole(/404/);
    await page.goto("/portal/");
    const offer = page.getByRole("region", { name: "پیشنهاد سانس آزادشده" });
    await expect(offer).toContainText("B1");
    await expect(offer.getByRole("timer")).toContainText(/[۰-۹]{2}:[۰-۹]{2}/);
    await offer.getByRole("button", { name: "پذیرش و ثبت رزرو" }).click();
    await expect(page.getByRole("status").filter({ hasText: "سانس به نام شما رزرو شد" })).toBeVisible();
    expect(action).toBe("accept");
  });

  test("کد ناموجود در ‎?code=‎: پیام و پاک شدن نشانی (نه صفحهٔ خطا)", async ({ page, api }) => {
    pilgrim(api);
    api.set("/api/v1/reservations/M-1405-9999", { status: 404, body: { detail: "یافت نشد", code: "not_found" } });
    api.allowConsole(/404/);
    await page.goto("/portal/?code=M-1405-9999");
    await expect(page.getByRole("status").filter({ hasText: "رزرو M-1405-9999 در حساب شما پیدا نشد" })).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.has("code")).toBe(false);
    await expect(page.locator("#stay")).toContainText(CODE);
  });

  test("بازرسی آفلاین: تاریخ عددی ⇒ همان رشتهٔ چاپی سرور؛ نتیجهٔ معتبر و جعلی", async ({ page, api }) => {
    const sent: Record<string, unknown>[] = [];
    api.set("/api/v1/auth/csrf", { body: CSRF });
    api.set("/api/v1/certificates/verify-offline", async (route) => {
      const b = route.request().postDataJSON() as Record<string, unknown>;
      sent.push(b);
      return route.fulfill({ json: { valid: b.holder === "مرتضی رضوی" } });
    });
    await page.goto("/portal/#verify");
    const form = page.locator("#verify form");
    await form.getByPlaceholder("M-1405-0000").fill(CODE);
    await form.getByLabel(/نام سرپرست/).fill("مرتضی رضوی");
    await form.getByRole("button", { name: "B2", exact: true }).click();
    for (let i = 1; i < 4; i++) await form.getByRole("button", { name: "افزودن یک نفر" }).click();
    await form.getByLabel("تاریخ ورود").fill("1405/8/27");
    await form.getByLabel("ساعت ورود").fill("8:00");
    await form.getByLabel("تاریخ تخلیه").fill("۲۹ آبان ۱۴۰۵");
    await form.getByLabel("ساعت تخلیه").fill("۰۸:۰۰");
    await form.getByPlaceholder("XXXX-XXXX").fill("f6z2-xdtg");
    await form.getByRole("button", { name: /بررسی اصالت/ }).click();

    await expect(page.locator("#verify .verify-result[data-tone=success]")).toBeVisible();
    expect(sent[0]).toMatchObject({
      code: CODE,
      holder: "مرتضی رضوی",
      unit: "B2",
      floor: 2,
      guests: 4,
      starts: "۲۷ آبان ۱۴۰۵ · ساعت ۰۸:۰۰",
      ends: "۲۹ آبان ۱۴۰۵ · ساعت ۰۸:۰۰",
      short_code: "F6Z2XDTG",
    });

    await form.getByLabel(/نام سرپرست/).fill("مرتضی رضوی جعلی");
    await form.getByRole("button", { name: /بررسی اصالت/ }).click();
    await expect(page.locator("#verify .verify-result[data-tone=danger]")).toBeVisible();
  });

  test("خطای سرور در خواندن نشست: «تلاش دوباره»، نه فرم ورود گمراه‌کننده", async ({ page, api }) => {
    api.set("/api/v1/auth/session", { status: 503, body: { detail: "موقتاً در دسترس نیست" } });
    api.allowConsole(/503/);
    await page.goto("/portal/");
    const failure = page.getByRole("alert").filter({ hasText: "ارتباط با سامانه برقرار نشد" });
    await expect(failure).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /ورود به پرتال/ })).toHaveCount(0);

    api.set("/api/v1/auth/session", { body: fixture("session") });
    await failure.getByRole("button", { name: "تلاش دوباره" }).click();
    await expect(page.getByRole("heading", { name: /ورود به پرتال/ })).toBeVisible();
  });
});
