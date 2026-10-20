"use client";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, type KeyboardEvent } from "react";
import { cellAt, STATUS_ICON, STATUS_LABEL, type UnitTimeline } from "@/entities/slot/timeline";
import { floorLabel, unitTypeIcon, unitTypeLabel } from "@/entities/unit/unit";
import { draftStore } from "@/features/booking-draft/store";
import { useAvailability } from "@/features/booking-draft/use-availability";
import { occasionsQuery } from "@/shared/api/queries";
import type { Calendar, CalendarCell } from "@/shared/api/schemas";
import {
  addDays,
  faDigits,
  formatClock,
  formatDayLabel,
  formatDayMonth,
  formatFullDate,
  formatWeekday,
  tehranToday,
} from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { PageLink } from "@/shared/ui/PageLink";
import { CalendarExplain } from "./CalendarExplain";

const WEEK = 7;
const RUNNING_TEXT = "این سانس آغاز شده است؛ رزرو آنلاین بسته است";

/**
 * نگاه هفت‌روزه: دسکتاپ = جدول ۵ واحد × ۱۴ نیم‌روز؛ موبایل = نوار روزها + دو سانس هر واحد.
 * بازهٔ جست‌وجوی جاری روی خانه‌ها پررنگ می‌شود؛ هر خانه = دکمه ⇒ دیالوگ همان واحد و زمان.
 */
