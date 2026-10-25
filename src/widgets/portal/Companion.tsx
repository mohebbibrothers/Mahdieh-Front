"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { featureIcon } from "@/entities/unit/unit";
import { configQuery, helpQuery, propertyQuery } from "@/shared/api/queries";
import type { HelpItem } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { faDigits } from "@/shared/lib/fa";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { SectionHead } from "./parts";

/** پرسش‌های «همراه سفر» از راهنمای زندهٔ سرور (‎/help‎) — ترتیب = ترتیب سفر زائر. */
const PICKS: Array<[category: string, slug: string, icon: IconName]> = [
  ["stay", "arrival", "key"],
  ["before", "what-to-bring", "luggage"],
  ["stay", "certificate", "certificate"],
  ["change", "no-show", "clock"],
  ["stay", "cleaning", "broom"],
  ["trouble", "contact", "phone"],
];

/** همراه هوشمند زائر (طراح: کارت‌های خدمات + بنر تماس زمردی) — بی هیچ ادعای ساختگی؛ همه از سرور. */
export function Companion({ unitCode }: { unitCode: string | null }) {
  const guideFull = destHref("guideFull");
  const help = useQuery(helpQuery);
  const property = useQuery(propertyQuery);
  const config = useQuery(configQuery);
  const units = property.data?.flatMap((f) => f.units) ?? [];
  const unit = unitCode ? units.find((u) => u.code === unitCode) : undefined;
  // امکانات: واحد سفر پیش‌رو؛ وگرنه اشتراک امکانات همهٔ واحدها (آنچه همه جا هست).
  const features = unit
    ? unit.features
    : (units[0]?.features ?? []).filter((f) => units.every((u) => u.features.some((x) => x.code === f.code)));
  const cards = PICKS.flatMap(([cat, slug, icon]) => {
    const item = help.data?.categories.find((c) => c.slug === cat)?.items.find((i) => i.slug === slug);
    return item ? [{ item, icon }] : [];
  });
  const phone = config.data?.site.support_phone ?? help.data?.contact.phone ?? "";
  const address = config.data?.site.support_address ?? "";

  return (
    <section className="pt-section" aria-labelledby="pt-guide-title" id="companion">
      <SectionHead
        id="pt-guide-title"
        title="همراه هوشمند زائر؛ خدمات و راهنمای اقامت در جوار بارگاه"
        aside="خدمات ۱۰۰٪ رایگان و وقفی مهدیه"
      />
      {features.length ? (
        <div className="pt-amenities" role="group" aria-label={unit ? `امکانات ${unit.title}` : "امکانات همهٔ واحدها"}>
          <p>
            <Icon name="sparkle" size={16} />
            {unit ? (
              <span>
                امکانات واحد شما (<bdi className="latin">{unit.code}</bdi>):
              </span>
            ) : (
              "امکانات مشترک همهٔ واحدها:"
            )}
          </p>
          <ul>
            {features.map((f) => (
              <li key={f.code} data-highlight={f.is_highlight || undefined}>
                <Icon name={featureIcon(f.code)} size={16} /> {f.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {help.isPending ? (
        <div className="pt-guide">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton pt-guide-skel" aria-hidden="true" />
          ))}
        </div>
      ) : (
        <div className="pt-guide">
          {cards.map(({ item, icon }) => (
            <GuideCard key={item.slug} item={item} icon={icon} />
          ))}
        </div>
      )}

      <aside className="pt-hotline" aria-labelledby="pt-hotline-title">
        <div className="pt-hotline__copy">
          <h3 id="pt-hotline-title">
            <Icon name="phone" size={22} /> هماهنگی با پذیرش مهدیه
          </h3>
          <p>
            در صورت تأخیر در ورود، نیاز به راهنمایی مسیر منتهی به حرم، یا درخواست خدمات ویژهٔ سالمندان و توان‌یابان، با
            پذیرش تماس بگیرید.{address ? ` نشانی: ${address}` : ""}
          </p>
          {/* صفحهٔ راهنمای کامل (P-08) هنوز ساخته نشده ⇒ پیوند فقط پس از آماده شدن نمایش داده می‌شود */}
          {guideFull ? (
            <Link className="pt-hotline__more" href={guideFull}>
              راهنمای کامل زائر <Icon name="arrow-left" size={16} />
            </Link>
          ) : null}
        </div>
        {phone ? (
          <a className="pt-hotline__phone" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
            <Icon name="phone" size={20} />
            <bdi dir="ltr">{faDigits(phone)}</bdi>
          </a>
        ) : null}
      </aside>
    </section>
  );
}

function GuideCard({ item, icon }: { item: HelpItem; icon: IconName }) {
  return (
    <article className="pt-guide__card">
      <span className="pt-guide__icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <h3>{item.question}</h3>
        <p>{item.answer}</p>
        {item.steps.length ? (
          <ol>
            {item.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        ) : null}
      </div>
    </article>
  );
}
