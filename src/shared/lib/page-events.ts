/**
 * رویدادهای سبک میان پوستهٔ مشترک (نوار پایینی گوشی) و صفحهٔ جاری — بی‌وابستگی ویجت به ویجت.
 * پوسته فقط «درخواست» می‌فرستد؛ صفحه اگر حاضر باشد پاسخ می‌دهد و اگر نباشد چیزی نمی‌شکند.
 */
export const UNITS_TRIP_EVENT = "mahdieh:units-trip";

export function requestUnitsTrip(): void {
  window.dispatchEvent(new Event(UNITS_TRIP_EVENT));
}
