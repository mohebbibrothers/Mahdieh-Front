"use client";
import { useDeferredValue, useId, useState } from "react";
import type { Help } from "@/shared/api/schemas";
import { latinDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon, type IconName } from "@/shared/ui/Icon";

/** آیکون دسته‌ها (بک‌اند ایموجی می‌دهد؛ رابط با مجموعه‌آیکون خودش یکدست می‌ماند). */
const CATEGORY_ICON: Record<string, IconName> = {
  before: "user",
  booking: "calendar",
  change: "refresh",
  waitlist: "clock",
  stay: "home",
  trouble: "wrench",
};

/** یکسان‌سازی برای جست‌وجو: ی/ک عربی، نیم‌فاصله و رقم‌ها. */
const norm = (s: string) =>
  latinDigits(s)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s]+/g, " ")
    .trim()
    .toLowerCase();

/**
 * «پرسش دیگری دارید؟» ⇒ همهٔ پرسش‌های ‎/help‎ (با قواعد زندهٔ سامانه) در یک پنجرهٔ درون‌برنامه‌ای،
 * با جست‌وجوی فوری و راه تماس پذیرش — به‌جای رفتن به صفحهٔ قدیمی.
 */
export function HelpCenter({ help }: { help: Help | undefined }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = norm(useDeferredValue(query));
  const searchId = useId();
  const categories = (help?.categories ?? [])
    .map((c) => ({
      ...c,
      items: q ? c.items.filter((i) => norm(`${i.question} ${i.answer}`).includes(q)) : c.items,
    }))
    .filter((c) => c.items.length > 0);
  const contact = help?.contact ?? {};
  const phone = contact.phone ?? "";

  return (
    <>
      <button type="button" className="section-link faq-link" onClick={() => setOpen(true)}>
        پرسش دیگری دارید؟ <Icon name="arrow-left" size={16} />
      </button>
      <AppDialog
        isOpen={open}
        onOpenChange={setOpen}
        size="lg"
        title="راهنمای زائر"
        subtitle={help?.note ?? "پاسخ پرسش‌های پرتکرار، با قواعد فعلی سامانه"}
      >
        <div className="help-center">
          <label className="help-search" htmlFor={searchId}>
            <Icon name="search" size={18} />
            <span className="sr-only">جست‌وجو در پرسش‌ها</span>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً: لغو، نیم‌روز، پیامک…"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
          <p className="sr-only" aria-live="polite">
            {q ? `${categories.reduce((n, c) => n + c.items.length, 0)} پرسش پیدا شد` : ""}
          </p>

          {categories.map((c) => (
            <section key={c.slug} className="help-category" aria-labelledby={`help-${c.slug}`}>
              <h3 id={`help-${c.slug}`}>
                <span className="help-category__icon" aria-hidden="true">
                  <Icon name={CATEGORY_ICON[c.slug] ?? "info"} size={16} />
                </span>
                {c.title}
              </h3>
              {c.items.map((i) => (
                <details key={i.slug} name="help-center" open={Boolean(q) && c.items.length === 1}>
                  <summary>
                    {i.question} <Icon name="plus" size={16} />
                  </summary>
                  <p>{i.answer}</p>
                </details>
              ))}
            </section>
          ))}
          {help && categories.length === 0 ? (
            <p className="help-empty">
              <Icon name="info" size={18} /> پرسشی با این عبارت پیدا نشد؛ عبارت کوتاه‌تری را امتحان کنید یا با پذیرش در
              تماس باشید.
            </p>
          ) : null}
          {!help ? <div className="skeleton skeleton--block" aria-hidden="true" /> : null}

          <aside className="help-contact" aria-label="تماس با پذیرش">
            <strong>همراهی پذیرش</strong>
            {phone ? (
              <a className="help-contact__row" href={`tel:${phone}`}>
                <Icon name="phone" size={18} /> <bdi className="latin">{contact.phone_display || phone}</bdi>
              </a>
            ) : (
              <p className="help-contact__row">
                <Icon name="phone" size={18} /> شمارهٔ پذیرش به‌زودی در همین‌جا قرار می‌گیرد.
              </p>
            )}
            {contact.address ? (
              <p className="help-contact__row">
                <Icon name="map-pin" size={18} /> {contact.address}
              </p>
            ) : null}
          </aside>
        </div>
      </AppDialog>
    </>
  );
}
