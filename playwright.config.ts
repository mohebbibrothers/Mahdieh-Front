import { defineConfig, devices } from "@playwright/test";

/**
 * e2e روی همان خروجی تولید (‎dist/mahdieh-front‎) و با همان CSP سخت‌گیر بک‌اند
 * (‎scripts/serve-static.mjs‎). API با fixtureهای واقعی بک‌اند شبیه‌سازی می‌شود و ساعت
 * مرورگر با ‎page.clock‎ ثابت است ⇒ آزمون‌ها قطعی‌اند و به زمان اجرا وابسته نیستند.
 *
 * ‎PW_CHROMIUM_PATH‎: مسیر Chromium محلی اگر نسخهٔ مرورگر Playwright نصب نیست (CI خودش نصب می‌کند).
 */
const PORT = Number(process.env.E2E_PORT ?? 4173);
const CI = Boolean(process.env.CI);
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  ...(CI ? { workers: 2 } : {}),
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: CI ? [["list"], ["html", { open: "never" }], ["github"]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: "fa-IR",
    timezoneId: "Asia/Tehran",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `node scripts/serve-static.mjs --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
