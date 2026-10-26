"use client";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { UnitTimeline } from "@/entities/slot/timeline";
import type { Quote } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import { durationLabel, faDigits, formatClock, formatDayMonth, formatWeekday, guestsLabel } from "@/shared/lib/fa";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";
import { PERIOD_LABEL } from "./Matrix";
import { SLOT_LABEL, SLOT_REASON, type Alternative, type Evaluation, type Selection } from "./model";

const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const tehranDay = (iso: string) => new Date(Date.parse(iso) + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
const moment = (iso: string) =>
  `${formatWeekday(tehranDay(iso))} ${formatDayMonth(tehranDay(iso))}، ساعت ${formatClock(iso)}`;

export type DrawerTone = "ok" | "warn" | "danger" | "info";

/** متن و لحن وضعیت انتخاب — یک منبع برای کشو و اعلان صفحه‌خوان. */
export function verdictCopy(
  ev: Evaluation,
  quote: Quote | undefined,
): { tone: DrawerTone; icon: IconName; text: string } {
  const v = ev.verdict;
  switch (v.kind) {
    case "loading":
      return { tone: "info", icon: "refresh", text: "در حال دریافت وضعیت همهٔ نیم‌روزهای این بازه…" };
    case "capacity":
      return {
        tone: "danger",
        icon: "users",
        text: `ظرفیت این واحد ${faDigits(v.capacity)} نفر است؛ واحد بزرگ‌تری برگزینید.`,
      };
    case "closed":
      return { tone: "danger", icon: "clock", text: SLOT_REASON[v.state] };
    case "conflict": {
      const first = v.conflicts[0];
      const n = v.conflicts.length;
      return {
        tone: "danger",
        icon: "alert",
        text: `${faDigits(n)} نیم‌روز این بازه آزاد نیست${first ? ` (${SLOT_LABEL[first.state]})` : ""}؛ جایگزین بگیرید یا در صف انتظار بمانید.`,
      };
    }
    case "ok": {
      const blocked = quote && !quote.allowed ? quote.violations[0] : undefined;
      if (blocked) return { tone: "warn", icon: "info", text: blocked.message };
      return { tone: "ok", icon: "check", text: "همهٔ نیم‌روزهای این بازه آزادند" };
    }
  }
}

/**
 * کشوی خلاصهٔ انتخاب (طراح P-04) — بازنگری‌شده: در گوشی جمع‌وجور و تاشونده (نیمی از صفحه را
 * نمی‌پوشاند)، بالای نوار پایینی؛ در رومیزی همهٔ کنترل‌ها در یک ردیف. سنجش محلی فوری است و برای زائر
 * واردشده، پیش‌سنجش سرور (‎/reservations/quote‎: سهمیه، رزرو فعال، فاصلهٔ رزروها) هم نمایش داده می‌شود.
 */
export function SelectionDrawer({
  selection,
  unit,
  evaluation,
  guests,
  maxGuests,
  maxCells,
  minCells,
  quote,
  quoteLoading,
  alternatives,
  bookingHref,
  waitlistEnabled,
  onCells,
  onGuests,
  onAlternative,
  onWaitlist,
  onCancel,
}: {
  selection: Selection;
  unit: UnitTimeline | undefined;
  evaluation: Evaluation;
  guests: number;
  maxGuests: number;
  maxCells: number;
  minCells: number;
  quote: Quote | undefined;
  quoteLoading: boolean;
  alternatives: Alternative[];
  bookingHref: string | null;
  waitlistEnabled: boolean;
  onCells: (n: number) => void;
  onGuests: (n: number) => void;
  onAlternative: (s: Selection) => void;
  onWaitlist: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const v = evaluation.verdict;
  const copy = verdictCopy(evaluation, quote);
  const canBook = v.kind === "ok";
  const canWait = waitlistEnabled && v.kind === "conflict";

  // فضای پایین صفحه به اندازهٔ کشو (محتوای پایانی زیر کشو پنهان نماند) — CSSOM، سازگار با CSP
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--cp-drawer-h", `${Math.ceil(el.offsetHeight)}px`));
    ro.observe(el);
    root.dataset.cpDrawer = "";
    return () => {
      ro.disconnect();
      root.style.removeProperty("--cp-drawer-h");
      delete root.dataset.cpDrawer;
    };
  }, []);

  const start = evaluation.start?.start;
  const end = evaluation.end?.end;

  return (
    <aside
      ref={ref}
      className="cp-drawer"
      data-float-guard=""
      data-tone={copy.tone}
      data-open={open || undefined}
      aria-labelledby={`${id}-t`}
    >
      <div className="page-shell cp-drawer__inner">
        <div className="cp-drawer__summary">
          <span className="cp-drawer__badge" aria-hidden="true">
            <bdi className="latin">{selection.unit}</bdi>
          </span>
          <div className="cp-drawer__details">
            <p className="cp-drawer__title" id={`${id}-t`}>
              <span>{unit?.title ?? selection.unit}</span>
              <span className="cp-drawer__pill">{durationLabel(selection.cells)}</span>
            </p>
            {start && end ? (
              <p className="cp-drawer__range">
                <span>
                  <Icon name="arrow-left" size={14} /> ورود: {moment(start)}
                </span>
                <span>
                  <Icon name="log-out" size={14} /> خروج: {moment(end)}
                </span>
              </p>
            ) : (
              <p className="cp-drawer__range">
                <span>
                  {formatWeekday(selection.day)} {formatDayMonth(selection.day)} · {PERIOD_LABEL[selection.period]}
                </span>
              </p>
            )}
            <p className="cp-drawer__status" role="status">
              <Icon name={quoteLoading && v.kind === "ok" ? "refresh" : copy.icon} size={16} />
              <span>{copy.text}</span>
            </p>
          </div>
          <button
            type="button"
            className="cp-drawer__toggle"
            aria-expanded={open}
            aria-controls={`${id}-more`}
            aria-label={open ? "جمع کردن جزئیات" : "باز کردن جزئیات"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name="chevron-down" size={20} />
          </button>
        </div>

        <div className="cp-drawer__more" id={`${id}-more`}>
          <div className="cp-drawer__controls">
            <div className="cp-field">
              <span className="field-label" id={`${id}-c`}>
                طول اقامت
              </span>
              <Stepper
                value={selection.cells}
                min={minCells}
                max={maxCells}
                onChange={onCells}
                format={(n) => `${faDigits(n)} نیم‌روز`}
                labelId={`${id}-c`}
                incLabel="افزودن یک نیم‌روز"
                decLabel="کاستن یک نیم‌روز"
              />
            </div>
            <div className="cp-field">
              <span className="field-label" id={`${id}-g`}>
                همسفران
              </span>
              <Stepper
                value={guests}
                min={1}
                max={maxGuests}
                onChange={onGuests}
                format={guestsLabel}
                labelId={`${id}-g`}
                incLabel="افزودن یک همسفر"
                decLabel="کاستن یک همسفر"
              />
            </div>
          </div>
          {alternatives.length && !canBook ? (
            <div className="cp-drawer__alts">
              <span className="cp-drawer__alts-label">
                <Icon name="sparkle" size={16} /> نزدیک‌ترین بازه‌های آزاد:
              </span>
              <ul>
                {alternatives.map((a) => (
                  <li key={`${a.selection.unit}-${a.selection.day}-${a.selection.period}`}>
                    <button type="button" className="cp-alt" onClick={() => onAlternative(a.selection)}>
                      <bdi className="latin">{a.selection.unit}</bdi>
                      <span>
                        {formatWeekday(a.selection.day)} {formatDayMonth(a.selection.day)} ·{" "}
                        {a.selection.period === "day" ? "روز" : "شب"}
                      </span>
                      <small>{a.reason === "same-time" ? "همان زمان" : a.reason === "later" ? "دیرتر" : "زودتر"}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="cp-drawer__actions">
          {canBook && bookingHref ? (
            <Link className="btn btn-primary cp-drawer__cta" href={bookingHref as Route}>
              ادامه و ثبت مشخصات زائر <Icon name="arrow-left" size={18} />
            </Link>
          ) : (
            <button type="button" className="btn btn-primary cp-drawer__cta" disabled>
              {v.kind === "loading" ? "در حال سنجش…" : "این بازه قابل رزرو نیست"}
            </button>
          )}
          {canWait ? (
            <button type="button" className={cx("btn btn-outline cp-drawer__wait")} onClick={onWaitlist}>
              <Icon name="bell" size={18} /> ثبت در صف انتظار
            </button>
          ) : null}
          <button type="button" className="cp-drawer__cancel" onClick={onCancel}>
            <Icon name="x" size={18} />
            <span>انصراف</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
