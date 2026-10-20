"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cellAt, STATUS_ICON, STATUS_LABEL } from "@/entities/slot/timeline";
import { unitTypeIcon } from "@/entities/unit/unit";
import { draftStore } from "@/features/booking-draft/store";
import { useAvailability } from "@/features/booking-draft/use-availability";
import { occasionsQuery } from "@/shared/api/queries";
import type { CalendarCell } from "@/shared/api/schemas";
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

const WEEK = 7;

/**
 * نگاه هفت‌روزه: دسکتاپ = جدول ۵ واحد × ۱۴ نیم‌روز؛ موبایل = نوار روزها + دو سانس هر واحد.
 * بازهٔ جست‌وجوی جاری روی خانه‌ها پررنگ می‌شود؛ هر خانه = دکمه ⇒ دیالوگ همان واحد و زمان.
 */
export function WeekCalendar() {
  const { timeline, draft, calendar, policies } = useAvailability();
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
        <a className="section-link" href="/calendar/">
          تقویم کامل {faDigits(policies.horizonDays)} روز آینده <Icon name="arrow-left" size={16} />
        </a>
      </div>

      <div className="week-tools">
        <ul className="status-legend" aria-label="راهنمای وضعیت‌ها">
          {(["free", "occupied", "buffer", "blocked"] as const).map((s) => (
            <li key={s}>
              <i data-status={s} aria-hidden="true">
                <Icon name={STATUS_ICON[s]} size={14} />
              </i>
              {STATUS_LABEL[s]}
            </li>
          ))}
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
                    <Cell key={c.index} cell={c} unit={u.title} range={inRange(c)} onPick={() => pick(u.code, c)} />
                  );
                }),
              )}
            </div>
          ))}
          {!timeline ? <GridSkeleton /> : null}
        </div>

        {/* موبایل */}
        <div className="mobile-calendar">
          <div className="mobile-cal-nav">
            <button
              type="button"
              className="icon-button"
              onClick={() => setMobileDay((x) => Math.max(0, x - 1))}
              disabled={mobileDay === 0}
              aria-label="روز قبل"
            >
              <Icon name="arrow-right" size={18} />
            </button>
            <div className="mobile-cal-nav__title" aria-live="polite">
              <strong>{days[mobileDay] ? formatFullDate(days[mobileDay].day) : "…"}</strong>
              <small>
                {days[mobileDay]
                  ? `${faDigits(new Set(days[mobileDay].units.filter((x) => x.cells.some((c) => c.status === "free")).map((x) => x.code)).size)} واحد آزاد`
                  : ""}
              </small>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setMobileDay((x) => Math.min(days.length - 1, x + 1))}
              disabled={mobileDay >= days.length - 1}
              aria-label="روز بعد"
            >
              <Icon name="arrow-left" size={18} />
            </button>
          </div>
          <div className="mobile-date-rail" role="tablist" aria-label="روزهای هفته">
            {days.map((d, i) => (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={i === mobileDay}
                onClick={() => setMobileDay(i)}
                data-today={d.day === today || undefined}
              >
                <small>{d.day === today ? "امروز" : formatWeekday(d.day)}</small>
                <strong>{formatDayMonth(d.day)}</strong>
                <span
                  className="date-option__meter"
                  data-level={d.free_cells === 0 ? "none" : d.free_cells < d.total_cells / 2 ? "low" : "ok"}
                />
              </button>
            ))}
          </div>
          <div className="mobile-day" role="tabpanel">
            <div className="mobile-day__head" aria-hidden="true">
              <span>واحد</span>
              <span>
                <Icon name="sun" size={14} /> روز <bdi>۰۸:۰۰</bdi>–<bdi>۲۰:۰۰</bdi>
              </span>
              <span>
                <Icon name="moon" size={14} /> شب <bdi>۲۰:۰۰</bdi>–<bdi>۰۸:۰۰</bdi>
              </span>
            </div>
            {days[mobileDay]
              ? (timeline?.units ?? []).map((u) => (
                  <div key={u.code} className="mobile-day__row">
                    <span className="mobile-day__unit">
                      <strong>{u.title}</strong>
                      <small>تا {faDigits(u.capacity)} نفر</small>
                    </span>
                    {(["day", "night"] as const).map((kind) => {
                      const c = cellAt(u, days[mobileDay]?.day ?? "", kind);
                      return c ? (
                        <Cell
                          key={c.index}
                          cell={c}
                          unit={u.title}
                          range={inRange(c)}
                          onPick={() => pick(u.code, c)}
                          wide
                        />
                      ) : (
                        <span key={kind} />
                      );
                    })}
                  </div>
                ))
              : null}
          </div>
        </div>

        <div className="calendar-footer">
          <p>
            <i className="live-dot" aria-hidden="true" />
            زمان‌ها به افق مشهد مقدس و به‌صورت زنده نمایش داده می‌شوند.
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
  wide,
}: {
  cell: CalendarCell;
  unit: string;
  range: boolean;
  onPick: () => void;
  wide?: boolean;
}) {
  const label = `${unit}، ${formatDayLabel(cell.start.slice(0, 10))}، ${cell.kind === "day" ? "روز" : "شب"} از ساعت ${formatClock(cell.start)} — ${STATUS_LABEL[cell.status]}${cell.detail ? `، ${cell.detail}` : ""}`;
  return (
    <div role={wide ? undefined : "cell"} className="cell-wrap">
      <button
        type="button"
        className="cell"
        data-status={cell.status}
        data-kind={cell.kind}
        data-range={range || undefined}
        data-wide={wide || undefined}
        aria-label={label}
        title={label}
        disabled={cell.status === "past"}
        onClick={onPick}
      >
        <Icon name={STATUS_ICON[cell.status]} size={16} />
        {wide ? <span>{STATUS_LABEL[cell.status]}</span> : null}
      </button>
    </div>
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
