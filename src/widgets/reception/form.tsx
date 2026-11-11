"use client";
import { useId, type ReactNode } from "react";
import { ApiError } from "@/shared/api/client";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { REASON_MIN } from "./model";

/** پیام نخستین خطای فیلدِ پاسخ ‎422‎ سرور (‎errors.{field}[0]‎) — برای نشاندن زیر همان فیلد. */
export function fieldError(e: unknown, field: string): string | undefined {
  if (!(e instanceof ApiError)) return undefined;
  const errors = (e.body as { errors?: Record<string, unknown> } | null)?.errors;
  const list = errors?.[field];
  return Array.isArray(list) && typeof list[0] === "string" ? list[0] : undefined;
}

/**
 * دلیل اجباری حسابرسی: چند دلیل آماده (یک‌لمسی) + متن آزاد با شمارندهٔ حداقل نویسه. هیچ کنش حساسی بی‌دلیل
 * ثبت نمی‌شود و دکمهٔ تأیید تا رسیدن به حداقل غیرفعال می‌ماند (همان قاعدهٔ سرور).
 */
export function ReasonField({
  label,
  value,
  onChange,
  presets = [],
  placeholder,
  min = REASON_MIN,
  max = 300,
  error,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: readonly string[];
  placeholder?: string;
  min?: number;
  max?: number;
  error?: string | undefined;
  optional?: boolean;
}) {
  const id = useId();
  const length = value.trim().length;
  const short = !optional && length < min;
  return (
    <div className="rc-field">
      <label className="field-label" htmlFor={id}>
        {label}
        {optional ? <span className="rc-optional"> (اختیاری)</span> : null}
      </label>
      {presets.length ? (
        <div className="rc-suggest" role="group" aria-label={`پیشنهادهای ${label}`}>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className="rc-suggest__chip"
              aria-pressed={value === p}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        id={id}
        className="text-input rc-textarea"
        rows={2}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.value)}
      />
      <p id={`${id}-hint`} className={cx("rc-field__hint", (error || short) && "rc-field__hint--warn")}>
        {error ??
          (short
            ? `دست‌کم ${faDigits(min)} نویسه — ${faDigits(length)} نوشته‌اید`
            : `${faDigits(length)} از ${faDigits(max)} نویسه · در حسابرسی ثبت می‌شود`)}
      </p>
    </div>
  );
}

export type ChoiceItem<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: IconName;
  disabled?: boolean;
};

/** گروه گزینهٔ کارتی (رادیوی بومی و دسترس‌پذیر؛ نه منوی کشویی بومی) — برای ۲ تا ۶ گزینه. */
export function ChoiceCards<T extends string>({
  legend,
  items,
  value,
  onChange,
  columns = 2,
}: {
  legend: string;
  items: ReadonlyArray<ChoiceItem<T>>;
  value: T | null;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  const name = useId();
  return (
    <fieldset className="rc-choices" data-cols={columns}>
      <legend className="field-label">{legend}</legend>
      {items.map((it) => (
        <label key={it.value} className="rc-choice" data-disabled={it.disabled || undefined}>
          <input
            type="radio"
            name={name}
            value={it.value}
            checked={value === it.value}
            disabled={it.disabled}
            onChange={() => onChange(it.value)}
          />
          {it.icon ? <Icon name={it.icon} size={18} /> : null}
          <span>
            <strong>{it.label}</strong>
            {it.hint ? <small>{it.hint}</small> : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** کارت خلاصهٔ بالای پنجره (واحد/زائر) با رنگ هم‌خوان کنش. */
export function Summary({
  tone = "neutral",
  title,
  children,
  aside,
}: {
  tone?: "neutral" | "amber" | "danger" | "brand";
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="rc-summary" data-tone={tone}>
      <div>
        <strong className="rc-summary__title">{title}</strong>
        {children ? <div className="rc-summary__body">{children}</div> : null}
      </div>
      {aside ? <div className="rc-summary__aside">{aside}</div> : null}
    </div>
  );
}

/** دکمه‌های پایین پنجره: انصراف + تأیید (با حالت در حال ارسال). */
export function DialogActions({
  onCancel,
  submitLabel,
  submitIcon,
  disabled,
  busy,
  tone = "brand",
  form,
}: {
  onCancel: () => void;
  submitLabel: string;
  submitIcon: IconName;
  disabled?: boolean;
  busy?: boolean;
  tone?: "brand" | "amber" | "danger";
  form?: string;
}) {
  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>
        انصراف و بازگشت
      </button>
      <button
        type="submit"
        form={form}
        className={cx("btn btn-primary", tone !== "brand" && `rc-btn-${tone}`)}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
      >
        {busy ? <span className="rc-spinner" aria-hidden="true" /> : <Icon name={submitIcon} size={18} />}
        <span>{submitLabel}</span>
      </button>
    </>
  );
}
