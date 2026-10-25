"use client";
import type { UnitTimeline } from "@/entities/slot/timeline";
import { floorLabel } from "@/entities/unit/unit";
import { faDigits, formatDayMonth, formatDayNumber, formatMonth } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { JalaliDatePicker } from "@/shared/ui/JalaliDatePicker";
import { SelectMenu } from "@/shared/ui/SelectMenu";
import { DAY_OPTIONS, type Chip, type DaysOption, type View } from "./model";

/** «آخر هفته ۸ و ۹ آبان» — اگر از ماه گذشت: «آخر هفته ۳۰ مهر و ۱ آبان». */
export function weekendLabel(days: string[]): string {
  const months = new Set(days.map((d) => formatMonth(d)));
  const parts = months.size === 1 ? days.map((d) => formatDayNumber(d)) : days.map((d) => formatDayMonth(d));
  const tail = months.size === 1 && days[0] ? ` ${formatMonth(days[0])}` : "";
  return `آخر هفته ${parts.join(" و ")}${tail}`;
}

/**
 * نوار ابزار طراح P-04: ناوبری بازه | طول بازه، سپس فیلتر واحد/طبقه (فهرست شناور سفارشی، بی ‎<select>‎)،
 * پرش به تاریخ و تغییر نما؛ زیر آن نوار طلایی مناسبت‌ها و آخر هفته‌ها.
 */
export function Toolbar({
  from,
  today,
  lastFrom,
  horizonLast,
  days,
  unit,
  floor,
  view,
  units,
  chips,
  onPrev,
  onToday,
  onNext,
  onDays,
  onUnit,
  onFloor,
  onView,
  onJump,
  onChip,
}: {
  from: string;
  today: string;
  lastFrom: string;
  horizonLast: string;
  days: DaysOption;
  unit: string;
  floor: number;
  view: View;
  units: UnitTimeline[];
  chips: Chip[];
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onDays: (d: DaysOption) => void;
  onUnit: (u: string) => void;
  onFloor: (f: number) => void;
  onView: (v: View) => void;
  onJump: (day: string) => void;
  onChip: (c: Chip) => void;
}) {
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => a - b);
  return (
    <section className="cp-toolbar" aria-label="کنترل‌های تقویم و فیلترها">
      <div className="cp-toolbar__row">
        <div className="cp-nav" role="group" aria-label="ناوبری بازهٔ زمانی">
          <button
            type="button"
            className="cp-nav__btn"
            onClick={onPrev}
            disabled={from <= today}
            aria-label="بازهٔ قبل"
          >
            <Icon name="chevron-right" size={18} />
            <span>بازهٔ قبل</span>
          </button>
          <button type="button" className="cp-nav__btn" onClick={onToday} aria-pressed={from === today}>
            امروز
          </button>
          <button
            type="button"
            className="cp-nav__btn"
            onClick={onNext}
            disabled={from >= lastFrom}
            aria-label="بازهٔ بعد"
          >
            <span>بازهٔ بعد</span>
            <Icon name="chevron-left" size={18} />
          </button>
        </div>
        <div className="cp-seg cp-days" role="radiogroup" aria-label="طول بازهٔ تقویم">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              className="cp-seg__btn"
              onClick={() => onDays(d)}
            >
              {faDigits(d)} روز
            </button>
          ))}
        </div>
      </div>

      <div className="cp-toolbar__row cp-toolbar__filters">
        <SelectMenu
          layout="inline"
          className="cp-filter"
          label="واحد:"
          value={unit}
          onChange={onUnit}
          options={[
            { value: "", label: `همهٔ واحدها (${faDigits(units.length)} واحد)`, groupEnd: true },
            ...units.map((u) => ({ value: u.code, code: u.code, label: u.title })),
          ]}
        />
        <SelectMenu
          layout="inline"
          className="cp-filter"
          label="طبقه:"
          value={String(floor)}
          onChange={(v) => onFloor(Number(v))}
          options={[
            { value: "0", label: "همهٔ طبقه‌ها", groupEnd: true },
            ...floors.map((f) => ({ value: String(f), label: floorLabel(f) })),
          ]}
        />
        <div className="cp-jump">
          <JalaliDatePicker
            anchor="calendar-from"
            label="آغاز بازه"
            value={from}
            onChange={(d) => onJump(d ?? today)}
            min={today}
            max={horizonLast}
            quick={[{ label: "امروز", value: today }]}
          />
        </div>
        <div className="cp-seg cp-view" role="radiogroup" aria-label="حالت نمایش تقویم">
          <button
            type="button"
            role="radio"
            aria-checked={view === "matrix"}
            className="cp-seg__btn"
            onClick={() => onView("matrix")}
          >
            <Icon name="table" size={18} /> ماتریس کامل
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={view === "day"}
            className="cp-seg__btn"
            onClick={() => onView("day")}
          >
            <Icon name="columns" size={18} /> روزمحور
          </button>
        </div>
      </div>

      {chips.length ? (
        <div className="cp-occasions">
          <p className="cp-occasions__label">
            <Icon name="star" size={18} /> مناسبت‌ها و ایام پرتقاضا:
          </p>
          <ul className="cp-occasions__chips">
            {chips.map((c) => (
              <li key={c.key} data-peak={(c.kind === "occasion" && c.occasion.is_peak) || undefined}>
                <button type="button" className="cp-chip" onClick={() => onChip(c)}>
                  {c.kind === "occasion" ? (
                    <>
                      <span className="cp-chip__dot" aria-hidden="true" />
                      {c.occasion.title} — {formatDayMonth(c.day)}
                      {c.occasion.is_peak ? " (اوج)" : ""}
                    </>
                  ) : (
                    <>
                      <Icon name="calendar" size={14} />
                      {weekendLabel(c.days)}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
