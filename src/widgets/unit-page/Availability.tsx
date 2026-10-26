"use client";
import type { Route } from "next";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import type { Period, UnitTimeline } from "@/entities/slot/timeline";
import type { Calendar, CalendarCell, FreeWindow, Occasion } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import {
  durationLabel,
  formatClock,
  formatDayLabel,
  formatDayMonth,
  formatDayNumber,
  formatWeekday,
  guestsLabel,
} from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import {
  cellsOfDay,
  DAY_TAG_LABEL,
  dayMark,
  SLOT_ICON,
  SLOT_REASON,
  type SlotState,
} from "@/widgets/calendar-page/model";
import { windowLabel, type AvailCopy } from "@/widgets/units-page/copy";
import type { Clock, Trip } from "@/widgets/units-page/model";
import { slotView, type SlotView } from "./model";
import { SectionHead } from "./Sections";

/** برچسب کوتاه وضعیت‌ها با واژگان طراح P-03. */
const LABEL: Record<SlotState, string> = {
  free: "آزاد",
  occupied: "رزروشده",
  buffer: "نظافت",
  blocked: "غیرقابل‌رزرو",
  past: "آغاز گذشته",
  soon: "رزرو بسته",
  beyond: "خارج از افق",
};

const PERIODS: Period[] = ["day", "night"];
const PERIOD_NAME: Record<Period, string> = { day: "روز", night: "شب" };

type Props = {
  code: string;
  clock: Clock;
  today: string;
  trip: Trip;
  weekFrom: string;
  days: string[];
  calendarDays: Calendar["days"];
  row: UnitTimeline | undefined;
  selected: Set<number>;
  startIndex: number | null;
  occasions: Map<string, Occasion[]>;
  state: "loading" | "error" | "ready";
  refreshing: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRetry: () => void;
  onPick: (cell: CalendarCell) => void;
  onTrip: () => void;
  copy: AvailCopy;
  nearest: FreeWindow | null;
  onNearest: (w: FreeWindow) => void;
  onWaitlist: (() => void) | null;
  calendarHref: Route;
  easy: boolean;
};

/**
 * «یک شروع مناسب پیدا کنیم»: نیم‌روزهای همین واحد در یک هفته (رومیزی: جدول ۷ روز × روز/شب؛
 * گوشی و حالت آسان: نوار روزها + کارت روز و شب). انتخاب هر نیم‌روز = آغاز اقامت با مدت سفر؛ کل بازه
 * با هم سنجیده و در جدول برجسته می‌شود. مناسبت‌ها و ایام اوج از ‎/occasions‎ در سرستون‌ها.
 */
