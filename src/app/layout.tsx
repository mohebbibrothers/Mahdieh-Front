import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { THEME_BOOT } from "@/features/theme/theme-script";
import { Providers } from "./providers";
import "./globals.css";

/** وزیرمتن متغیر، زیرمجموعهٔ فارسی/لاتین (۵۸KB)، میزبانی محلی؛ swap برای متن فوری. */
const vazirmatn = localFont({
  src: "../shared/fonts/vazirmatn-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
  preload: true,
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "مهدیه · اقامت رایگان زائران امام رضا (ع)", template: "%s · مهدیه" },
  description: "رزرو رایگان اقامت در زائرسرای مهدیه، مشهد مقدس: زمان‌های آزاد را ببینید، با شمارهٔ همراه وارد شوید و گواهی اقامت بگیرید.",
  applicationName: "مهدیه",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f6f0",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa-IR" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">
          پرش به محتوای اصلی
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
