"use client";
import { useEffect, useRef } from "react";
import { faDigits, latinDigits } from "@/shared/lib/fa";

/**
 * ورود کد یک‌بارمصرف: «یک» ورودی واقعی (نه پنج ورودی جدا) زیر خانه‌های نمایشی.
 * ⇒ پرشدن خودکار پیامک (autocomplete=one-time-code در iOS/Android)، چسباندن، پاک‌کردن و
 * صفحه‌خوان همه طبیعی کار می‌کنند؛ ارقام فارسی/عربی پذیرفته و یکسان می‌شوند.
 */
export function OtpField({
  length,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  describedBy,
  label,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string | undefined;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  useEffect(() => {
    if (invalid) ref.current?.select();
  }, [invalid]);

  return (
    <div className="otp-field" data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      <input
        ref={ref}
        className="otp-field__input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="done"
        dir="ltr"
        maxLength={length + 4}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const next = latinDigits(e.target.value).replace(/\D/g, "").slice(0, length);
          onChange(next);
          if (next.length === length && next !== value) onComplete(next);
        }}
      />
      <div className="otp-field__boxes" dir="ltr" aria-hidden="true">
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className="otp-field__box"
            data-filled={i < value.length || undefined}
            data-caret={i === Math.min(value.length, length - 1) || undefined}
          >
            {value[i] ? faDigits(value[i]) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
