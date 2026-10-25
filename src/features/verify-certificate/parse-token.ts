/** توکن را از نشانی کامل QR (‎…/verify/<token>/‎) یا خود توکن بیرون می‌کشد. */
export function parseCertificateToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const fromUrl = /\/verify\/([^/?#\s]+)\/?/.exec(text);
  const token = fromUrl?.[1] ?? text;
  // توکن فشرده ‎«کد.برچسب۱۰نویسه‌ای»‎ (کوتاه‌ترین: ۱۴ نویسه) یا توکن امضاشدهٔ قدیمی جنگو
  // (حروف/ارقام لاتین و «:_-.»)؛ بیرون از این ⇒ نامعتبر پیش از فراخوانی.
  return /^[A-Za-z0-9:_\-.]{14,600}$/.test(token) ? token : null;
}
