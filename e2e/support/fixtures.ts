import { readFileSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Page, type Route } from "@playwright/test";

/** لحظهٔ ثابت همهٔ آزمون‌ها: همان لحظه‌ای که fixtureها از بک‌اند واقعی گرفته شدند. */
export const NOW = new Date("2026-10-20T13:50:00+03:30");

const DIR = path.join(import.meta.dirname, "..", "fixtures");
export const fixture = <T = unknown>(name: string): T =>
  JSON.parse(readFileSync(path.join(DIR, `${name}.json`), "utf8")) as T;

type Reply = { status?: number; body: unknown } | ((route: Route) => Promise<void>);

/** مسیرهای GET عمومی صفحهٔ خانه ⇒ fixture. هر درخواست دیگر = شکست آزمون (نه ۴۰۴ بی‌صدا). */
const DEFAULTS: Record<string, string> = {
  "/api/v1/auth/session": "session",
  "/api/v1/config": "config",
  "/api/v1/calendar": "calendar",
  "/api/v1/property": "property",
  "/api/v1/help": "help",
  "/api/v1/occasions": "occasions",
  "/api/v1/meta": "meta",
  "/api/v1/units": "units",
};

export class MockApi {
  readonly overrides = new Map<string, Reply>();
  readonly calls: string[] = [];
  readonly unexpected: string[] = [];
  /** پیام‌های کنسولی که این آزمون عمداً ایجاد می‌کند (مثلاً ۵۰۳ شبیه‌سازی‌شده). */
  readonly allowedConsole: RegExp[] = [];

  constructor(private readonly page: Page) {}

  allowConsole(pattern: RegExp): void {
    this.allowedConsole.push(pattern);
  }

  /** پاسخ یک مسیر را برای همین آزمون عوض می‌کند (پیش از ‎goto‎ یا وسط آزمون). */
  set(pathname: string, reply: Reply): void {
    this.overrides.set(pathname, reply);
  }

  async install(): Promise<void> {
    await this.page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const key = `${route.request().method()} ${url.pathname}`;
      this.calls.push(`${key}${url.search}`);
      const override = this.overrides.get(url.pathname);
      if (typeof override === "function") return override(route);
      if (override) return route.fulfill({ status: override.status ?? 200, json: override.body });
      const name = route.request().method() === "GET" ? DEFAULTS[url.pathname] : undefined;
      if (!name) {
        this.unexpected.push(key);
        return route.fulfill({ status: 599, json: { detail: `e2e: بی‌fixture ${key}` } });
      }
      return route.fulfill({ status: 200, json: fixture(name), headers: { "cache-control": "no-store" } });
    });
  }
}

type Fixtures = { api: MockApi; problems: string[] };

/**
 * هر آزمون: ساعت ثابت، API شبیه‌سازی‌شده، و نگهبان خطا — هر خطای کنسول، استثنای صفحه،
 * نقض CSP یا درخواست بی‌fixture آزمون را می‌شکند (نه فقط هشدار).
 */
export const test = base.extend<Fixtures>({
  problems: async ({ page }, use) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") problems.push(`console.${m.type()}: ${m.text()}`);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        console.error(`CSP: ${e.violatedDirective} ${e.blockedURI}`);
      });
    });
    await use(problems);
  },
  api: async ({ page, problems }, use) => {
    await page.clock.install({ time: NOW });
    const api = new MockApi(page);
    await api.install();
    await use(api);
    expect(api.unexpected, "درخواست API بی‌fixture").toEqual([]);
    const real = problems.filter((p) => !api.allowedConsole.some((re) => re.test(p)));
    expect(real, "خطای کنسول/CSP/صفحه").toEqual([]);
  },
});

export { expect };

/** آیا صفحه سرریز افقی دارد؟ (بزرگ‌ترین عنصر بیرون‌زده را برای پیام خطا برمی‌گرداند) */
export async function horizontalOverflow(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth + 1) return null;
    const vw = doc.clientWidth;
    const culprit = [...document.querySelectorAll<HTMLElement>("body *")].find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > vw + 1 || r.left < -1);
    });
    return culprit ? `${culprit.tagName}.${culprit.className}` : `scrollWidth=${doc.scrollWidth}`;
  });
}
