"use client";
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { destHref } from "@/shared/config/destinations";
import { cellsLabel, durationLabel, faDigits, formatDayMonth, formatWeekday, formatYear } from "@/shared/lib/fa";
import { cx } from "@/shared/lib/cx";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { SHRINE_SVG } from "@/shared/ui/shrine.generated";

const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const tehranDay = (iso: string) => new Date(Date.parse(iso) + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);

/** «پنجشنبه ۲۴ مهر تا شنبه ۲۶ مهر ۱۴۰۵» — سال فقط یک بار (یا دو بار اگر از سال گذشت). */
export function rangeLabel(start: string, end: string): string {
  const a = tehranDay(start);
  const b = tehranDay(end);
  const sameYear = formatYear(a) === formatYear(b);
  const left = `${formatWeekday(a)} ${formatDayMonth(a)}${sameYear ? "" : ` ${formatYear(a)}`}`;
  return a === b ? `${left} ${formatYear(a)}` : `${left} تا ${formatWeekday(b)} ${formatDayMonth(b)} ${formatYear(b)}`;
}

/** «۴ نیم‌روز (معادل ۲ شبانه‌روز کامل)» */
export function spanLabel(cells: number): string {
  return cells >= 2
    ? `${cellsLabel(cells)} (معادل ${durationLabel(cells)})`
    : `${cellsLabel(cells)} (${durationLabel(cells)})`;
}

