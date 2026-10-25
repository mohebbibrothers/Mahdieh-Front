"use client";
import { useState } from "react";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { Icon } from "./Icon";
import { Popover, type PopoverAnchor } from "./Popover";

export type TimePreset = { value: string; label: string };

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
/** روز = ۶ تا ۱۷:۵۹ (رنگ آفتابی)، شب = بقیه — فقط راهنمای دیداری سانس روز/شب. */
const isDay = (h: number) => h >= 6 && h < 18;

/**
 * انتخاب‌گر ساعت ۲۴ساعته (پاپ‌اور بومی؛ موبایل: برگهٔ پایینی) — نمایشگر دیجیتال دوبخشی، ساعت‌های
 * پرکاربرد (مرز سانس‌ها از ‎/config‎)، جدول ۲۴ ساعت با تمایز روز/شب، و دقیقه با گام ۵.
 * انتخاب ساعت ⇒ رفتن خودکار به دقیقه؛ انتخاب دقیقه یا ساعت پرکاربرد ⇒ ثبت و بستن.
 */
export function TimePicker({
  anchor,
  label,
  value,
  onChange,
  presets = [],
  invalid,
  placeholder = "ساعت",
}: {
  anchor: PopoverAnchor;
  label: string;
  value: string;
  onChange: (hhmm: string) => void;
  presets?: TimePreset[];
  invalid?: boolean | undefined;
  placeholder?: string;
}) {
  return (
    <Popover
      anchor={anchor}
      label={`ساعت — ${label}`}
      className="picker-popover picker-popover--time"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className={cx("picker-field picker-field--time", p.className)}
          aria-label={`${label}: ${value ? faDigits(value) : "انتخاب نشده"}${invalid ? " — لازم است" : ""}`}
          data-invalid={invalid || undefined}
          data-empty={value ? undefined : ""}
        >
          <Icon name="clock" size={18} />
          <span className="picker-field__value">{value ? <bdi dir="ltr">{faDigits(value)}</bdi> : placeholder}</span>
          <Icon name="chevron-down" size={16} />
        </button>
      )}
    >
      {(close) => (
        <Clock
          value={value}
          presets={presets}
          onPick={(v) => {
            onChange(v);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function Clock({ value, presets, onPick }: { value: string; presets: TimePreset[]; onPick: (v: string) => void }) {
  const [h0, m0] = value ? value.split(":").map(Number) : [null, null];
  const [hour, setHour] = useState<number | null>(h0 ?? null);
  const [minute, setMinute] = useState<number>(m0 ?? 0);
  const [part, setPart] = useState<"hour" | "minute">("hour");

  return (
    <div className="picker-clock">
      <div className="picker-clock__display" dir="ltr" role="group" aria-label="ساعت انتخابی">
        <button
          type="button"
          aria-pressed={part === "hour"}
          aria-label={`ساعت: ${hour === null ? "—" : faDigits(pad(hour))}`}
          onClick={() => setPart("hour")}
        >
          {hour === null ? "--" : faDigits(pad(hour))}
        </button>
        <span aria-hidden="true">:</span>
        <button
          type="button"
          aria-pressed={part === "minute"}
          aria-label={`دقیقه: ${faDigits(pad(minute))}`}
          onClick={() => hour !== null && setPart("minute")}
          disabled={hour === null}
        >
          {faDigits(pad(minute))}
        </button>
        {hour !== null ? (
          <span className="picker-clock__shift" data-day={isDay(hour) || undefined}>
            <Icon name={isDay(hour) ? "sun" : "moon"} size={14} />
            {isDay(hour) ? "روز" : "شب"}
          </span>
        ) : null}
      </div>

      {presets.length ? (
        <div className="picker-clock__presets" role="group" aria-label="ساعت‌های پرکاربرد گواهی">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              className="picker-chip"
              aria-pressed={p.value === value}
              data-autofocus={(p.value === value && part === "hour") || undefined}
              onClick={() => onPick(p.value)}
            >
              <bdi dir="ltr">{faDigits(p.value)}</bdi>
              <small>{p.label}</small>
            </button>
          ))}
        </div>
      ) : null}

      {part === "hour" ? (
        <div className="picker-clock__grid picker-clock__grid--hours" role="group" aria-label="ساعت">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={hour === h}
              data-day={isDay(h) || undefined}
              data-autofocus={(hour === h && !presets.some((p) => p.value === value)) || undefined}
              aria-label={`ساعت ${faDigits(h)}`}
              onClick={() => {
                setHour(h);
                setPart("minute");
              }}
            >
              {faDigits(pad(h))}
            </button>
          ))}
        </div>
      ) : (
        <div className="picker-clock__grid picker-clock__grid--minutes" role="group" aria-label="دقیقه">
          {MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={minute === m}
              data-autofocus={minute === m || undefined}
              aria-label={`دقیقهٔ ${faDigits(m)}`}
              onClick={() => {
                setMinute(m);
                if (hour !== null) onPick(`${pad(hour)}:${pad(m)}`);
              }}
            >
              :{faDigits(pad(m))}
            </button>
          ))}
        </div>
      )}
      <p className="picker-clock__hint">
        {part === "hour" ? "ساعت را برگزینید؛ سپس دقیقه." : "دقیقه را برگزینید تا ثبت شود."}
      </p>
    </div>
  );
}
