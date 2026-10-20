"use client";
import { useQuery } from "@tanstack/react-query";
import { configQuery, helpQuery } from "@/shared/api/queries";
import { readPolicies } from "@/shared/api/policies";
import { SITE } from "@/shared/config/site";
import { durationLabel, faDigits } from "@/shared/lib/fa";
import { Icon, type IconName } from "@/shared/ui/Icon";

/** پرسش‌های برگزیدهٔ صفحهٔ نخست — متن زنده از ‎/help‎ (با قواعد فعلی سامانه). */
const FAQ_SLUGS = ["halfday", "limits", "late-cancel", "signup", "join"];

export function Guidance() {
  const config = useQuery(configQuery);
  const help = useQuery(helpQuery);
  const p = readPolicies(config.data);
  const items = help.data?.categories.flatMap((c) => c.items) ?? [];
  const faq = FAQ_SLUGS.map((slug) => items.find((i) => i.slug === slug)).filter((x) => x !== undefined);

  const tiles: Array<{ icon: IconName; title: string; text: string }> = [
    { icon: "heart-hand", title: "کاملاً رایگان", text: "بدون پرداخت و درگاه بانکی" },
    {
      icon: "clock",
      title: `${durationLabel(p.minCells)} تا ${durationLabel(p.maxCells)}`,
      text: "متناسب با زمان سفر شما",
    },
    {
      icon: "ticket",
      title: p.maxActive === 1 ? "یک رزرو فعال" : `${faDigits(p.maxActive)} رزرو فعال`,
      text: `و تا ${faDigits(p.cellsPerYear)} نیم‌روز در سال؛ فرصتی برابر برای همه`,
    },
    {
      icon: "calendar-x",
      title: "لغو به‌موقع",
      text: `تا ${faDigits(p.cancelFreeHours)} ساعت پیش از ورود، بی‌پیامد؛ دیرتر ⇒ ${faDigits(p.lateCancelCooldownHours)} ساعت بدون رزرو تازه`,
    },
  ];

  return (
    <section className="page-shell guidance-section" id="rules" aria-labelledby="rules-title">
      <div className="rules-intro">
        <p className="section-eyebrow">مهمان هم که باشیم</p>
        <h2 className="section-title" id="rules-title">
          آرامش، سهم همهٔ ماست.
        </h2>
        <p className="section-sub">چند قرار ساده کمک می‌کند فرصت این میزبانی رایگان، عادلانه به زائران بیشتری برسد.</p>
        <ul className="rule-grid">
          {tiles.map((t) => (
            <li key={t.icon} className="rule-tile reveal">
              <Icon name={t.icon} size={22} />
              <strong>{t.title}</strong>
              <small>{t.text}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="faq-area" id="faq">
        <p className="section-eyebrow">پیش از سفر</p>
        <h2 className="faq-title">شاید سؤال شما هم باشد</h2>
        <details name="faq" open>
          <summary>
            آیا واقعاً برای اقامت هزینه‌ای پرداخت نمی‌کنیم؟ <Icon name="plus" size={18} />
          </summary>
          <p>بله. رزرو و اقامت در زائرسرای مهدیه کاملاً رایگان است و در هیچ مرحله‌ای به درگاه پرداخت هدایت نمی‌شوید.</p>
        </details>
        {faq.map((item) => (
          <details key={item.slug} name="faq">
            <summary>
              {item.question} <Icon name="plus" size={18} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
        {help.isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="faq-skeleton" aria-hidden="true">
                <span className="skeleton skeleton--text" />
              </div>
            ))
          : null}
        <a className="section-link faq-link" href={SITE.routes.help}>
          پرسش دیگری دارید؟ راهنمای کامل زائر <Icon name="arrow-left" size={16} />
        </a>
      </div>
    </section>
  );
}
