"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { SITE } from "@/shared/config/site";
import { faCount, faDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/icon-names";
import { SHRINE_SVG } from "@/shared/ui/shrine.generated";
import type { Availability, CatalogUnit } from "./model";

const WIDE = "(min-width: 621px)";
const subscribeWide = (l: () => void) => {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", l);
  return () => m.removeEventListener("change", l);
};

/** سرصفحهٔ P-02: مسیر، عنوان دوخطی، وعده‌ها و راهنمای طبقات «از طبقه تا واحد». */
export function UnitsHero({
  units,
  avail,
  dated,
  loading,
  onUnit,
}: {
  units: CatalogUnit[];
  avail: Map<string, Availability> | null;
  dated: boolean;
  loading: boolean;
  onUnit: (code: string) => void;
}) {
  const suites = units.filter((u) => u.unit_type === "suite").length;
  const rooms = units.length - suites;
  const title = units.length ? `${faCount(units.length)} انتخاب برای آسودن.` : "انتخابی برای آسودن.";
  const lead = units.length
    ? `${faCount(suites)} سوئیت و ${faCount(rooms)} اتاق بزرگ؛ ظرفیت، دسترسی و امکانات را ببینید و با خیال روشن انتخاب کنید.`
    : "ظرفیت، دسترسی و امکانات هر واحد را ببینید و با خیال روشن انتخاب کنید.";
  return (
    <section className="uh" aria-labelledby="uh-title">
      <div className="page-shell uh__shell">
        <div className="uh__copy">
          <nav className="crumbs" aria-label="مسیر صفحه">
            <ol>
              <li>
                <Link href={SITE.routes.home}>صفحهٔ نخست</Link>
              </li>
              <li aria-current="page">واحدهای اقامتی</li>
            </ol>
          </nav>
          <p className="uh__eyebrow">به اندازهٔ سفر شما</p>
          <h1 id="uh-title" className="uh__title">
            <span className="uh__title-wide">
              یک خانه؛
              <span className="uh__title-accent">{title}</span>
            </span>
            <span className="uh__title-narrow">واحدهای اقامتی</span>
          </h1>
          <p className="uh__lead">{lead}</p>
          <ul className="uh__promises">
            <Promise icon="heart-hand">اقامت کاملاً رایگان</Promise>
            <Promise icon="eye">مشاهده بدون ورود</Promise>
            <Promise icon="shield-check">حکم نهایی با قواعد خود سامانه</Promise>
          </ul>
        </div>
        <FloorGuide units={units} avail={avail} dated={dated} loading={loading} onUnit={onUnit} />
      </div>
    </section>
  );
}

function Promise({ icon, children }: { icon: IconName; children: string }) {
  return (
    <li>
      <Icon name={icon} size={18} />
      {children}
    </li>
  );
}

function FloorGuide({
  units,
  avail,
  dated,
  loading,
  onUnit,
}: {
  units: CatalogUnit[];
  avail: Map<string, Availability> | null;
  dated: boolean;
  loading: boolean;
  onUnit: (code: string) => void;
}) {
  // باز/بسته: پیش‌فرض بر اساس اندازهٔ صفحه (دسکتاپ باز، گوشی بسته)؛ انتخاب کاربر بر آن مقدم است.
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? wide;
  const floors = [...new Set(units.map((u) => u.floor_number))].sort((a, b) => b - a);
  return (
    <section className="ufg" data-open={choice === null ? "auto" : String(choice)} aria-labelledby="ufg-title">
      <header className="ufg__head">
        <div>
          <small>خانه را بشناسید</small>
          <h2 id="ufg-title">از طبقه تا واحد</h2>
        </div>
        <button
          type="button"
          className="icon-button ufg__toggle"
          aria-expanded={open}
          aria-controls="ufg-body"
          onClick={() => setChoice(!open)}
        >
          <Icon name="chevron-down" size={18} />
          <span className="sr-only">{open ? "بستن راهنمای طبقات" : "باز کردن راهنمای طبقات"}</span>
        </button>
      </header>
      <div className="ufg__body" id="ufg-body">
        {loading && !units.length ? (
          <div className="ufg__tiers" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="ufg__tier">
                <span className="skeleton ufg__sk-label" />
                <span className="skeleton ufg__sk-unit" />
                <span className="skeleton ufg__sk-unit" />
              </div>
            ))}
          </div>
        ) : (
          <ol className="ufg__tiers">
            {floors.map((n) => {
              const row = units.filter((u) => u.floor_number === n);
              return (
                <li key={n} className="ufg__tier">
                  <span className="ufg__floor">
                    طبقه <b>{faDigits(n)}</b>
                  </span>
                  <ul className="ufg__units" data-count={row.length}>
                    {row.map((u) => {
                      const a = avail?.get(u.code);
                      const mark =
                        dated && a ? (a.kind === "free" ? "free" : a.kind === "loading" ? null : "busy") : null;
                      return (
                        <li key={u.code}>
                          <button
                            type="button"
                            className="ufg__unit"
                            data-mark={mark ?? undefined}
                            onClick={() => onUnit(u.code)}
                          >
                            <span>{u.type_label}</span>
                            {mark ? <small className="ufg__mark">{mark === "free" ? "آزاد" : "پر"}</small> : null}
                            <bdi className="latin ufg__code">{u.code}</bdi>
                            <span className="sr-only"> — نگاه کوتاه</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
        <p className="ufg__foot">
          <Icon name="mouse-pointer" size={14} />
          <span>
            روی کد هر واحد بزنید؛ معرفی کوتاهش باز می‌شود.
            {dated ? " نشان «آزاد» یعنی کل بازهٔ سفرتان در آن واحد آزاد است." : ""}
          </span>
        </p>
      </div>
    </section>
  );
}

const TIPS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "users",
    title: "همهٔ همسفران را بشمارید",
    text: "تعداد کل افراد، شامل بزرگسال و کودک، باید در ظرفیت همان واحد جا بگیرد.",
  },
  {
    icon: "stairs",
    title: "به مسیر دسترسی توجه کنید",
    text: "یادداشت دسترسیِ طبقه را در معرفی هر واحد ببینید؛ به‌ویژه اگر همراه کم‌توان دارید.",
  },
  {
    icon: "calendar-check",
    title: "تمام زمان سفر را بررسی کنید",
    text: "آزادیِ روز ورود کافی نیست؛ همهٔ نیم‌روزهای اقامت باید پیوسته آزاد باشند.",
  },
];

/** «سه نکته، پیش از انتخاب واحد» + فراخوان «راهنمای مقایسه». */
export function UnitsTips({ onHelp }: { onHelp: () => void }) {
  return (
    <>
      <section className="page-shell utips" aria-labelledby="utips-title">
        <p className="uh__eyebrow">برای انتخابی آسوده‌تر</p>
        <h2 id="utips-title">سه نکته، پیش از انتخاب واحد</h2>
        <ol className="utips__list">
          {TIPS.map((t) => (
            <li key={t.title}>
              <span className="utips__icon" aria-hidden="true">
                <Icon name={t.icon} size={20} />
              </span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="page-shell uhelp" aria-labelledby="uhelp-title">
        <div className="uhelp__card">
          <span className="uhelp__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHRINE_SVG }} />
          <div className="uhelp__text">
            <h2 id="uhelp-title">هنوز بین چند فضا مردد هستید؟</h2>
            <p>آن‌ها را کنار هم مقایسه کنید؛ انتخاب خوب، از روشن بودن تفاوت‌ها می‌آید.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={onHelp}>
            <Icon name="compare" size={18} /> راهنمای مقایسه
          </button>
        </div>
      </section>
    </>
  );
}
