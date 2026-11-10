import type { FlatItem } from "./model";

/**
 * دادهٔ ساخت‌یافتهٔ ‎FAQPage‎ (schema.org) برای پرسش‌هایی که بک‌اند برگزیده (‎faq‎) — نتیجهٔ غنی موتورهای
 * جست‌وجو. بلوک داده است نه اسکریپت اجرایی (CSP بر آن اعمال نمی‌شود)؛ ‎`<`‎ گریز داده می‌شود.
 */
export function HelpJsonLd({ items, faq }: { items: FlatItem[]; faq: string[] }) {
  const chosen = new Set(faq);
  const entries = items.filter((i) => chosen.has(i.slug));
  if (!entries.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fa-IR",
    mainEntity: entries.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: i.steps.length ? `${i.answer} ${i.steps.map((s, n) => `${n + 1}. ${s}`).join(" ")}` : i.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
