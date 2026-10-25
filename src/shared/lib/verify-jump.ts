/**
 * پرش به «بازرسی آفلاین» (‎/portal/#verify‎) از هر جای سایت — دیالوگ استعلام QR (پرتال و پانوشت همهٔ صفحه‌ها)
 * رویداد را می‌فرستد و ‎VerifySection‎ گوش می‌دهد (ویجت ⇐ ویژگی وابسته نمی‌شود؛ فقط این قرارداد مشترک).
 * ‎:target‎ با ‎pushState‎ به‌روز نمی‌شود ⇒ درخشش با ‎data-flash‎ از جاوااسکریپت.
 */
export const VERIFY_JUMP_EVENT = "mahdieh:verify-offline";
export const VERIFY_HASH = "#verify";

export const onPortalPage = () => window.location.pathname.replace(/\/+$/, "") === "/portal";

/** فقط وقتی همین صفحه پرتال است ⇒ ‎true‎ (پیوند پیش‌فرض را باید لغو کرد)؛ وگرنه ناوبری عادی ‎Link‎. */
export function requestVerifyJump(delayMs = 260): boolean {
  if (!onPortalPage()) return false;
  window.history.replaceState(null, "", VERIFY_HASH); // null ⇒ Next همگام می‌شود
  // پس از انیمیشن بسته‌شدن دیالوگ (قفل اسکرول آزاد شود) ⇒ پیمایش.
  window.setTimeout(() => window.dispatchEvent(new Event(VERIFY_JUMP_EVENT)), delayMs);
  return true;
}
