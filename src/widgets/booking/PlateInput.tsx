"use client";
import { useId, useRef, useState } from "react";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import {
  EMPTY_PLATE,
  PLATE_LETTERS,
  composePlate,
  plateDigits,
  plateEmpty,
  plateFilled,
  plateLetter,
  type PlateParts,
} from "./model";

export type PlateValue = { text: string; complete: boolean };

/**
 * پلاک خودرو به شکل پلاک واقعی ایران («۱۲ ب ۳۴۵ | ایران ۳۶») — خانه‌ها چپ‌به‌راست مثل خود پلاک،
 * پرش خودکار به خانهٔ بعد، حرف از جدول حروف (بی‌نیاز از صفحه‌کلید فارسی)؛ و حالت «پلاک خارجی/آزاد».
 * خروجی همیشه زیر سقف ۲۰ نویسهٔ بک‌اند است؛ پلاک نیمه‌کاره «ناقص» گزارش می‌شود تا ارسال نشود.
 */
export function PlateInput({ onChange, invalid }: { onChange: (v: PlateValue) => void; invalid: boolean }) {
  const id = useId();
  const [foreign, setForeign] = useState(false);
  const [parts, setParts] = useState<PlateParts>(EMPTY_PLATE);
  const [free, setFree] = useState("");
  const [letters, setLetters] = useState(false);
  const twoRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLButtonElement>(null);
  const threeRef = useRef<HTMLInputElement>(null);
  const regionRef = useRef<HTMLInputElement>(null);

  const emit = (p: PlateParts) => {
    setParts(p);
    onChange(plateEmpty(p) ? { text: "", complete: true } : { text: composePlate(p), complete: plateFilled(p) });
  };
  const setDigits = (key: "two" | "three" | "region", raw: string, max: number, next?: () => void) => {
    const v = plateDigits(raw, max);
    emit({ ...parts, [key]: v });
    if (v.length === max && next) next();
  };
  const chooseLetter = (ch: string) => {
    emit({ ...parts, letter: ch });
    setLetters(false);
    threeRef.current?.focus();
  };
  const switchMode = (toForeign: boolean) => {
    setForeign(toForeign);
    setLetters(false);
    onChange(
      toForeign
        ? { text: free.trim(), complete: true }
        : plateEmpty(parts)
          ? { text: "", complete: true }
          : { text: composePlate(parts), complete: plateFilled(parts) },
    );
  };

  return (
    <div className="plate-field" role="group" aria-labelledby={`${id}-l`} aria-describedby={`${id}-h`}>
      <div className="plate-field__top">
        <span className="field-label" id={`${id}-l`}>
          پلاک خودرو (اختیاری)
        </span>
        <div className="mini-seg" role="group" aria-label="نوع پلاک">
          <button type="button" aria-pressed={!foreign} onClick={() => switchMode(false)}>
            پلاک ایرانی
          </button>
          <button type="button" aria-pressed={foreign} onClick={() => switchMode(true)}>
            خارجی / آزاد
          </button>
        </div>
      </div>

      {foreign ? (
        <input
          className="text-input"
          dir="auto"
          maxLength={20}
          value={free}
          aria-labelledby={`${id}-l`}
          aria-describedby={`${id}-h`}
          placeholder="مثال: IRQ 12345"
          autoComplete="off"
          onChange={(e) => {
            setFree(e.target.value);
            onChange({ text: e.target.value.trim(), complete: true });
          }}
        />
      ) : (
        <div className={cx("plate", invalid && "plate--invalid")} dir="ltr">
          <span className="plate__flag" aria-hidden="true">
            <i />
            <b>I.R.</b>
            <b>IRAN</b>
          </span>
          <input
            ref={twoRef}
            className="plate__cell plate__cell--2"
            inputMode="numeric"
            autoComplete="off"
            aria-label="دو رقم نخست پلاک"
            placeholder="۱۲"
            value={faDigits(parts.two)}
            onChange={(e) => setDigits("two", e.target.value, 2, () => letterRef.current?.focus())}
          />
          <span className="plate__letter-wrap">
            <button
              ref={letterRef}
              type="button"
              className="plate__cell plate__letter"
              aria-label={parts.letter ? `حرف پلاک: ${parts.letter} — تغییر` : "انتخاب حرف پلاک"}
              aria-expanded={letters}
              aria-controls={`${id}-letters`}
              onClick={() => setLetters((o) => !o)}
              onKeyDown={(e) => {
                const ch = plateLetter(e.key);
                if (ch) {
                  e.preventDefault();
                  chooseLetter(ch);
                }
              }}
            >
              {parts.letter || <span aria-hidden="true">ب</span>}
            </button>
            {letters ? (
              <span
                id={`${id}-letters`}
                className="plate__letters"
                role="group"
                aria-label="حروف پلاک"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setLetters(false);
                    letterRef.current?.focus();
                  }
                }}
              >
                {[...PLATE_LETTERS].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={parts.letter === ch}
                    onClick={() => chooseLetter(ch)}
                    autoFocus={parts.letter ? parts.letter === ch : ch === "ب"}
                  >
                    {ch === "ا" ? "الف" : ch}
                  </button>
                ))}
              </span>
            ) : null}
          </span>
          <input
            ref={threeRef}
            className="plate__cell plate__cell--3"
            inputMode="numeric"
            autoComplete="off"
            aria-label="سه رقم میانی پلاک"
            placeholder="۳۴۵"
            value={faDigits(parts.three)}
            onChange={(e) => setDigits("three", e.target.value, 3, () => regionRef.current?.focus())}
          />
          <span className="plate__region">
            <small aria-hidden="true">ایران</small>
            <input
              ref={regionRef}
              className="plate__cell plate__cell--r"
              inputMode="numeric"
              autoComplete="off"
              aria-label="کد استانی پلاک (دو رقم)"
              placeholder="۳۶"
              value={faDigits(parts.region)}
              onChange={(e) => setDigits("region", e.target.value, 2)}
            />
          </span>
        </div>
      )}
      <p className={invalid ? "field-error" : "field-help"} id={`${id}-h`}>
        {invalid ? (
          <>
            <Icon name="info" size={14} /> پلاک کامل نیست؛ همهٔ خانه‌ها را پر کنید یا پاکشان کنید.
          </>
        ) : (
          "در صورت سفر با خودرو شخصی، جهت اختصاص جایگاه پارک موقوفه"
        )}
      </p>
    </div>
  );
}
