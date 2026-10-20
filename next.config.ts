import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * خروجی ایستا (ADR-0022): HTML/JS/CSS ساخته می‌شود و جنگو آن را با nonce تازهٔ CSP
 * در هر پاسخ سرو می‌کند. در توسعه، `/api` و صفحه‌های قدیمی به جنگوی محلی پروکسی می‌شوند.
 */
const BACKEND = process.env.MAHDIEH_DEV_BACKEND ?? "http://127.0.0.1:8000";

export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    ...(dev ? {} : { output: "export" as const }),
    trailingSlash: true,
    reactStrictMode: true,
    reactCompiler: true,
    typedRoutes: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    images: { unoptimized: true },
    devIndicators: false,
    ...(dev
      ? {
          async rewrites() {
            return {
              fallback: ["api", "login", "my", "book", "units", "calendar", "help", "feedback", "static", "health"].map(
                (prefix) => ({ source: `/${prefix}/:path*`, destination: `${BACKEND}/${prefix}/:path*` }),
              ),
            };
          },
        }
      : {}),
  };
}
