"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { UnitTimeline } from "@/entities/slot/timeline";
import { floorLabel } from "@/entities/unit/unit";
import type { Calendar, CalendarCell } from "@/shared/api/schemas";
import { faDigits, formatDayMonth, formatFullDate, formatWeekday } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { periodHours, selectionMap } from "./Matrix";
import {
  SLOT_ICON,
  SLOT_LABEL,
  SLOT_REASON,
  cellsOfDay,
  dayFree,
  slotState,
  type Clock,
  type Selection,
} from "./model";

type Day = Calendar["days"][number];

/**
 * نمای روزمحور طراح (گوشی و حالت آسان): ریل افقی روزها (زبانه‌ها با کلیدهای جهت) و برای روز
 * برگزیده، کارت هر واحد با دو دکمهٔ بزرگ ۵۲پیکسلی سانس روز و شب.
 */
export function DayView({
  days,
  units,
  allUnits,
  filter,
  onShowAll,
  clock,
  selection,
  guests,
  peakDays,
  today,
  startHour,
  cellHours,
  activeDay,
  onDay,
  onCell,
}: {
  days: Day[];
  units: UnitTimeline[];
  /** همهٔ واحدها (بی فیلتر) ⇒ «این واحد تکمیل است، ولی واحدهای دیگر جا دارند» */
  allUnits: UnitTimeline[];
  filter: { unit: string; floor: number };
  onShowAll: () => void;
  clock: Clock;
  selection: Selection | null;
  guests: number;
  peakDays: Set<string>;
  today: string;
  startHour: number;
  cellHours: number;
  activeDay: string;
  onDay: (day: string) => void;
  onCell: (unit: UnitTimeline, cell: CalendarCell) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const roles = selectionMap(units, selection);
  const current = days.find((d) => d.day === activeDay) ?? days[0];

  useEffect(() => {
    const tab = rail.current?.querySelector<HTMLElement>(`[data-day="${activeDay}"]`);
    if (!tab) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tab.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [activeDay]);

  const onRailKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = days.findIndex((d) => d.day === current?.day);
    const map: Record<string, number> = { ArrowLeft: 1, ArrowRight: -1 };
    let n: number;
    if (e.key in map) n = i + (map[e.key] ?? 0);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = days.length - 1;
    else return;
    e.preventDefault();
    const next = days[Math.max(0, Math.min(days.length - 1, n))];
    if (!next) return;
    onDay(next.day);
    requestAnimationFrame(() => rail.current?.querySelector<HTMLElement>(`[data-day="${next.day}"]`)?.focus());
  };

  if (!current) return null;
  const f = dayFree(units, current.day, clock);

  return (
    <div className="cp-dayview">
      <div className="cp-rail" ref={rail} role="tablist" aria-label="روزهای بازه" onKeyDown={onRailKey}>
        {days.map((d) => {
          const free = dayFree(units, d.day, clock).free;
          const peak = peakDays.has(d.day) || d.demand_level === "peak";
          const on = d.day === current.day;
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              id={`cp-tab-${d.day}`}
              aria-selected={on}
              aria-controls="cp-daypanel"
              tabIndex={on ? 0 : -1}
              data-day={d.day}
              data-weekend={d.is_weekend || undefined}
              data-peak={peak || undefined}
              data-today={d.day === today || undefined}
              className="cp-rail__day"
              onClick={() => onDay(d.day)}
            >
              <span className="cp-rail__wd">{d.day === today ? "امروز" : formatWeekday(d.day)}</span>
              <span className="cp-rail__date">{formatDayMonth(d.day)}</span>
              <span className="cp-rail__free" data-none={free === 0 || undefined}>
                {free ? `${faDigits(free)} آزاد` : "تکمیل"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cp-daypanel" id="cp-daypanel" role="tabpanel" aria-labelledby={`cp-tab-${current.day}`}>
        <header className="cp-daypanel__head">
          <h3>{formatFullDate(current.day)}</h3>
          <DayStatus
            free={f.free}
            total={f.total}
            filter={filter}
            otherFree={
              dayFree(
                allUnits.filter((u) => !units.includes(u)),
                current.day,
                clock,
              ).free
            }
            onShowAll={onShowAll}
          />
        </header>
        <ul className="cp-daycards">
          {units.map((u) => (
            <li key={u.code} className="cp-daycard" data-short={guests > u.capacity || undefined}>
              <div className="cp-daycard__head">
                <p className="cp-daycard__title">
                  <bdi className="latin cp-unit__badge">{u.code}</bdi>
                  <span className="cp-unit__name">{u.title}</span>
                </p>
                <small className="cp-daycard__meta">
                  {floorLabel(u.floor)} · ظرفیت: {faDigits(u.capacity)} نفر
                </small>
                {guests > u.capacity ? (
                  <span className="cp-unit__warn">
                    <Icon name="users" size={12} /> کمتر از {faDigits(guests)} نفر
                  </span>
                ) : null}
              </div>
              <div className="cp-daycard__slots">
                {cellsOfDay(u, current.day).map((cell) => {
                  const state = slotState(cell, clock);
                  const role = roles.get(`${u.code}:${cell.index}`);
                  const conflict = Boolean(role) && state !== "free";
                  const dead = state === "past";
                  return (
                    <button
                      key={cell.index}
                      type="button"
                      className="cp-bigslot"
                      data-state={state}
                      data-kind={cell.kind}
                      data-sel={role}
                      data-conflict={conflict || undefined}
                      aria-pressed={Boolean(role)}
                      aria-disabled={dead || undefined}
                      onClick={() => !dead && onCell(u, cell)}
                    >
                      <span className="sr-only">
                        {u.code}، {formatWeekday(current.day)} {formatDayMonth(current.day)}،{" "}
                      </span>
                      <Icon
                        name={
                          role && !conflict
                            ? "check"
                            : state === "free"
                              ? cell.kind === "day"
                                ? "sun"
                                : "moon"
                              : SLOT_ICON[state]
                        }
                        size={18}
                      />
                      <span className="cp-bigslot__text">
                        <strong>{cell.kind === "day" ? "روز" : "شب"}</strong>{" "}
                        <small>({periodHours(cell.kind, startHour, cellHours)})</small>
                      </span>{" "}
                      <span className="cp-bigslot__state">
                        {role ? (conflict ? "ناسازگار" : "انتخاب شما") : SLOT_LABEL[state]}
                      </span>
                      <span className="sr-only"> — {SLOT_REASON[state]}</span>
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * وضعیت روز برگزیده، آگاه از فیلتر: «A1 در این روز تکمیل است» (نه «همهٔ واحدها») و اگر واحدهای دیگر جا
 * دارند، میان‌بُر «نمایش همهٔ واحدها» با شمار نیم‌روزهای آزادشان.
 */
function DayStatus({
  free,
  total,
  filter,
  otherFree,
  onShowAll,
}: {
  free: number;
  total: number;
  filter: { unit: string; floor: number };
  otherFree: number;
  onShowAll: () => void;
}) {
  const filtered = Boolean(filter.unit || filter.floor);
  if (free) {
    return (
      <span className="cp-daypanel__free">
        <Icon name="sun" size={16} />
        {faDigits(free)} نیم‌روز آزاد از {faDigits(total)}
      </span>
    );
  }
  if (!filtered) {
    return (
      <span className="cp-daypanel__free" data-none="">
        <Icon name="lock" size={16} />
        همهٔ واحدهای زائرسرا در این روز تکمیل‌اند
      </span>
    );
  }
  const who = filter.unit ? (
    <>
      واحد <bdi className="latin">{filter.unit}</bdi> در این روز تکمیل است
    </>
  ) : (
    <>واحدهای {floorLabel(filter.floor)} در این روز تکمیل‌اند</>
  );
  return (
    <div className="cp-daypanel__status" role="status">
      <span className="cp-daypanel__free" data-none="">
        <Icon name="lock" size={16} />
        {who}
      </span>
      {otherFree ? (
        <button type="button" className="cp-daypanel__more" onClick={onShowAll}>
          <Icon name="sparkle" size={16} />
          {faDigits(otherFree)} نیم‌روز آزاد در واحدهای دیگر — نمایش همه
          <Icon name="chevron-left" size={16} />
        </button>
      ) : (
        <span className="cp-daypanel__free" data-none="">
          سایر واحدها هم در این روز جا ندارند
        </span>
      )}
    </div>
  );
}
