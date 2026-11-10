/**
 * ریاضی خالص بزرگ‌نمایی گالری (بدون DOM) — قابل آزمون.
 *
 * مختصات نسبت به «مرکز صحنه» است و تبدیل نهایی ‎translate(x, y) scale(s)‎ با مبدأ مرکز اعمال می‌شود.
 * محدودسازی بر پایهٔ اندازهٔ واقعیِ تصویرِ جاافتاده (نه جعبهٔ صحنه) است تا لبه‌ها و گوشه‌های تصویر
 * دقیقاً تا لبهٔ صحنه بیایند و هیچ‌گاه نوار خالی کنار تصویر بزرگ‌شده دیده نشود.
 */

export type Box = { w: number; h: number };
export type Point = { x: number; y: number };
export type View = { s: number; x: number; y: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
/** گام دکمه‌ها و کلیدهای +/− */
export const STEP = 1.5;
/** بزرگ‌نمایی دوبار-لمس / دوبار-کلیک */
export const DOUBLE_TAP_SCALE = 2.5;

export const IDENTITY: View = { s: 1, x: 0, y: 0 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** اندازهٔ تصویر پس از ‎object-fit: contain‎ در صحنه (نسبت نامعلوم ⇒ کل صحنه). */
export function fitSize(stage: Box, ratio: number): Box {
  if (!(ratio > 0) || stage.w <= 0 || stage.h <= 0) return { ...stage };
  return stage.w / stage.h > ratio ? { w: stage.h * ratio, h: stage.h } : { w: stage.w, h: stage.w / ratio };
}

/** بیشترین جابه‌جایی مجاز در هر محور برای مقیاس ‎s‎. */
export function panLimit(s: number, stage: Box, fit: Box): Point {
  return { x: Math.max(0, (fit.w * s - stage.w) / 2), y: Math.max(0, (fit.h * s - stage.h) / 2) };
}

export function clampView(v: View, stage: Box, fit: Box): View {
  const s = clamp(v.s, MIN_SCALE, MAX_SCALE);
  const lim = panLimit(s, stage, fit);
  // ‎+ 0‎ صفرِ منفی را یکدست می‌کند (‎-0‎ در مقایسه و آزمون دردسرساز است)
  return { s, x: clamp(v.x, -lim.x, lim.x) + 0, y: clamp(v.y, -lim.y, lim.y) + 0 };
}

/** بزرگ‌نمایی به سمت نقطهٔ ‎p‎ (نقطهٔ زیر انگشت/نشانگر ثابت می‌ماند): ‎t′ = p − (p − t)·(s′/s)‎ */
export function zoomAt(v: View, nextScale: number, p: Point, stage: Box, fit: Box): View {
  const s = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const k = s / v.s;
  return clampView({ s, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k }, stage, fit);
}

export function panBy(v: View, dx: number, dy: number, stage: Box, fit: Box): View {
  return clampView({ s: v.s, x: v.x + dx, y: v.y + dy }, stage, fit);
}

/** قاب دید فعلی روی تصویر کامل، به نسبت ‎0..1‎ (برای نقشهٔ کوچک ناوبری). */
export function viewportRect(
  v: View,
  stage: Box,
  fit: Box,
): { left: number; top: number; width: number; height: number } {
  if (fit.w <= 0 || fit.h <= 0) return { left: 0, top: 0, width: 1, height: 1 };
  const width = Math.min(1, stage.w / (fit.w * v.s));
  const height = Math.min(1, stage.h / (fit.h * v.s));
  const left = clamp(0.5 - v.x / (fit.w * v.s) - width / 2, 0, 1 - width);
  const top = clamp(0.5 - v.y / (fit.h * v.s) - height / 2, 0, 1 - height);
  return { left, top, width, height };
}

/** نقطه‌ای از نقشهٔ کوچک (‎u, w ∈ 0..1‎) ⇒ همان نقطه وسط صحنه. */
export function centerOn(v: View, u: number, w: number, stage: Box, fit: Box): View {
  return clampView({ s: v.s, x: -(u - 0.5) * fit.w * v.s, y: -(w - 0.5) * fit.h * v.s }, stage, fit);
}

export const isZoomed = (v: View) => v.s > MIN_SCALE + 0.001;
