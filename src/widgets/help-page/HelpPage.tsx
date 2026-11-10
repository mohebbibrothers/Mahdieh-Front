"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import { AccountTrigger } from "@/features/session/AccountButton";
import { helpQuery } from "@/shared/api/queries";
import { loadPrintFonts } from "@/shared/fonts";
import type { Help } from "@/shared/api/schemas";
import { faDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { ContactDesk } from "./ContactDesk";
import { FaqDeck } from "./FaqDeck";
import { HelpJsonLd } from "./HelpJsonLd";
import { ALL, flatten, quickTopics, resolveTarget, search, STEP_ICON } from "./model";
import { PrayerBoard } from "./PrayerBoard";
import { RulesBoard } from "./RulesBoard";
import { scrollToSection } from "./scroll";
import { helpStore, useHelpState } from "./store";

const STEP_LINK: Record<string, string> = {
  login: "ورود با پیامک",
  calendar: "تقویم زمان‌های آزاد",
  units: "مشاهدهٔ واحدها",
  my_reservations: "رزروهای من",
};

/** P-08 «راهنمای زائر»: جست‌وجوی فوری، گام‌ها، پرسش‌ها، قواعد زنده، اوقات شرعی و میز تماس. */
export function HelpPage() {
  const help = useQuery(helpQuery);
  const items = useMemo(() => flatten(help.data), [help.data]);
  return (
    <>
      <HelpHero help={help.data} items={items} failed={help.isError} onRetry={() => void help.refetch()} />
      <QuickSteps help={help.data} />
      <FaqDeck help={help.data} items={items} loading={help.isPending} />
      <RulesBoard help={help.data} />
      <PrayerBoard />
      <ContactDesk help={help.data} />
      {help.data ? <HelpJsonLd items={items} faq={help.data.faq} /> : null}
    </>
  );
}

function HelpHero({
  help,
  items,
  failed,
  onRetry,
}: {
  help: Help | undefined;
  items: ReturnType<typeof flatten>;
  failed: boolean;
  onRetry: () => void;
}) {
  const { q } = useHelpState();
  const input = useRef<HTMLInputElement>(null);
  const found = useMemo(() => search(items, q).length, [items, q]);
  const topics = quickTopics(help?.values);

  // «/» از هر جای صفحه ⇒ جست‌وجو (مگر هنگام تایپ در فیلدی دیگر) — قرارداد آشنای سایت‌های راهنما.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest("input, textarea, select, [contenteditable='true'], dialog[open]")) return;
    e.preventDefault();
    input.current?.focus();
  });
  // نوشتهٔ پیش از هیدراته‌شدن (اینترنت کند، کاربر تندنویس) گم نشود: پس از سوارشدن به وضعیت جست‌وجو برده می‌شود.
  useEffect(() => {
    const typed = input.current?.value ?? "";
    if (typed && typed !== helpStore.get().q) helpStore.set({ q: typed });
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  // فونت ایستای چاپی در زمان بیکاری (Ctrl+P هم برگی با حروف درست بسازد؛ فونت متغیر در PDF به‌هم می‌ریزد)
  useEffect(() => {
    const warm = window.setTimeout(() => void loadPrintFonts(), 1500);
    return () => window.clearTimeout(warm);
  }, []);

  const pill = failed
    ? "راهنما در دسترس نیست"
    : !help
      ? "در حال آماده‌سازی…"
      : q.trim()
        ? found
          ? `${faDigits(found)} پاسخ یافت شد`
          : "پاسخی یافت نشد"
        : `${faDigits(help.stats.questions)} پرسش در دسترس`;

  return (
    <section className="hp-hero" aria-labelledby="hp-title">
      <div className="hp-shell">
        <header className="hp-hero__head">
          <p className="hp-eyebrow">
            <Icon name="feather" size={16} />
            <span>راهنمای اقامت، قواعد رزرو و آیین‌های حرم رضوی</span>
          </p>
          <h1 id="hp-title" className="hp-hero__title">
            مرکز راهنمای زائر
          </h1>
          <p className="hp-hero__sub">
            پاسخ روشن و به‌روز به پرسش‌های ثبت‌نام، رزرو رایگان سانس‌ها، تحویل کلید، لغو و جابه‌جایی، نوبت انتظار و
            اوقات شرعی حرم مطهر حضرت علی بن موسی الرضا (ع) — همه با قواعد زندهٔ همین امروز سامانه.
          </p>
        </header>

        <form
          className="hp-search"
          role="search"
          aria-label="جست‌وجو در راهنما"
          onSubmit={(e) => {
            e.preventDefault();
            input.current?.blur();
            scrollToSection("faq");
          }}
        >
          <div className="hp-search__box">
            <Icon name="search" size={22} className="hp-search__icon" />
            <input
              ref={input}
              type="search"
              className="hp-search__input"
              value={q}
              maxLength={80}
              placeholder="پرسش یا موضوع را بنویسید (سهمیه، لغو، کلید)…"
              aria-label="جست‌وجو در پرسش‌ها و پاسخ‌ها"
              aria-describedby="hp-search-count"
              aria-controls="faq-panel"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => helpStore.set({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape" && q) {
                  e.preventDefault();
                  helpStore.set({ q: "" });
                }
              }}
            />
            {q ? (
              <button
                type="button"
                className="hp-search__clear"
                aria-label="پاک کردن جست‌وجو"
                onClick={() => {
                  helpStore.set({ q: "" });
                  input.current?.focus();
                }}
              >
                <Icon name="x" size={18} />
              </button>
            ) : (
              <kbd className="hp-search__kbd" aria-hidden="true">
                /
              </kbd>
            )}
            <span className="hp-search__pill" id="hp-search-count" role="status" data-empty={!found || undefined}>
              {pill}
            </span>
          </div>
          <p className="hp-search__caption" aria-hidden="true" data-empty={!found || undefined}>
            {pill}
          </p>
          {failed ? (
            <p className="hp-search__error" role="alert">
              بارگذاری راهنما ممکن نشد.{" "}
              <button type="button" className="btn btn-sm btn-secondary" onClick={onRetry}>
                <Icon name="refresh" size={16} /> تلاش دوباره
              </button>
            </p>
          ) : null}
          <div className="hp-topics">
            <span className="hp-topics__label">
              موضوعات پرتکرار<span className="hp-topics__colon">:</span>
            </span>
            {topics.map((t) => (
              <button
                key={t.label}
                type="button"
                className="hp-chip"
                aria-pressed={t.query ? q.trim() === t.query : undefined}
                onClick={() => {
                  if (t.anchor) return scrollToSection(t.anchor);
                  helpStore.set({ q: t.query ?? "", cat: ALL });
                  scrollToSection("faq");
                }}
              >
                {t.anchor ? <Icon name="prayer" size={14} /> : null}
                <bdi>{t.label}</bdi>
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}

function QuickSteps({ help }: { help: Help | undefined }) {
  const steps = help?.quick_steps ?? [];
  return (
    <section className="hp-band hp-steps" id="steps" aria-labelledby="hp-steps-title">
      <div className="hp-shell">
        <header className="hp-lead">
          <h2 id="hp-steps-title" className="hp-lead__title">
            رزرو رایگان در چهار حرکت کوتاه
          </h2>
          <p className="hp-lead__desc">
            مهمان‌نوازی مهدیه ساده و شفاف است: بی‌ودیعه، بی‌گذرواژه و بی‌مدارک پیچیده — فقط شمارهٔ همراه و چند لمس.
          </p>
        </header>
        <div className="hp-steps__wrap">
          <span className="hp-steps__track" aria-hidden="true" />
          <ol className="hp-steps__grid" aria-busy={!help || undefined}>
            {help
              ? steps.map((step, i) => {
                  const target = resolveTarget(step.target);
                  const label = STEP_LINK[step.target] ?? "ادامه";
                  const title = step.title.replace(/^[\d۰-۹]+\.\s*/, "");
                  return (
                    <li key={step.target} className="hp-step reveal">
                      <div className="hp-step__head">
                        <span className="hp-step__num" aria-hidden="true">
                          {faDigits(i + 1)}
                        </span>
                        <span className="hp-step__badge">
                          <bdi>{step.badge}</bdi>
                        </span>
                        <Icon name={STEP_ICON[step.target] ?? "check"} size={22} className="hp-step__icon" />
                      </div>
                      <h3 className="hp-step__title">
                        <span className="sr-only">گام {faDigits(i + 1)}: </span>
                        {title}
                      </h3>
                      <p className="hp-step__text">{step.text}</p>
                      {target?.kind === "link" ? (
                        <Link className="hp-step__link" href={target.href}>
                          <span>{label}</span>
                          <Icon name="arrow-left" size={16} />
                        </Link>
                      ) : target?.kind === "account" ? (
                        <AccountTrigger className="hp-step__link" guestReason="برای رزرو، با شمارهٔ همراه وارد شوید.">
                          <span>{label}</span>
                          <Icon name="arrow-left" size={16} />
                        </AccountTrigger>
                      ) : null}
                    </li>
                  );
                })
              : [0, 1, 2, 3].map((i) => <li key={i} className="hp-step hp-skel" aria-hidden="true" />)}
          </ol>
        </div>
      </div>
    </section>
  );
}
