import localFont from "next/font/local";

/** وزیرمتن متغیر، زیرمجموعهٔ فارسی/لاتین (۶۳KB، ‎scripts/build-fonts.py‎)، میزبانی محلی؛ swap برای متن فوری. */
export const vazirmatn = localFont({
  src: "./vazirmatn-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-vazirmatn",
  preload: true,
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});

/**
 * وزیرمتن ایستا فقط برای چاپ/PDF گواهی: موتور PDF کروم فونت متغیر را Type3 جاسازی می‌کند و
 * نمایشگرهای PDF فاصله و اتصال حروف آن را به‌هم می‌ریزند؛ ایستا ⇒ TrueType استاندارد.
 * بی‌پیش‌بارگذاری (فقط با نمایش گواهی بارگیری می‌شود).
 */
export const vazirmatnPrint = localFont({
  src: [
    { path: "./vazirmatn-print-400.woff2", weight: "400" },
    { path: "./vazirmatn-print-500.woff2", weight: "500" },
    { path: "./vazirmatn-print-600.woff2", weight: "600" },
    { path: "./vazirmatn-print-700.woff2", weight: "700" },
    { path: "./vazirmatn-print-800.woff2", weight: "800" },
  ],
  display: "block",
  variable: "--font-vazirmatn-print",
  preload: false,
  fallback: ["Tahoma", "sans-serif"],
});

const PRINT_WEIGHTS = [400, 500, 600, 700, 800] as const;
let printFonts: Promise<unknown> | null = null;

/** بارگیری یک‌بارهٔ همهٔ وزن‌های چاپی (حداکثر ۴ ثانیه انتظار؛ چاپ هرگز معطل شبکه نمی‌ماند). */
export function loadPrintFonts(): Promise<unknown> {
  if (typeof document === "undefined" || !("fonts" in document)) return Promise.resolve();
  // فقط خانوادهٔ اصلی (نه «‎… Fallback‎» محلی next/font که نبودنش کل بارگیری را رد می‌کند)
  const family = vazirmatnPrint.style.fontFamily.split(",")[0]?.trim() ?? "";
  printFonts ??= Promise.allSettled(
    PRINT_WEIGHTS.map((w) => document.fonts.load(`${w} 16px ${family}`, "بسم ٱلله · M-1405")),
  );
  return Promise.race([printFonts, new Promise((resolve) => setTimeout(resolve, 4000))]);
}
