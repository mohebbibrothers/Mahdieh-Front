/** توکن را از نشانی کامل QR (‎…/verify/<token>/‎) یا خود توکن بیرون می‌کشد. */
export function parseCertificateToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const fromUrl = /\/verify\/([^/?#\s]+)\/?/.exec(text);
  const token = fromUrl?.[1] ?? text;
  // توکن امضاشدهٔ جنگو: حروف/ارقام لاتین و «:_-.»؛ بیرون از این ⇒ نامعتبر پیش از فراخوانی.
  return /^[A-Za-z0-9:_\-.]{16,600}$/.test(token) ? token : null;
}
