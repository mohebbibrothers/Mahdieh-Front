import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { THEME_BOOT } from "@/features/theme/theme-script";
import { vazirmatn, vazirmatnPrint } from "@/shared/fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "مهدیه · اقامت رایگان زائران امام رضا (ع)", template: "%s · مهدیه" },
  description:
    "رزرو رایگان اقامت در زائرسرای مهدیه، مشهد مقدس: زمان‌های آزاد را ببینید، با شمارهٔ همراه وارد شوید و گواهی اقامت بگیرید.",
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
    <html
      lang="fa-IR"
      dir="rtl"
      className={`${vazirmatn.variable} ${vazirmatnPrint.variable}`}
      suppressHydrationWarning
    >
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
