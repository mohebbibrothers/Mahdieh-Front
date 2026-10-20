"use client";
import { Icon } from "./Icon";

/** شمارندهٔ +/− با خروجی زندهٔ دسترس‌پذیر (RTL: افزایش سمت راست). */
export function Stepper({
  value,
  min,
  max,
  onChange,
  format,
  labelId,
  incLabel,
  decLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  labelId: string;
  incLabel: string;
  decLabel: string;
}) {
  return (
    <div className="stepper" role="group" aria-labelledby={labelId}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={incLabel}
      >
        <Icon name="plus" size={18} />
      </button>
      <output className="stepper__value" aria-live="polite">
        {format(value)}
      </output>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decLabel}
      >
        <Icon name="minus" size={18} />
      </button>
    </div>
  );
}