export function AvailabilitySection(p: Props) {
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const day =
    focusDay && p.days.includes(focusDay)
      ? focusDay
      : p.trip.day && p.days.includes(p.trip.day)
        ? p.trip.day
        : p.days[0];
  const meta = new Map(p.calendarDays.map((d) => [d.day, d]));
  const views = new Map<string, SlotView>();
  for (const d of p.days) {
    for (const c of p.row ? cellsOfDay(p.row, d) : [])
      views.set(`${d}|${c.kind}`, slotView(c, p.clock, p.selected, p.startIndex));
  }
  const viewAt = (d: string, period: Period) => views.get(`${d}|${period}`);
  // نقطهٔ ورود صفحه‌کلید: آغاز بازهٔ سفر، وگرنه نخستین نیم‌روز قابل انتخاب.
  const all = p.days.flatMap((d) => PERIODS.map((per) => viewAt(d, per))).filter((v): v is SlotView => Boolean(v));
  const anchor =
    all.find((v) => v.start) ?? all.find((v) => v.pickable && v.state === "free") ?? all.find((v) => v.pickable);

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    const t = e.target as HTMLElement;
    const col = Number(t.dataset.col);
    const row = Number(t.dataset.row);
    if (Number.isNaN(col) || Number.isNaN(row)) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [1, 0],
      ArrowRight: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    for (let c = col + m[0], r = row + m[1]; c >= 0 && c < p.days.length && r >= 0 && r < 2; c += m[0], r += m[1]) {
      const next = e.currentTarget.querySelector<HTMLButtonElement>(
        `[data-col="${c}"][data-row="${r}"]:not(:disabled)`,
      );
      if (next) {
        next.focus();
        return;
      }
      if (m[0] === 0) return;
    }
  };

  const slotButton = (d: string, period: Period, col: number, mobile: boolean) => {
    const v = viewAt(d, period);
    if (!v) {
      return (
        <span className="ud-slot ud-slot--none" aria-hidden="true">
          —
        </span>
      );
    }
    const hint = !v.pickable
      ? v.state === "past"
        ? "منقضی شده"
        : "بیرون از افق رزرو"
      : v.state === "free"
        ? "انتخاب شروع اقامت"
        : "بررسی همین شروع";
    return (
      <button
        type="button"
        className={cx("ud-slot", mobile && "ud-slot--card")}
        data-state={v.state}
        data-selected={v.selected || undefined}
        data-conflict={v.conflict || undefined}
        data-start={v.start || undefined}
        data-col={mobile ? undefined : col}
        data-row={mobile ? undefined : PERIODS.indexOf(period)}
        tabIndex={mobile || v === anchor ? 0 : -1}
        disabled={!v.pickable}
        aria-pressed={v.start}
        onClick={() => p.onPick(v.cell)}
      >
        <span className="ud-slot__head">
          <Icon name={period === "day" ? "sun" : "moon"} size={14} />
          <strong>{PERIOD_NAME[period]}</strong>
        </span>
        {mobile ? (
          <span className="ud-slot__hours">
            <bdi>
              {formatClock(v.cell.start)} تا {formatClock(v.cell.end)}
            </bdi>
          </span>
        ) : null}
        <span className="ud-slot__status">
          <Icon name={SLOT_ICON[v.state]} size={14} />
          {LABEL[v.state]}
        </span>
        {mobile ? <span className="ud-slot__hint">{hint}</span> : null}
        <span className="sr-only">
          {` — ${formatDayLabel(d)}، ${formatClock(v.cell.start)}؛ ${SLOT_REASON[v.state]}`}
          {v.start ? "؛ آغاز اقامت انتخابی شما" : v.selected ? "؛ در بازهٔ اقامت شما" : ""}
        </span>
      </button>
    );
  };

  return (
    <section id="ud-availability" className="ud-section ud-avail" aria-labelledby="ud-avail-title">
      <SectionHead
        id="ud-avail-title"
        kicker="فقط زمان‌های همین واحد"
        title="یک شروع مناسب پیدا کنیم"
        aside={
          <button type="button" className="ud-text-action" onClick={p.onTrip} aria-haspopup="dialog">
            <Icon name="sliders" size={16} /> تنظیم سفر
          </button>
        }
      />
      <p className="ud-intro">
        یک نیم‌روز آزاد را برای ورود انتخاب کنید؛ مدت اقامت از شرایط سفرتان می‌آید و تمام بازه با هم بررسی می‌شود.
      </p>

      <div className="ud-cal" aria-busy={p.state === "loading" || p.refreshing}>
        {p.refreshing ? <span className="ud-cal__refresh" role="status" aria-label="در حال تازه‌سازی زمان‌ها" /> : null}
        <div className="ud-cal__top">
          <div className="ud-cal__title">
            <h3 aria-live="polite">
              {formatDayMonth(p.days[0] ?? p.weekFrom)} تا {formatDayMonth(p.days.at(-1) ?? p.weekFrom)}
            </h3>
            <p>
              {guestsLabel(p.trip.guests)} · {durationLabel(p.trip.cells)} · ساعت‌ها به وقت مشهد
            </p>
          </div>
          <div className="ud-cal__nav">
            <button type="button" className="icon-button" onClick={p.onPrev} disabled={!p.canPrev}>
              <Icon name="arrow-right" size={18} />
              <span className="sr-only">هفتهٔ قبل</span>
            </button>
            <button type="button" className="icon-button" onClick={p.onNext} disabled={!p.canNext}>
              <Icon name="arrow-left" size={18} />
              <span className="sr-only">هفتهٔ بعد</span>
            </button>
          </div>
        </div>

        {p.state === "error" ? (
          <div className="ud-cal__empty" role="alert">
            <Icon name="cloud-off" size={24} />
            <p>زمان‌ها دریافت نشدند؛ معرفی واحد همچنان در دسترس است.</p>
            <button type="button" className="btn btn-secondary" onClick={p.onRetry}>
              <Icon name="refresh" size={18} /> تلاش دوباره
            </button>
          </div>
        ) : p.state === "loading" ? (
          <div className="ud-cal__skeleton" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="skeleton" />
            ))}
          </div>
        ) : (
          <>
            <div className="ud-week-wrap" data-float-scroll="">
              <table className="ud-week" onKeyDown={onGridKey}>
                <caption className="sr-only">
                  نیم‌روزهای واحد {p.code} از {formatDayLabel(p.days[0] ?? p.weekFrom)}؛ با کلیدهای جهت جابه‌جا شوید.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span>ورود</span>
                    </th>
                    {p.days.map((d) => {
                      const info = meta.get(d);
                      const mark = info ? dayMark(info, p.occasions.get(d)) : null;
                      return (
                        <th
                          key={d}
                          scope="col"
                          data-today={d === p.today || undefined}
                          title={mark?.titles.join("، ") || undefined}
                        >
                          <span>{formatWeekday(d)}</span>
                          <strong>{formatDayNumber(d)}</strong>
                          {mark?.tag ? (
                            <em className="ud-tag" data-tag={mark.tag}>
                              {DAY_TAG_LABEL[mark.tag]}
                              {mark.titles.length ? <span className="sr-only">: {mark.titles.join("، ")}</span> : null}
                            </em>
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period}>
                      <th scope="row">
                        {PERIOD_NAME[period]}
                        <small>
                          <bdi>
                            {period === "day"
                              ? formatHour(p.clock.gridStartHour)
                              : formatHour((p.clock.gridStartHour + p.clock.cellHours) % 24)}
                          </bdi>
                        </small>
                      </th>
                      {p.days.map((d, col) => (
                        <td key={d}>{slotButton(d, period, col, false)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ud-daymode">
              <div className="ud-days" role="group" aria-label="روزهای این هفته" data-float-scroll="">
                {p.days.map((d) => {
                  const free = PERIODS.some((per) => viewAt(d, per)?.state === "free");
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={d === day}
                      onClick={() => setFocusDay(d)}
                      data-free={free || undefined}
                    >
                      <span>{formatWeekday(d)}</span>
                      <strong>{formatDayNumber(d)}</strong>
                      <span className="sr-only">{`${formatDayLabel(d)}${free ? "، نیم‌روز آزاد دارد" : "، بی نیم‌روز آزاد"}`}</span>
                    </button>
                  );
                })}
              </div>
              {day ? (
                <>
                  <p className="ud-days__caption">{formatDayLabel(day)}</p>
                  <div className="ud-day-slots">
                    {PERIODS.map((per) => (
                      <div key={per}>{slotButton(day, per, 0, true)}</div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </>
        )}

        <ul className="ud-legend" aria-label="راهنمای وضعیت‌ها">
          <li>
            <i data-state="free" /> آزاد
          </li>
          <li>
            <i data-state="occupied" /> رزروشده
          </li>
          <li>
            <i data-state="buffer" /> نظافت
          </li>
          <li>
            <i data-state="blocked" /> غیرقابل‌رزرو
          </li>
          <li>
            <i data-state="selected" /> بازهٔ شما
          </li>
        </ul>

        <div className="ud-feedback" data-tone={p.copy.tone} role="status">
          <Icon
            name={p.copy.tone === "free" ? "calendar-check" : p.copy.tone === "muted" ? "clock" : "info"}
            size={16}
          />
          <p>
            <strong>{p.copy.title}</strong>
            <span>{p.copy.sub}</span>
          </p>
          {p.onWaitlist ? (
            <button type="button" className="btn btn-ghost" onClick={p.onWaitlist} aria-haspopup="dialog">
              <Icon name="bell" size={16} /> آزاد شد خبرم کنید
            </button>
          ) : null}
        </div>
      </div>

      {p.nearest ? (
        <div className="ud-alt">
          <p>
            <strong>شروع متناسب با همین مدت و تعداد</strong>
            <small>
              {windowLabel(p.nearest)} · {durationLabel(p.trip.cells)}
            </small>
          </p>
          <button type="button" className="btn btn-secondary" onClick={() => p.nearest && p.onNearest(p.nearest)}>
            این شروع را بررسی کنم
          </button>
        </div>
      ) : null}

      <p className="ud-footnote">
        <Icon name="shield-check" size={16} />
        <span>
          این تقویم، آزادی زمان را نشان می‌دهد؛ بررسی نهایی حساب و مجوز رزرو بعد از ورود انجام می‌شود.{" "}
          <Link href={p.calendarHref}>تقویم کامل همهٔ واحدها</Link>
        </span>
      </p>
    </section>
  );
}

function formatHour(h: number): string {
  return formatClock(`2026-01-01T${String(h).padStart(2, "0")}:00:00+03:30`);
}