export function WeekCalendar() {
  const { timeline, draft, calendar, policies, now } = useAvailability();
  // سانس «آزاد» ولی نزدیک‌تر از حداقل فاصلهٔ ثبت (سیاست بک‌اند) ⇒ قابل رزرو آنلاین نیست.
  const earliest = now.getTime() + policies.minLeadHours * 3_600_000;
  const leadText = `کمتر از ${faDigits(policies.minLeadHours)} ساعت به شروع مانده؛ رزرو آنلاین بسته است`;
  const soonOf = (c: CalendarCell): string | undefined => {
    if (c.status !== "free") return undefined;
    const start = Date.parse(c.start);
    if (start <= now.getTime()) return RUNNING_TEXT;
    return start < earliest ? leadText : undefined;
  };
  const today = tehranToday();
  const occasions = useQuery(occasionsQuery(today, addDays(today, 14)));
  const occasionByDay = new Map(occasions.data?.map((o) => [o.date_gregorian, o]));
  const [mobileDay, setMobileDay] = useState(0);

  const days = timeline?.days.slice(0, WEEK) ?? [];
  const startIndex = timeline?.units
    .map((u) => (draft.day ? cellAt(u, draft.day, draft.period)?.index : undefined))
    .find((x) => x !== undefined);
  const inRange = (c: CalendarCell) =>
    draft.searched && startIndex !== undefined && c.index >= startIndex && c.index < startIndex + draft.cells;

  const pick = (unit: string, c: CalendarCell) =>
    draftStore.set({ day: c.start.slice(0, 10), period: c.kind, openUnit: unit });

  return (
    <section className="page-shell section availability-section" id="availability" aria-labelledby="availability-title">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">زمانی برای زیارت</p>
          <h2 className="section-title" id="availability-title">
            یک نگاه، تا هفت روز آینده
          </h2>
          <p className="section-sub">هر خانه یک نیم‌روز است؛ روز از ۸ تا ۲۰، شب از ۲۰ تا ۸ صبح.</p>
        </div>
        <div className="section-head__actions">
          <CalendarExplain policies={policies} />
          <PageLink to="calendarFull" className="section-link">
            تقویم کامل {faDigits(policies.horizonDays)} روز آینده <Icon name="arrow-left" size={16} />
          </PageLink>
        </div>
      </div>

      <div className="week-tools">
        <ul className="status-legend" aria-label="راهنمای وضعیت‌ها">
          {(["free", "occupied", "buffer", "blocked"] as const).map((s) => (
            <li key={s}>
              <i data-status={s} aria-hidden="true">
                <Icon name={STATUS_ICON[s]} size={14} />
              </i>
              {LEGEND_LABEL[s]}
            </li>
          ))}
          <li data-legend-extra="">
            <i data-status="soon" aria-hidden="true">
              <Icon name="clock" size={14} />
            </i>
            <span title={leadText}>رزرو آنلاین بسته</span>
          </li>
        </ul>
        <p className="week-note">
          <Icon name="mouse-pointer" size={16} /> برای دیدن جزئیات، یک خانه را انتخاب کنید
        </p>
      </div>

      <div className="week-card" data-loading={calendar.isPending ? "true" : undefined}>
        {calendar.isError ? (
          <div className="calendar-state" role="alert">
            <Icon name="cloud-off" size={26} />
            <strong>تقویم دریافت نشد</strong>
            <button type="button" className="btn btn-secondary" onClick={() => void calendar.refetch()}>
              <Icon name="refresh" size={18} /> تلاش دوباره
            </button>
          </div>
        ) : null}

        {/* دسکتاپ */}
        <div
          className="week-grid"
          role="table"
          aria-label="موجودی هفت روز آینده"
          aria-rowcount={(timeline?.units.length ?? 5) + 1}
        >
          <div className="week-grid__row week-grid__row--head" role="row">
            <div className="week-grid__corner" role="columnheader">
              واحد / روز
            </div>
            {(days.length ? days : Array.from({ length: WEEK }, () => null)).map((d, i) => (
              <div
                key={d?.day ?? i}
                className="day-head"
                role="columnheader"
                aria-colspan={2}
                data-weekend={d?.is_weekend || undefined}
                data-today={d?.day === today || undefined}
              >
                {d ? (
                  <>
                    <span className="day-head__weekday">{d.day === today ? "امروز" : formatWeekday(d.day)}</span>
                    <strong>{formatDayMonth(d.day)}</strong>
                    {occasionByDay.get(d.day) ? (
                      <span className="day-head__occasion" title={occasionByDay.get(d.day)?.title}>
                        {occasionByDay.get(d.day)?.title}
                      </span>
                    ) : d.demand_level !== "normal" ? (
                      <span className="day-head__demand">پرتقاضا</span>
                    ) : null}
                  </>
                ) : (
                  <span className="skeleton skeleton--text" />
                )}
              </div>
            ))}
          </div>
          {(timeline?.units ?? []).map((u) => (
            <div key={u.code} className="week-grid__row" role="row">
              <div className="grid-unit-label" role="rowheader">
                <Icon name={unitTypeIcon(u.unitType)} size={20} />
                <span>
                  <strong>{u.title}</strong>
                  <small>
                    <bdi className="latin">{u.code}</bdi> · تا {faDigits(u.capacity)} نفر
                  </small>
                </span>
              </div>
              {days.flatMap((d) =>
                (["day", "night"] as const).map((kind) => {
                  const c = cellAt(u, d.day, kind);
                  if (!c) return <div key={`${d.day}-${kind}`} className="cell-wrap" role="cell" />;
                  return (
                    <Cell
                      key={c.index}
                      cell={c}
                      unit={u.title}
                      range={inRange(c)}
                      soon={soonOf(c)}
                      onPick={() => pick(u.code, c)}
                    />
                  );
                }),
              )}
            </div>
          ))}
          {!timeline ? <GridSkeleton /> : null}
        </div>

        {/* موبایل */}
        <MobileDay
          days={days}
          units={timeline?.units ?? []}
          today={today}
          active={mobileDay}
          onActive={setMobileDay}
          inRange={inRange}
          soonOf={soonOf}
          onPick={pick}
        />

        <div className="calendar-footer">
          <p>
            <i className="live-dot" aria-hidden="true" />
            زمان‌ها به افق مشهد مقدس نمایش داده می‌شوند.
          </p>
          {calendar.dataUpdatedAt ? (
            <span>به‌روزرسانی: {formatClock(new Date(calendar.dataUpdatedAt).toISOString())}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Cell({
  cell,
  unit,
  range,
  onPick,
  soon,
}: {
  cell: CalendarCell;
  unit: string;
  range: boolean;
  onPick: () => void;
  /** متن دلیل اگر سانس آزاد است ولی در حداقل فاصلهٔ ثبت افتاده است. */
  soon?: string | undefined;
}) {
  const state = soon ?? STATUS_LABEL[cell.status];
  const label = cellLabel(unit, cell, state);
  return (
    <div role="cell" className="cell-wrap">
      <button
        type="button"
        className="cell"
        data-status={cell.status}
        data-kind={cell.kind}
        data-range={range || undefined}
        data-soon={soon ? "" : undefined}
        aria-label={label}
        title={label}
        disabled={cell.status === "past" || Boolean(soon)}
        onClick={onPick}
      >
        <Icon name={soon ? "clock" : STATUS_ICON[cell.status]} size={16} />
      </button>
    </div>
  );
}

const PERIODS = ["day", "night"] as const;
/** برچسب کوتاه راهنما و خانهٔ باریک موبایل (طراح: «تعمیر»)؛ برچسب کامل در aria-label می‌ماند. */
const LEGEND_LABEL: Record<CalendarCell["status"], string> = { ...STATUS_LABEL, blocked: "تعمیر" };
/** «دوشنبه» ⇒ «دو»، «سه‌شنبه» ⇒ «سه»؛ «شنبه» و «جمعه» همان می‌مانند (نوار هفت‌ستونهٔ طراح). */
const shortWeekday = (w: string) => (w === "شنبه" ? w : w.replace(/\u200c?شنبه$/, ""));

/**
 * تقویم موبایل (≤۶۲۰): نوار ناوبری روز + شمار واقعی آزادها، نوار هفت‌ستونهٔ روزها (tablist با کلید جهت‌ها)،
 * سرستون سانس‌ها و یک کارت برای هر واحد با دو خانهٔ «روز/شب».
 */
function MobileDay({
  days,
  units,
  today,
  active,
  onActive,
  inRange,
  soonOf,
  onPick,
}: {
  days: Calendar["days"];
  units: UnitTimeline[];
  today: string;
  active: number;
  onActive: (i: number) => void;
  inRange: (c: CalendarCell) => boolean;
  soonOf: (c: CalendarCell) => string | undefined;
  onPick: (unit: string, c: CalendarCell) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const day = days[active];
  const isBookable = (c: CalendarCell | undefined) => c?.status === "free" && !soonOf(c);
  const bookableOf = (u: UnitTimeline, d: string) => PERIODS.filter((k) => isBookable(cellAt(u, d, k))).length;
  const bookable = (d: string) => units.reduce((n, u) => n + bookableOf(u, d), 0);
  const free = day ? bookable(day.day) : 0;
  const freeUnits = day ? units.filter((u) => bookableOf(u, day.day) > 0).length : 0;

  const go = (i: number, focus = false) => {
    const next = Math.max(0, Math.min(days.length - 1, i));
    onActive(next);
    if (focus) rail.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };
  // RTL: «چپ» یعنی روز بعد.
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
    if (step !== undefined) go(active + step, true);
    else if (e.key === "Home") go(0, true);
    else if (e.key === "End") go(days.length - 1, true);
    else return;
    e.preventDefault();
  };

  return (
    <div className="mobile-calendar">
      <div className="mobile-cal-nav-bar">
        <button
          type="button"
          className="cal-nav-arrow"
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="مشاهدهٔ روز قبل"
        >
          <Icon name="chevron-right" size={18} />
        </button>
        <div className="cal-active-day-badge" aria-live="polite">
          <span className="cal-active-title">{day ? formatFullDate(day.day) : "…"}</span>
          {day ? (
            <span className="cal-free-count" data-full={free === 0 || undefined}>
              {free ? `${faDigits(freeUnits)} واحد آزاد (${faDigits(free)} نیم‌روز)` : "نیم‌روز آزادی برای رزرو نمانده"}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="cal-nav-arrow"
          onClick={() => go(active + 1)}
          disabled={active >= days.length - 1}
          aria-label="مشاهدهٔ روز بعد"
        >
          <Icon name="chevron-left" size={18} />
        </button>
      </div>

      <div className="mobile-date-rail" role="tablist" aria-label="روزهای هفت‌گانه" ref={rail} onKeyDown={onKey}>
        {days.map((d, i) => {
          const [num, ...month] = formatDayMonth(d.day).split(" ");
          const hasFree = bookable(d.day) > 0;
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              className="date-chip"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => go(i)}
              data-today={d.day === today || undefined}
            >
              {/* نام صوتی = همان متن دیده‌شده + توضیح فقط-صفحه‌خوان (WCAG 2.5.3 «برچسب در نام») */}
              {d.day === today ? <span className="sr-only">امروز، </span> : null}
              <span className="chip-weekday">{shortWeekday(formatWeekday(d.day))}</span>
              <b className="chip-num">{num}</b>
              <span className="chip-month">{month.join(" ")}</span>
              <span className="sr-only">{hasFree ? "، واحد آزاد دارد" : "، بدون نیم‌روز آزاد"}</span>
              <span className="chip-dot" data-free={hasFree || undefined} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="mobile-table-header" aria-hidden="true">
        <div className="mobile-th th-unit">
          <Icon name="building" size={14} /> واحد اقامتی
        </div>
        <div className="mobile-th">
          <span className="period-badge">
            <Icon name="sun" size={14} /> سانس روز
          </span>
          <span className="period-hours">
            <bdi>۰۸:۰۰</bdi> تا <bdi>۲۰:۰۰</bdi>
          </span>
        </div>
        <div className="mobile-th">
          <span className="period-badge">
            <Icon name="moon" size={14} /> سانس شب
          </span>
          <span className="period-hours">
            <bdi>۲۰:۰۰</bdi> تا <bdi>۰۸:۰۰</bdi> صبح
          </span>
        </div>
      </div>

      <div className="mobile-unit-days" role="tabpanel" aria-label={day ? formatFullDate(day.day) : undefined}>
        {day
          ? units.map((u) => {
              const cells = PERIODS.map((k) => cellAt(u, day.day, k));
              const first = cells.find((c) => c !== undefined);
              return (
                <div key={u.code} className="mobile-unit-day">
                  <button
                    type="button"
                    className="mobile-unit-label"
                    onClick={() => (first ? onPick(u.code, first) : draftStore.set({ openUnit: u.code }))}
                  >
                    <span className="unit-icon-badge" aria-hidden="true">
                      <Icon name={unitTypeIcon(u.unitType)} size={18} />
                    </span>
                    <span className="unit-text-col">
                      <strong className="unit-name">{unitTypeLabel(u.unitType)}</strong>
                      <span className="unit-meta-sub">
                        <bdi className="unit-code-pill latin">{u.code}</bdi> · {floorLabel(u.floor)}
                      </span>
                    </span>
                    <span className="sr-only">، تا {faDigits(u.capacity)} نفر؛ مشاهدهٔ جزئیات</span>
                  </button>
                  {cells.map((c, k) =>
                    c ? (
                      <MobileCell
                        key={c.index}
                        cell={c}
                        unit={u.title}
                        range={inRange(c)}
                        soon={soonOf(c)}
                        onPick={() => onPick(u.code, c)}
                      />
                    ) : (
                      <span key={PERIODS[k]} />
                    ),
                  )}
                </div>
              );
            })
          : Array.from({ length: 5 }, (_, r) => (
              <div key={r} className="mobile-unit-day skeleton" aria-hidden="true" />
            ))}
      </div>

      <p className="mobile-cal-hint">
        <Icon name="mouse-pointer" size={14} /> برای انتخاب یا مشاهدهٔ جزئیات واحد، روی هر خانه ضربه بزنید.
      </p>
    </div>
  );
}

function cellLabel(unit: string, cell: CalendarCell, state: string) {
  return `${unit}، ${formatDayLabel(cell.start.slice(0, 10))}، ${cell.kind === "day" ? "روز" : "شب"} از ساعت ${formatClock(cell.start)} — ${state}${cell.detail ? `، ${cell.detail}` : ""}`;
}

function MobileCell({
  cell,
  unit,
  range,
  onPick,
  soon,
}: {
  cell: CalendarCell;
  unit: string;
  range: boolean;
  onPick: () => void;
  soon?: string | undefined;
}) {
  const hint = soon
    ? soon === RUNNING_TEXT
      ? "آغاز شده"
      : "شروع نزدیک"
    : range
      ? "بازهٔ شما"
      : cell.status === "free"
        ? "انتخاب"
        : "—";
  return (
    <button
      type="button"
      className="cell mobile-cal-cell"
      data-status={cell.status}
      data-kind={cell.kind}
      data-range={range || undefined}
      data-soon={soon ? "" : undefined}
      aria-label={cellLabel(unit, cell, soon ?? STATUS_LABEL[cell.status])}
      disabled={cell.status === "past" || Boolean(soon)}
      onClick={onPick}
    >
      <span className="cell-status-wrap">
        <Icon name={soon ? "clock" : STATUS_ICON[cell.status]} size={14} />
        <strong className="cell-status-title">{soon ? "رزرو بسته" : LEGEND_LABEL[cell.status]}</strong>
      </span>
      <span className="cell-action-hint" aria-hidden="true">
        {hint}
      </span>
    </button>
  );
}

function GridSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, r) => (
        <div key={r} className="week-grid__row" aria-hidden="true">
          <div className="grid-unit-label">
            <span className="skeleton skeleton--text" />
          </div>
          {Array.from({ length: WEEK * 2 }, (_, c) => (
            <span key={c} className="cell-wrap">
              <span className="cell skeleton" />
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