/* ── سربرگ صفحه ─────────────────────────────────────────────────────────── */
export function BookingHero({ freeCancelHours }: { freeCancelHours: number }) {
  const units = destHref("units");
  const calendar = destHref("calendar");
  return (
    <section className="booking-hero" aria-labelledby="booking-title">
      <div className="booking-hero__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHRINE_SVG }} />
      <div className="page-shell booking-hero__inner">
        <nav className="crumbs" aria-label="مسیر صفحه">
          <ol>
            <li>
              <Link href="/">صفحهٔ نخست</Link>
            </li>
            <li>
              <Link href={units}>واحدهای اقامتی</Link>
            </li>
            <li>
              <Link href={calendar}>تقویم موجودی</Link>
            </li>
            <li aria-current="page">احراز هویت و صدور رسمی رزرو</li>
          </ol>
        </nav>
        <p className="eyebrow">
          <span className="eyebrow__rule" aria-hidden="true" />
          کرامت، شفافیت و عدالت در میزبانی
        </p>
        <h1 id="booking-title" className="booking-hero__title">
          ورود زائر و صدور رسمی گواهی اقامت
        </h1>
        <p className="booking-hero__lead">
          وقف کامل برای زائران حضرت علی‌بن‌موسی‌الرضا (علیه‌السلام). تمام خدمات اقامتی در مهدیه صددرصد رایگان است و
          هیچ‌گونه هزینه، پیش‌پرداخت یا درگاه بانکی در کار نیست.
        </p>
        <ul className="trust-pills" aria-label="تعهدهای مهدیه">
          <li>
            <Icon name="heart-hand" size={16} />
            اقامت ۱۰۰٪ رایگان و وقف عام
          </li>
          <li>
            <Icon name="calendar-check" size={16} />
            ظرفیت قطعی بر پایهٔ شبکهٔ نیم‌روز
          </li>
          <li>
            <Icon name="qr" size={16} />
            گواهی دیجیتال با استعلام آفلاین
          </li>
          <li>
            <Icon name="shield-check" size={16} />
            لغو رایگان تا {faDigits(freeCancelHours)} ساعت پیش از ورود
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ── نوار خلاصهٔ انتخاب (Ribbon) ────────────────────────────────────────── */
export type RibbonData = {
  unitIcon: IconName;
  /** کد واحد (A1) با رقم لاتین، جدا از عنوان فارسی — همان قرارداد صفحهٔ نخست */
  unitCode: string;
  unitTitle: string;
  unitMeta: string;
  range: string | null;
  span: string | null;
  guests: number;
  capacity: number | null;
};

export function StayRibbon({ data, edit, pending }: { data: RibbonData | null; edit?: ReactNode; pending?: boolean }) {
  return (
    <section className={cx("stay-ribbon", pending && "is-pending")} aria-label="خلاصهٔ انتخاب شما" aria-busy={pending}>
      <div className="stay-ribbon__unit">
        <span className="stay-ribbon__icon" aria-hidden="true">
          <Icon name={data?.unitIcon ?? "building"} size={24} />
        </span>
        <div>
          <span className="stay-ribbon__kicker">واحد اقامتی انتخابی</span>
          <strong className="stay-ribbon__title">
            {data ? (
              <>
                <bdi className="latin">{data.unitCode}</bdi> — {data.unitTitle}
              </>
            ) : (
              "…"
            )}
          </strong>
          <span className="stay-ribbon__sub">{data?.unitMeta ?? "\u00a0"}</span>
        </div>
      </div>
      <dl className="stay-ribbon__trip">
        <div>
          <dt>بازهٔ اقامت</dt>
          <dd>
            <strong>{data?.range ?? "…"}</strong>
            <small>{data?.span ?? "\u00a0"}</small>
          </dd>
        </div>
        <div>
          <dt>تعداد مهمانان</dt>
          <dd>
            <strong>{data ? `${faDigits(data.guests)} نفر` : "…"}</strong>
            <small>{data?.capacity ? `ظرفیت استاندارد واحد: ${faDigits(data.capacity)} نفر` : "\u00a0"}</small>
          </dd>
        </div>
        <div>
          <dt>هزینهٔ اقامت</dt>
          <dd>
            <strong className="stay-ribbon__free">
              <bdi>۰</bdi> تومان (رایگان)
            </strong>
            <small>موقوفهٔ علی‌بن‌موسی‌الرضا (ع)</small>
          </dd>
        </div>
      </dl>
      {edit ? <div className="stay-ribbon__edit">{edit}</div> : null}
    </section>
  );
}

/* ── گام‌شمار ──────────────────────────────────────────────────────────── */
const STEPS = ["شماره همراه و کد ورود", "مشخصات سجلی زائر", "جزئیات سفر و تأیید سهمیه", "گواهی رسمی و بلیط دیجیتال"];

export function BookingSteps({ current }: { current: 1 | 2 | 3 | 4 | null }) {
  return (
    <nav className="booking-steps" aria-label="مراحل صدور رزرو">
      <ol>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = current === null ? "upcoming" : n < current ? "done" : n === current ? "current" : "upcoming";
          return (
            <li
              key={label}
              className="booking-step"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="booking-step__dot" aria-hidden="true">
                {state === "done" ? <Icon name="check" size={16} /> : faDigits(n)}
              </span>
              <span className="booking-step__label">
                <span className="sr-only">
                  گام {faDigits(n)}
                  {state === "done" ? " (انجام شد)" : ""}:{" "}
                </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── کارت گام ───────────────────────────────────────────────────────────── */
export function StepCard({
  step,
  title,
  lead,
  children,
  focusKey,
  className,
  action,
}: {
  step: 1 | 2 | 3 | 4 | null;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  /** با تغییر این کلید (پس از نخستین رندر)، فوکوس به سرتیتر می‌رود تا صفحه‌خوان گام تازه را اعلام کند. */
  focusKey?: string;
  className?: string;
  /** کنش ثانویهٔ سربرگ (مثل «همهٔ رزروهای من») — هم‌ردیف نشان گام، در سوی مقابل */
  action?: ReactNode;
}) {
  const id = useId();
  const head = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const h = head.current;
    if (!h) return;
    h.focus({ preventScroll: true });
    const top = h.getBoundingClientRect().top;
    if (top < 90 || top > window.innerHeight * 0.6) {
      h.closest(".booking-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusKey]);

  return (
    <section className={cx("booking-card", className)} aria-labelledby={id}>
      <header className={cx("booking-card__head", action != null && "booking-card__head--action")}>
        {step ? <span className="step-badge">گام {faDigits(step)} از ۴</span> : null}
        <h2 id={id} ref={head} tabIndex={-1}>
          {title}
        </h2>
        {lead ? <p>{lead}</p> : null}
        {action != null ? <div className="booking-card__action">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
