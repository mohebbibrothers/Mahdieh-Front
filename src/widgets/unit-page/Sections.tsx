"use client";
import { featureIcon, floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import type { Policies } from "@/shared/api/policies";
import type { UnitDetail } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { SITE } from "@/shared/config/site";
import { durationLabel, faDigits, guestsLabel, latinDigits } from "@/shared/lib/fa";
import { useActiveSection } from "@/shared/lib/use-active-section";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import type { CatalogUnit } from "@/widgets/units-page/model";
import { composition } from "@/widgets/units-page/UnitCard";
import { goUnit } from "./store";

/* ── نوار عنوان ───────────────────────────────────────────────────────── */

export function TitleBand({
  unit,
  floorTitle,
  onSwitch,
}: {
  unit: UnitDetail;
  floorTitle: string;
  onSwitch: () => void;
}) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${unit.title} · مهدیه`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("نشانی این واحد با شرایط سفر شما کپی شد.", "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast("کپی خودکار ممکن نشد؛ نشانی را از نوار مرورگر بردارید.", "warn");
    }
  };
  return (
    <section className="ud-band" aria-labelledby="ud-title">
      <div className="page-shell">
        <nav className="crumbs ud-crumbs" aria-label="مسیر صفحه">
          <ol>
            <li>
              <a href={SITE.routes.home}>خانه</a>
            </li>
            <li>
              <a href={destHref("units")}>واحدها</a>
            </li>
            <li aria-current="page">{unit.title}</li>
          </ol>
        </nav>
        <div className="ud-band__row">
          <div className="ud-band__copy">
            <p className="ud-eyebrow">برای مکثی آرام، میان ساعت‌های زیارت</p>
            <h1 id="ud-title">{unit.title}</h1>
            <ul className="ud-band__meta">
              <li>
                <bdi className="ud-code latin">{unit.code}</bdi>
                <span className="sr-only">کد عمومی واحد</span>
              </li>
              <li>
                <Icon name={unitTypeIcon(unit.unit_type)} size={16} />
                <span>{unit.type_label}</span>
              </li>
              <li>
                <Icon name="building" size={16} />
                <span>{floorTitle || floorLabel(unit.floor_number)}</span>
              </li>
              <li>
                <Icon name="users" size={16} />
                <span>ظرفیت کل {guestsLabel(unit.capacity_total)}</span>
              </li>
            </ul>
          </div>
          <div className="ud-band__actions">
            <button type="button" className="btn btn-secondary ud-switch" onClick={onSwitch} aria-haspopup="dialog">
              <Icon name="layers" size={18} /> واحد دیگری ببینم
            </button>
            <button type="button" className="icon-button ud-icon-btn" onClick={() => void share()}>
              <Icon name="share" size={18} />
              <span className="sr-only">اشتراک‌گذاری نشانی این واحد</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── سه واقعیت اصلی ───────────────────────────────────────────────────── */

export function Facts({ unit, floorTitle }: { unit: UnitDetail; floorTitle: string }) {
  const mix = composition(unit);
  return (
    <ul className="ud-facts" aria-label="خلاصهٔ واحد">
      <li>
        <Icon name="users" size={22} />
        <span>
          <strong>تا {guestsLabel(unit.capacity_total)}</strong>
          <small>{mix ?? "ظرفیت ثبت‌شده در سامانه"}</small>
        </span>
      </li>
      <li>
        <Icon name="building" size={22} />
        <span>
          <strong>{floorTitle || floorLabel(unit.floor_number)}</strong>
          <small>
            کد عمومی <bdi className="latin">{unit.code}</bdi>
          </small>
        </span>
      </li>
      <li>
        <Icon name="heart-hand" size={22} />
        <span>
          <strong>کاملاً رایگان</strong>
          <small>بدون درگاه پرداخت</small>
        </span>
      </li>
    </ul>
  );
}

/* ── ناوبری بخش‌ها (scroll-spy) ───────────────────────────────────────── */

const SECTIONS = [
  { id: "ud-features", label: "امکانات" },
  { id: "ud-access", label: "مسیر دسترسی" },
  { id: "ud-availability", label: "زمان‌های آزاد" },
  { id: "ud-policies", label: "پیش از اقامت" },
] as const;
const SECTION_IDS = SECTIONS.map((s) => s.id);

export function SectionNav() {
  const active = useActiveSection(SECTION_IDS, "ud-features");
  return (
    <nav className="ud-nav" aria-label="بخش‌های این صفحه" data-float-scroll="">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}>
          {s.label}
        </a>
      ))}
    </nav>
  );
}

/* ── امکانات ──────────────────────────────────────────────────────────── */

export function SectionHead({
  id,
  kicker,
  title,
  aside,
}: {
  id: string;
  kicker: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="ud-head">
      <div>
        <p>{kicker}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {aside}
    </header>
  );
}

export function FeaturesSection({ unit, onInfo }: { unit: UnitDetail; onInfo: (code: string) => void }) {
  return (
    <section id="ud-features" className="ud-section" aria-labelledby="ud-features-title">
      <SectionHead
        id="ud-features-title"
        kicker="آنچه در اطلاعات واحد آمده است"
        title="امکانات، روشن و بی‌ابهام"
        aside={<span className="ud-count">{faDigits(unit.features.length)} مورد</span>}
      />
      {unit.features.length ? (
        <ul className="ud-features">
          {unit.features.map((f) => (
            <li key={f.code}>
              <button
                type="button"
                className="ud-feature"
                data-highlight={f.is_highlight || undefined}
                onClick={() => onInfo(f.code)}
                aria-haspopup="dialog"
              >
                <Icon name={featureIcon(f.code)} size={20} />
                <span>
                  {f.title}
                  {f.note ? <small>{f.note}</small> : null}
                </span>
                <Icon name="info" size={16} className="ud-feature__info" />
                <span className="sr-only">توضیح بیشتر</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ud-empty">برای این واحد هنوز امکاناتی در سامانه ثبت نشده است.</p>
      )}
      <p className="ud-footnote">
        <Icon name="info" size={16} />
        <span>این فهرست، امکانات ثبت‌شده را نشان می‌دهد؛ نبود یک مورد در آن، به معنی نبود قطعی آن در مجموعه نیست.</span>
      </p>
    </section>
  );
}

/* ── دسترسی ───────────────────────────────────────────────────────────── */

export function AccessCard({
  floorTitle,
  access,
  hasElevator,
  supportPhone,
}: {
  floorTitle: string;
  access: string;
  hasElevator: boolean;
  supportPhone: string;
}) {
  const tel = latinDigits(supportPhone).replace(/[^\d+]/g, "");
  return (
    <section id="ud-access" className="ud-access" aria-labelledby="ud-access-title">
      <span className="ud-access__icon" aria-hidden="true">
        <Icon name="stairs" size={24} />
      </span>
      <div>
        <p className="ud-eyebrow">با توجه به شرایط همسفران</p>
        <h2 id="ud-access-title">مسیر رسیدن به واحد</h2>
        <p className="ud-access__note">
          {access || `هنوز یادداشت دسترسی برای ${floorTitle || "این طبقه"} ثبت نشده است.`}
        </p>
        <small>
          یادداشت دسترسی از اطلاعات طبقه می‌آید.
          {hasElevator ? " آسانسور در امکانات این واحد ثبت شده است." : ""} اگر همراه کم‌توان دارید، شرایط واقعی مسیر را
          پیش از سفر تأیید کنید.
        </small>
        {tel ? (
          <a className="ud-text-action" href={`tel:${tel}`}>
            <Icon name="phone" size={16} /> هماهنگی با پذیرش <bdi dir="ltr">{supportPhone}</bdi>
          </a>
        ) : null}
      </div>
    </section>
  );
}

/* ── قرارها و پرسش‌ها ─────────────────────────────────────────────────── */

export function PoliciesSection({ policies, hasPhotos }: { policies: Policies; hasPhotos: boolean }) {
  const cards = [
    { icon: "heart-hand", title: "رزرو و اقامت رایگان", body: "در هیچ مرحله‌ای پرداخت بانکی نداریم." },
    {
      icon: "clock",
      title: `${durationLabel(policies.minCells)} تا ${durationLabel(policies.maxCells)}`,
      body: `مدت مجاز هر اقامت؛ ورود از ${faDigits(policies.minLeadHours)} ساعت بعد تا ${faDigits(policies.horizonDays)} روز آینده.`,
    },
    {
      icon: "calendar-x",
      title: `لغو تا ${faDigits(policies.cancelFreeHours)} ساعت پیش از ورود`,
      body: `در لغو دیرهنگام، محدودیت ${faDigits(policies.lateCancelCooldownHours)} ساعتهٔ رزرو بعدی ممکن است اعمال شود؛ هزینه‌ای دریافت نمی‌شود.`,
    },
    {
      icon: "ticket",
      title: "یک فرصت برای همه",
      body: `حداکثر ${faDigits(policies.maxActive)} رزرو فعال برای هر حساب و ${faDigits(policies.cellsPerWindow)} نیم‌روز در هر ${faDigits(policies.windowDays)} روز؛ شرایط دقیق پیش از ثبت بررسی می‌شود.`,
    },
  ] as const;
  const faq = [
    {
      q: "آیا عکس و چیدمان این صفحه واقعی است؟",
      a: hasPhotos
        ? "عکس‌های بخش «تصاویر» را مدیریت زائرسرا ثبت کرده است. «نمای فضا» و «پلان شماتیک» مفهومی و بدون مقیاس‌اند؛ چیدمان، تعداد تخت و ابعاد واقعی از آن‌ها قابل نتیجه‌گیری نیست."
        : "هنوز عکس واقعی برای این واحد ثبت نشده است. تصویرسازی‌ها و پلان‌ها مفهومی، بدون مقیاس و برای معرفی بصری‌اند؛ چیدمان، تعداد تخت و ابعاد واقعی از آن‌ها قابل نتیجه‌گیری نیست.",
    },
    {
      q: "اگر یک نیم‌روز آزاد باشد، همهٔ اقامت هم آزاد است؟",
      a: "خیر. تمام نیم‌روزهای ورود تا خروج باید پیوسته آزاد باشند. خانهٔ رزروشده یا زمان نظافت حتی در میانهٔ سفر، مانع انتخاب همان بازه است.",
    },
    {
      q: "برای دیدن واحد یا زمان‌ها باید وارد شوم؟",
      a: "خیر. معرفی و زمان‌های عمومی بدون حساب قابل مشاهده‌اند. برای ادامهٔ رزرو، ورود تلفنی، تکمیل اطلاعات هویتی و بررسی سهمیه لازم است؛ ایمیل یا پرداخت بانکی نمی‌خواهیم.",
    },
  ];
  return (
    <section id="ud-policies" className="ud-section" aria-labelledby="ud-policies-title">
      <SectionHead id="ud-policies-title" kicker="پیش از انتخاب نهایی" title="چند قرار برای آسودگی همه" />
      <ul className="ud-policies">
        {cards.map((c) => (
          <li key={c.icon}>
            <Icon name={c.icon} size={20} />
            <strong>{c.title}</strong>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>
      <div className="ud-faq">
        {faq.map((f) => (
          <details key={f.q}>
            <summary>
              <span>{f.q}</span>
              <Icon name="plus" size={18} />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ── فضاهای دیگر ──────────────────────────────────────────────────────── */

export function RelatedSection({
  units,
  guests,
  onPrefetch,
}: {
  units: CatalogUnit[];
  guests: number;
  onPrefetch: (code: string) => void;
}) {
  if (!units.length) return null;
  return (
    <section className="ud-section" aria-labelledby="ud-related-title">
      <SectionHead
        id="ud-related-title"
        kicker="انتخاب را محدود نکنید"
        title="فضاهای دیگر همین خانه"
        aside={
          <a className="ud-text-action" href={destHref("units")}>
            همهٔ واحدها <Icon name="arrow-left" size={16} />
          </a>
        }
      />
      <ul className="ud-related">
        {units.map((u) => (
          <li key={u.code}>
            <a
              className="ud-unit-link"
              href={`/units/${u.code}/`}
              onClick={(e) => goUnit(e, u.code)}
              onPointerEnter={() => onPrefetch(u.code)}
              onFocus={() => onPrefetch(u.code)}
            >
              <bdi className="ud-unit-link__code latin">{u.code}</bdi>
              <span>
                <strong>{u.title}</strong>
                <small>
                  ظرفیت کل {guestsLabel(u.capacity_total)} · {u.type_label}
                  {u.capacity_total < guests ? " · برای گروه فعلی کوچک است" : ""}
                </small>
              </span>
              <Icon name="arrow-left" size={16} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
