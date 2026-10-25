"use client";
import { useState, type KeyboardEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { faDigits, formatFullDate, tehranToday } from "@/shared/lib/fa";
import { addDaysIso, addMonths, monthGrid, toJalali } from "@/shared/lib/jalali";
import { Icon } from "./Icon";
import { Popover, type PopoverAnchor } from "./Popover";

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
const WEEK = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;
const WEEK_FULL = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"] as const;

export type QuickDay = { label: string; value: string };

/**
 * انتخاب‌گر تاریخ خورشیدی (پاپ‌اور بومی؛ موبایل: برگهٔ پایینی) — جایگزین تایپ دستی تاریخ.
 * ‎rangeFrom‎ ⇒ روزهای پیش از آن غیرفعال و بازهٔ «از … تا روز زیر نشانگر» سایه می‌خورد (تقویم تخلیه).
 * صفحه‌کلید: جهت‌ها (راست‌به‌چپ)، ‎PageUp/PageDown‎ ماه، ‎Home/End‎ آغاز/پایان هفته، ‎Enter‎ انتخاب.
 */
export function JalaliDatePicker({
  anchor,
  label,
  value,
  onChange,
  rangeFrom,
  quick = [],
  invalid,
  placeholder = "انتخاب تاریخ",
}: {
  anchor: PopoverAnchor;
  label: string;
  value: string | null;
  onChange: (isoDay: string | null) => void;
  rangeFrom?: string | null | undefined;
  quick?: QuickDay[];
  invalid?: boolean | undefined;
  placeholder?: string;
}) {
  return (
    <Popover
      anchor={anchor}
      label={`تقویم — ${label}`}
      className="picker-popover picker-popover--date"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className={cx("picker-field", p.className)}
          aria-label={`${label}: ${value ? formatFullDate(value) : "انتخاب نشده"}${invalid ? " — لازم است" : ""}`}
          data-invalid={invalid || undefined}
          data-empty={value ? undefined : ""}
        >
          <Icon name="calendar" size={18} />
          <span className="picker-field__value">{value ? formatFullDate(value) : placeholder}</span>
          <Icon name="chevron-down" size={16} />
        </button>
      )}
    >
      {(close) => (
        <Calendar
          value={value}
          rangeFrom={rangeFrom ?? null}
          quick={quick}
          onPick={(d) => {
            onChange(d);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function Calendar({
  value,
  rangeFrom,
  quick,
  onPick,
}: {
  value: string | null;
  rangeFrom: string | null;
  quick: QuickDay[];
  onPick: (isoDay: string | null) => void;
}) {
  const today = tehranToday();
  const initial = value ?? rangeFrom ?? today;
  const [focus, setFocus] = useState(initial);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState(() => {
    const { jy, jm } = toJalali(initial);
    return { jy, jm };
  });
  const [mode, setMode] = useState<"days" | "months">("days");
  const cells = monthGrid(view.jy, view.jm);
  const rangeEnd = rangeFrom ? (hover ?? value) : null;

  const moveFocus = (next: string) => {
    if (rangeFrom && next < rangeFrom) return;
    setFocus(next);
    const j = toJalali(next);
    if (j.jy !== view.jy || j.jm !== view.jm) setView({ jy: j.jy, jm: j.jm });
    requestAnimationFrame(() =>
      document.querySelector<HTMLButtonElement>(`.picker-cal [data-day="${next}"]`)?.focus({ preventScroll: true }),
    );
  };
  const stepMonth = (delta: number) => {
    const next = addMonths(view.jy, view.jm, delta);
    setView(next);
  };

  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 };
    const j = toJalali(focus);
    if (e.key in map) {
      e.preventDefault();
      moveFocus(addDaysIso(focus, map[e.key] ?? 0));
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      const delta = e.key === "PageDown" ? 1 : -1;
      const n = addMonths(j.jy, j.jm, delta);
      const grid = monthGrid(n.jy, n.jm).filter(Boolean) as string[];
      moveFocus(grid[Math.min(j.jd, grid.length) - 1] ?? focus);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const col = (new Date(`${focus}T12:00:00Z`).getUTCDay() + 1) % 7;
      moveFocus(addDaysIso(focus, e.key === "Home" ? -col : 6 - col));
    }
  };

  const title = `${JALALI_MONTH_NAMES[view.jm - 1]} ${faDigits(view.jy)}`;

  return (
    <div className="picker-cal">
      <div className="picker-cal__head">
        <button
          type="button"
          className="picker-cal__nav"
          aria-label={mode === "days" ? "ماه قبل" : "سال قبل"}
          onClick={() => (mode === "days" ? stepMonth(-1) : setView((v) => ({ ...v, jy: v.jy - 1 })))}
        >
          <Icon name="chevron-right" size={18} />
        </button>
        <button
          type="button"
          className="picker-cal__title"
          aria-live="polite"
          aria-label={mode === "days" ? `${title} — انتخاب ماه و سال` : `سال ${faDigits(view.jy)} — بازگشت به روزها`}
          onClick={() => setMode((m) => (m === "days" ? "months" : "days"))}
        >
          {mode === "days" ? title : faDigits(view.jy)}
          <Icon name="chevron-down" size={14} />
        </button>
        <button
          type="button"
          className="picker-cal__nav"
          aria-label={mode === "days" ? "ماه بعد" : "سال بعد"}
          onClick={() => (mode === "days" ? stepMonth(1) : setView((v) => ({ ...v, jy: v.jy + 1 })))}
        >
          <Icon name="chevron-left" size={18} />
        </button>
      </div>

      {mode === "months" ? (
        <div className="picker-cal__months" role="group" aria-label={`ماه‌های سال ${faDigits(view.jy)}`}>
          {JALALI_MONTH_NAMES.map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={view.jm === i + 1}
              data-autofocus={view.jm === i + 1 || undefined}
              onClick={() => {
                setView((v) => ({ ...v, jm: i + 1 }));
                setMode("days");
              }}
            >
              {m}
            </button>
          ))}
        </div>
      ) : (
        <div className="picker-cal__grid" role="grid" aria-label={title} onKeyDown={onGridKey}>
          <div role="row" className="picker-cal__week">
            {WEEK.map((w, i) => (
              <span key={w} role="columnheader" aria-label={WEEK_FULL[i]} data-friday={i === 6 || undefined}>
                {w}
              </span>
            ))}
          </div>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, r) => (
            <div role="row" key={r} className="picker-cal__row">
              {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
                if (!d) return <span key={`e${c}`} role="gridcell" aria-hidden="true" />;
                const disabled = Boolean(rangeFrom && d < rangeFrom);
                const inRange = Boolean(rangeFrom && rangeEnd && d > rangeFrom && d < rangeEnd);
                const edge = Boolean(rangeFrom && (d === rangeFrom || (rangeEnd && d === rangeEnd)));
                const selected = d === value;
                return (
                  <span role="gridcell" key={d} aria-selected={selected}>
                    <button
                      type="button"
                      data-day={d}
                      tabIndex={d === focus ? 0 : -1}
                      data-autofocus={d === focus || undefined}
                      data-today={d === today || undefined}
                      data-selected={selected || undefined}
                      data-range={inRange || undefined}
                      data-edge={edge || undefined}
                      data-friday={c === 6 || undefined}
                      disabled={disabled}
                      aria-label={`${formatFullDate(d)}${d === today ? " (امروز)" : ""}`}
                      onMouseEnter={() => rangeFrom && setHover(d)}
                      onMouseLeave={() => rangeFrom && setHover(null)}
                      onFocus={() => setFocus(d)}
                      onClick={() => onPick(d)}
                    >
                      {faDigits(toJalali(d).jd)}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="picker-cal__foot">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            className="picker-chip"
            aria-pressed={q.value === value}
            disabled={Boolean(rangeFrom && q.value < rangeFrom)}
            onClick={() => onPick(q.value)}
          >
            {q.label}
          </button>
        ))}
        {value ? (
          <button type="button" className="picker-chip picker-chip--ghost" onClick={() => onPick(null)}>
            <Icon name="x" size={14} /> پاک کردن
          </button>
        ) : null}
      </div>
    </div>
  );
}
