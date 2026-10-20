"use client";
import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { faDigits, latinDigits } from "@/shared/lib/fa";
import { cx } from "@/shared/lib/cx";

const ORDINALS = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم"];

/**
 * خانه‌های کد یک‌بارمصرف (طرح P-05): چپ‌به‌راست، فقط رقم (فارسی/عربی هم پذیرفته)،
 * پرش خودکار، Backspace به خانهٔ قبل، جای‌گذاری/پرکردن خودکار پیامک (one-time-code)
 * در هر خانه‌ای که باشد، و فراخوانی `onComplete` با پر شدن آخرین رقم.
 */
export function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  describedBy,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  invalid: boolean;
  disabled: boolean;
  describedBy?: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  const box = (i: number) => group.current?.querySelectorAll<HTMLInputElement>("input")[i];

  const commit = (next: string, focusAt: number) => {
    const clean = next.slice(0, length);
    onChange(clean);
    box(Math.min(focusAt, length - 1))?.focus();
    if (clean.length === length) onComplete(clean);
  };

  const writeAt = (index: number, raw: string) => {
    const digits = latinDigits(raw).replace(/\D/g, "");
    if (!digits) return;
    if (digits.length === 1 && index < value.length) {
      // ویرایش یک رقم میانی: فقط همان خانه عوض می‌شود.
      commit(value.slice(0, index) + digits + value.slice(index + 1), index + 1);
      return;
    }
    // چند رقم (پرکردن خودکار سیستم‌عامل یا جای‌گذاری) ⇒ از همین خانه به بعد پخش می‌شود.
    const start = Math.min(index, value.length);
    commit(value.slice(0, start) + digits, start + digits.length);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i] !== undefined) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        onChange(value.slice(0, i - 1));
        box(i - 1)?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      box(i - 1)?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      box(Math.min(i + 1, value.length))?.focus();
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    writeAt(i, e.clipboardData.getData("text"));
  };

  return (
    <div
      ref={group}
      className={cx("otp-boxes", invalid && "otp-boxes--invalid")}
      dir="ltr"
      role="group"
      aria-label={`کد ${faDigits(length)} رقمی پیامک`}
      aria-describedby={describedBy}
    >
      {Array.from({ length }, (_, i) => (
        <input
          // ترتیب خانه‌ها ثابت است؛ شاخص کلید پایدار است.
          key={i}
          className="otp-box"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          data-autofocus={i === 0 ? "" : undefined}
          enterKeyHint={i === length - 1 ? "done" : "next"}
          aria-label={`رقم ${ORDINALS[i] ?? String(i + 1)}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={value[i] ?? ""}
          // انتخاب محتوا ⇒ تایپ رقم تازه جایگزین می‌شود؛ رقم در خانهٔ خالیِ جلوتر هم به
          // نخستین جای خالی می‌رود (writeAt).
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => writeAt(i, e.currentTarget.value.replace(value[i] ?? "", "") || e.currentTarget.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
        />
      ))}
    </div>
  );
}
