"use client";
import Link from "next/link";
import { Fragment, useEffect, useEffectEvent, useId, useMemo, useState, type KeyboardEvent } from "react";
import { AccountTrigger } from "@/features/session/AccountButton";
import { ApiError } from "@/shared/api/client";
import { sendHelpFeedback } from "@/shared/api/queries";
import type { Help } from "@/shared/api/schemas";
import { copyText } from "@/shared/lib/clipboard";
import { faDigits } from "@/shared/lib/fa";
import { revealInRail, useScrollRail } from "@/shared/lib/use-scroll-rail";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { RailFrame } from "@/shared/ui/RailFrame";
import {
  ALL,
  CATEGORY_ICON,
  highlight,
  ITEM_HASH,
  resolveTarget,
  search,
  searchTokens,
  snippetOf,
  type FlatItem,
} from "./model";
import { scrollToSection } from "./scroll";
import { helpStore, useHelpState, useVotes, voteStore, type Vote } from "./store";

function Hl({ text, q }: { text: string; q: string }) {
  const parts = useMemo(() => highlight(text, q), [text, q]);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="hp-mark">
            {p.text}
          </mark>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}

const itemUrl = (slug: string) => {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = `${ITEM_HASH}${slug}`;
  return url.toString();
};

/** دسته‌ها (زبانه با شمار زنده)، نوار وضعیت/باز و بستن همه، و کارت‌های پرسش و پاسخ. */
export function FaqDeck({ help, items, loading }: { help: Help | undefined; items: FlatItem[]; loading: boolean }) {
  const { q, cat, open } = useHelpState();
  const votes = useVotes();
  const matches = useMemo(() => search(items, q), [items, q]);
  const searching = searchTokens(q).length > 0;
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of matches) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [matches]);
  const categories = help?.categories ?? [];
  const activeCat = cat !== ALL && categories.some((c) => c.slug === cat) ? cat : ALL;
  const visible = activeCat === ALL ? matches : matches.filter((i) => i.category === activeCat);
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);
  const openSet = new Set(open);
  const allOpen = visible.length > 0 && visible.every((i) => openSet.has(i.slug));
  const [attachRail, railEdges, stepRail] = useScrollRail<HTMLDivElement>();

  /**
   * یک پرسش را آشکار می‌کند (اگر زیر فیلتر پنهان است، فیلتر برداشته می‌شود)، باز و به آن پیمایش می‌کند.
   * ‎focus‎: کلیک «پرسش مرتبط» درون صفحه ⇒ فوکوس جابه‌جا می‌شود (کاربر صفحه‌کلید سر جایش می‌ماند)؛
   * رسیدن از پیوند بیرونی ⇒ فقط درخشش طلایی کارت، بی حلقهٔ فوکوس ناخواسته برای کاربر موس.
   */
  const reveal = (slug: string, focus = true) => {
    if (!bySlug.has(slug)) return;
    const shown = visible.some((i) => i.slug === slug);
    helpStore.set((s) => ({
      ...(shown ? {} : { q: "", cat: ALL }),
      open: s.open.includes(slug) ? s.open : [...s.open, slug],
    }));
    window.setTimeout(() => {
      const el = document.getElementById(`${ITEM_HASH}${slug}`);
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (focus) el.querySelector<HTMLElement>(".hp-faq__head")?.focus({ preventScroll: true });
      el.removeAttribute("data-flash");
      void el.offsetWidth; // آغاز دوبارهٔ درخشش اگر همان کارت دوباره هدف شد
      el.setAttribute("data-flash", "");
      el.addEventListener("animationend", () => el.removeAttribute("data-flash"), { once: true });
    }, 60);
  };

  // پیوند عمیق ‎#item-slug‎ (نشانی قدیمی SSR هم همین است): پس از رسیدن داده و با هر تغییر هش.
  const onHash = useEffectEvent(() => {
    const h = window.location.hash;
    if (h.startsWith(`#${ITEM_HASH}`)) reveal(decodeURIComponent(h.slice(ITEM_HASH.length + 1)), false);
  });
  const ready = Boolean(help);
  useEffect(() => {
    if (!ready) return;
    onHash();
    const fn = () => onHash();
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, [ready]);

  const selectTab = (slug: string) => helpStore.set({ cat: slug });
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    // راست‌به‌چپ: «چپ» یعنی زبانهٔ بعدی.
    const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    let next = step ? (at + step + list.length) % list.length : -1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = list.length - 1;
    if (next < 0) return;
    e.preventDefault();
    list[next]?.focus();
    list[next]?.click();
  };

  const activeTitle = categories.find((c) => c.slug === activeCat)?.title;
  const status = !help
    ? "در حال آماده‌سازی پرسش‌ها…"
    : searching
      ? visible.length
        ? `${faDigits(visible.length)} پاسخ برای «${q.trim()}»${activeTitle ? ` در «${activeTitle}»` : ""}`
        : `پاسخی برای «${q.trim()}»${activeTitle ? ` در «${activeTitle}»` : ""} نیافتیم`
      : activeTitle
        ? `${faDigits(visible.length)} پرسش در «${activeTitle}»`
        : `${faDigits(help.stats.questions)} پرسش پرتکرار زائران، با پاسخ رسمی خادمان مهدیه`;

  return (
    <section className="hp-band hp-faqs" id="faq" aria-labelledby="hp-faq-title">
      <div className="hp-shell">
        <header className="hp-lead">
          <h2 id="hp-faq-title" className="hp-lead__title">
            پرسش‌های پرتکرار زائران
          </h2>
          <p className="hp-lead__desc">
            موضوع را برگزینید یا بالاتر جست‌وجو کنید؛ هر پاسخ با عددهای زندهٔ سامانه نوشته شده و اگر قاعده‌ای عوض شود،
            این‌جا هم همان لحظه به‌روز است.
          </p>
        </header>

        <RailFrame edges={railEdges} onStep={stepRail} className="hp-cats-frame">
          <div
            ref={attachRail}
            className="hp-cats"
            role="tablist"
            aria-label="دسته‌بندی پرسش‌ها"
            onKeyDown={onTabKey}
            data-float-scroll=""
            tabIndex={-1}
          >
            {[{ slug: ALL, title: "همهٔ موضوعات" }, ...categories].map((c) => {
              const selected = activeCat === c.slug;
              const n = c.slug === ALL ? matches.length : (counts.get(c.slug) ?? 0);
              return (
                <button
                  key={c.slug}
                  type="button"
                  role="tab"
                  id={`hp-tab-${c.slug}`}
                  aria-selected={selected}
                  aria-controls="faq-panel"
                  tabIndex={selected ? 0 : -1}
                  className="hp-cat"
                  data-zero={(help && n === 0) || undefined}
                  onClick={(e) => {
                    selectTab(c.slug);
                    revealInRail(e.currentTarget);
                  }}
                >
                  <Icon name={c.slug === ALL ? "grid" : (CATEGORY_ICON[c.slug] ?? "info")} size={18} />
                  <span>{c.title}</span>
                  <span className="hp-cat__count">
                    {help ? faDigits(n) : "…"}
                    <span className="sr-only"> پرسش</span>
                  </span>
                </button>
              );
            })}
          </div>
        </RailFrame>

        <div className="hp-controls">
          <p className="hp-controls__status" role="status">
            <span className="hp-pulse" aria-hidden="true" />
            <span>{status}</span>
          </p>
          <div className="hp-controls__group" role="group" aria-label="باز و بسته کردن پرسش‌ها">
            <button
              type="button"
              className="hp-toggle"
              disabled={!visible.length || allOpen}
              onClick={() => helpStore.set((s) => ({ open: [...new Set([...s.open, ...visible.map((i) => i.slug)])] }))}
            >
              <Icon name="expand" size={16} />
              <span>بازکردن همه</span>
            </button>
            <button
              type="button"
              className="hp-toggle"
              disabled={!open.length}
              onClick={() => helpStore.set({ open: [] })}
            >
              <Icon name="minus" size={16} />
              <span>بستن همه</span>
            </button>
          </div>
        </div>

        <div
          id="faq-panel"
          className="hp-faq-list"
          role="tabpanel"
          aria-labelledby={`hp-tab-${activeCat}`}
          aria-busy={loading || undefined}
        >
          {!help ? (
            [0, 1, 2, 3, 4].map((i) => <div key={i} className="hp-faq hp-skel" aria-hidden="true" />)
          ) : visible.length ? (
            visible.map((item) => (
              <FaqCard
                key={item.slug}
                item={item}
                q={q}
                searching={searching}
                open={openSet.has(item.slug)}
                showCategory={activeCat === ALL}
                vote={votes[item.slug]}
                relatedTitle={(slug) => bySlug.get(slug)?.question}
                onReveal={reveal}
              />
            ))
          ) : (
            <div className="hp-empty">
              <Icon name="search" size={28} />
              <h3>پرسشی متناسب با «{q.trim() || activeTitle}» نیافتیم</h3>
              <p>واژهٔ کوتاه‌تر یا هم‌معنایی را امتحان کنید، یا مستقیم با پذیرش زائرسرا در تماس باشید.</p>
              <div className="hp-empty__actions">
                <button type="button" className="btn btn-primary" onClick={() => helpStore.set({ q: "", cat: ALL })}>
                  نمایش همهٔ {faDigits(help.stats.questions)} پرسش
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => scrollToSection("contact-desk")}>
                  <Icon name="phone" size={18} /> تماس با پذیرش
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FaqCard({
  item,
  q,
  searching,
  open,
  showCategory,
  vote,
  relatedTitle,
  onReveal,
}: {
  item: FlatItem;
  q: string;
  searching: boolean;
  open: boolean;
  showCategory: boolean;
  vote: Vote | undefined;
  relatedTitle: (slug: string) => string | undefined;
  onReveal: (slug: string) => void;
}) {
  const id = useId();
  const headId = `${id}-h`;
  const panelId = `${id}-p`;
  const snippet = searching && !open ? snippetOf(item.answer, q) : "";
  const target = item.action ? resolveTarget(item.action.target) : null;
  const related = item.related.flatMap((slug) => {
    const title = relatedTitle(slug);
    return title ? [{ slug, title }] : [];
  });

  const copyAnswer = async () => {
    const text = [
      item.question,
      item.answer,
      ...item.steps.map((s, i) => `${faDigits(i + 1)}. ${s}`),
      itemUrl(item.slug),
    ]
      .filter(Boolean)
      .join("\n");
    if (await copyText(text)) toast("پرسش و پاسخ کپی شد.", "success");
    else toast("کپی خودکار ممکن نشد؛ متن را دستی انتخاب کنید.", "warn");
  };
  const share = async () => {
    const url = itemUrl(item.slug);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `${item.question} · راهنمای مهدیه`, url });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    if (await copyText(url)) toast("پیوند مستقیم این پرسش کپی شد.", "success");
    else toast("کپی خودکار ممکن نشد؛ نشانی را از نوار مرورگر بردارید.", "warn");
  };

  return (
    <article className="hp-faq" id={`${ITEM_HASH}${item.slug}`} data-open={open || undefined}>
      <h3 className="hp-faq__h">
        <button
          type="button"
          id={headId}
          className="hp-faq__head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => helpStore.toggle(item.slug, !open)}
        >
          <span className="hp-faq__badge" aria-hidden="true">
            ؟
          </span>
          <span className="hp-faq__q">
            <span className="hp-faq__qt">
              <Hl text={item.question} q={q} />
            </span>
            {snippet ? (
              <span className="hp-faq__snip">
                <Hl text={snippet} q={q} />
              </span>
            ) : null}
          </span>
          {showCategory ? <span className="hp-faq__cat">{item.categoryTitle}</span> : null}
          <span className="hp-faq__chev" aria-hidden="true">
            <Icon name="chevron-down" size={20} />
          </span>
        </button>
      </h3>
      <div className="hp-faq__panel" id={panelId} role="region" aria-labelledby={headId} inert={!open}>
        <div className="hp-faq__clip">
          <div className="hp-faq__body">
            <p className="hp-faq__answer">
              <Hl text={item.answer} q={q} />
            </p>
            {item.steps.length ? (
              <div className="hp-faq__steps">
                <p className="hp-faq__steps-title">
                  <Icon name="list" size={16} />
                  <span>گام‌به‌گام</span>
                </p>
                <ol>
                  {item.steps.map((s) => (
                    <li key={s}>
                      <Hl text={s} q={q} />
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {related.length ? (
              <nav className="hp-faq__related" aria-label="پرسش‌های مرتبط">
                <span className="hp-faq__related-label">پرسش‌های مرتبط:</span>
                <ul>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <a
                        href={`#${ITEM_HASH}${r.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onReveal(r.slug);
                        }}
                      >
                        {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <div className="hp-faq__foot">
              {item.tags.length ? (
                <ul className="hp-faq__tags" aria-label="برچسب‌ها — با لمس، همان را جست‌وجو کنید">
                  {item.tags.map((t) => (
                    <li key={t}>
                      <button
                        type="button"
                        className="hp-tag"
                        onClick={() => {
                          helpStore.set({ q: t, cat: ALL });
                          scrollToSection("faq");
                        }}
                      >
                        #{t.replace(/\s+/g, "_")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="hp-faq__actions">
                <button type="button" className="hp-mini" onClick={() => void copyAnswer()}>
                  <Icon name="copy" size={14} />
                  <span>کپی پاسخ</span>
                </button>
                <button type="button" className="hp-mini" onClick={() => void share()}>
                  <Icon name="link" size={14} />
                  <span>پیوند</span>
                </button>
                <Helpful slug={item.slug} vote={vote} />
                {item.action && target?.kind === "link" ? (
                  <Link className="hp-faq__action" href={target.href}>
                    <span>{item.action.label}</span>
                    <Icon name="arrow-left" size={16} />
                  </Link>
                ) : item.action && target?.kind === "account" ? (
                  <AccountTrigger className="hp-faq__action" guestReason="با شمارهٔ همراه وارد شوید.">
                    <span>{item.action.label}</span>
                    <Icon name="arrow-left" size={16} />
                  </AccountTrigger>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** «مفید بود؟» — رأی بی‌نام (یک بار برای هر پرسش در این مرورگر)؛ «نه» راه تماس را پیش رو می‌گذارد. */
function Helpful({ slug, vote }: { slug: string; vote: Vote | undefined }) {
  const [busy, setBusy] = useState<Vote | null>(null);
  const send = async (v: Vote) => {
    setBusy(v);
    try {
      await sendHelpFeedback(slug, v === "yes");
      voteStore.record(slug, v);
      toast(v === "yes" ? "سپاس! نظر شما ثبت شد." : "سپاس؛ این پاسخ برای بهترشدن بررسی می‌شود.", "success");
    } catch (e) {
      const limited = e instanceof ApiError && e.status === 429;
      toast(
        limited
          ? "نظرهای زیادی پشت سر هم ثبت شد؛ کمی بعد دوباره امتحان کنید."
          : "ثبت نظر ممکن نشد؛ دوباره امتحان کنید.",
        "warn",
      );
    } finally {
      setBusy(null);
    }
  };
  if (vote) {
    return (
      <p className="hp-helpful hp-helpful--done">
        <Icon name="check" size={14} />
        <span>{vote === "yes" ? "نظر شما ثبت شد" : "پاسخ کامل نبود؟"}</span>
        {vote === "no" ? (
          <button type="button" className="hp-helpful__link" onClick={() => scrollToSection("contact-desk")}>
            تماس با پذیرش
          </button>
        ) : null}
      </p>
    );
  }
  return (
    <div className="hp-helpful" role="group" aria-label="این پاسخ مفید بود؟">
      <span aria-hidden="true">مفید بود؟</span>
      <button
        type="button"
        className="hp-thumb"
        disabled={busy !== null}
        aria-busy={busy === "yes" || undefined}
        onClick={() => void send("yes")}
      >
        <Icon name="thumbs-up" size={14} />
        <span>بله</span>
      </button>
      <button
        type="button"
        className="hp-thumb"
        disabled={busy !== null}
        aria-busy={busy === "no" || undefined}
        onClick={() => void send("no")}
      >
        <Icon name="thumbs-down" size={14} />
        <span>نه</span>
      </button>
    </div>
  );
}
