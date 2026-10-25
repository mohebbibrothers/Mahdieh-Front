"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { VerifyCertificateButton } from "@/features/verify-certificate/VerifyCertificate";
import { type OfflineFields, checkOffline } from "@/shared/api/portal";
import { propertyQuery } from "@/shared/api/queries";
import { faDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";
import { certificateStamp, normalizeCode, normalizeShortCode } from "./model";
import { SectionHead } from "./parts";

type Draft = {
  code: string;
  holder: string;
  unit: string;
  guests: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  short: string;
};
const EMPTY: Draft = {
  code: "",
  holder: "",
  unit: "",
  guests: 1,
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  short: "",
};

/**
 * استعلام اصالت گواهی (لنگر ‎#verify‎) — برخط با QR (امضای سرور) و آفلاین با مشخصات چاپی + کد کوتاه
 * ۸ نویسه‌ای. کد کوتاه HMAC کلیددار سرور است (نه هش قابل‌بازسازی طرح اولیه) ⇒ بی کلید سرور جعل‌ناپذیر.
 */
export function VerifySection() {
  return (
    <section className="pt-section" aria-labelledby="pt-verify-title" id="verify">
      <SectionHead
        id="pt-verify-title"
        icon="shield-check"
        title="استعلام اصالت گواهی اقامت"
        aside="ویژهٔ خادمان پذیرش، بازرسان بین‌راهی و خود زائران"
      />
      <div className="pt-verify">
        <article className="pt-card pt-verify__online">
          <span className="pt-verify__icon" aria-hidden="true">
            <Icon name="qr" size={26} />
          </span>
          <h3>استعلام برخط با QR</h3>
          <p>
            QR روی گواهی را با دوربین گوشی اسکن کنید یا نشانی زیر آن را این‌جا بچسبانید؛ امضای دیجیتال روی سرور مهدیه
            بررسی و با وضعیت لحظه‌ای رزرو تطبیق داده می‌شود.
          </p>
          <VerifyCertificateButton className="btn btn-primary btn-block" />
        </article>
        <OfflineVerify />
      </div>
    </section>
  );
}

function OfflineVerify() {
  const id = useId();
  const property = useQuery(propertyQuery);
  const [d, setD] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const units = property.data?.flatMap((f) => f.units.map((u) => ({ ...u, floor: f.number }))) ?? [];
  const unit = units.find((u) => u.code === d.unit);
  const starts = certificateStamp(d.startDate, d.startTime);
  const ends = certificateStamp(d.endDate, d.endTime);
  const short = normalizeShortCode(d.short);
  const missing = {
    code: !normalizeCode(d.code),
    holder: !d.holder.trim(),
    unit: !unit,
    starts: !starts,
    ends: !ends,
    short: short.length !== 8,
  };
  const ok = !Object.values(missing).some(Boolean);
  const check = useMutation({ mutationFn: (body: OfflineFields) => checkOffline(body) });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((cur) => ({ ...cur, [k]: v }));
    check.reset();
  };
  const err = (k: keyof typeof missing) => (touched && missing[k] ? true : undefined);

  return (
    <article className="pt-card pt-verify__offline">
      <header className="pt-card__head">
        <h3>
          <Icon name="cloud-off" size={18} /> بازرسی آفلاین با مشخصات چاپی
        </h3>
      </header>
      <p className="pt-card__hint">
        <span>
          مشخصات را <b>دقیقاً همان‌طور که روی برگه چاپ شده</b> وارد کنید؛ کد کوتاه با کلید محرمانهٔ سرور از همین مشخصات
          بازمحاسبه می‌شود و هر تغییر کوچک آن را نامعتبر می‌کند.
        </span>
      </p>
      <form
        className="pt-offline"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!ok || !unit || !starts || !ends) return;
          check.mutate({
            code: normalizeCode(d.code),
            holder: d.holder.trim().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " "),
            unit: unit.code,
            floor: unit.floor,
            guests: d.guests,
            starts,
            ends,
            short_code: short,
          });
        }}
      >
        <div className="pt-offline__grid">
          <label className="pt-field">
            <span className="field-label">کد پیگیری رزرو</span>
            <input
              className="text-input latin"
              dir="ltr"
              value={d.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="M-1405-0000"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={err("code")}
            />
          </label>
          <label className="pt-field">
            <span className="field-label">نام سرپرست زائران (مطابق برگه)</span>
            <input
              className="text-input"
              value={d.holder}
              onChange={(e) => set("holder", e.target.value)}
              autoComplete="off"
              aria-invalid={err("holder")}
            />
          </label>
        </div>

        <div className="pt-field" role="group" aria-labelledby={`${id}-unit`}>
          <span className="field-label" id={`${id}-unit`}>
            واحد اختصاص‌یافته {unit ? <small>(طبقهٔ {faDigits(unit.floor)} — خودکار)</small> : null}
          </span>
          <div className="pt-unit-pick" data-invalid={err("unit")}>
            {units.map((u) => (
              <button
                key={u.code}
                type="button"
                aria-pressed={d.unit === u.code}
                onClick={() => set("unit", u.code)}
                title={u.title}
              >
                <bdi className="latin">{u.code}</bdi>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-field">
          <span className="field-label" id={`${id}-guests`}>
            تعداد مهمانان
          </span>
          <Stepper
            value={d.guests}
            min={1}
            max={unit?.capacity_total ?? 12}
            onChange={(v) => set("guests", v)}
            format={(v) => `${faDigits(v)} نفر`}
            labelId={`${id}-guests`}
            incLabel="افزودن یک نفر"
            decLabel="کاستن یک نفر"
          />
        </div>

        <div className="pt-offline__grid">
          <fieldset className="pt-field pt-stamp">
            <legend className="field-label">آغاز پذیرش (ورود)</legend>
            <input
              className="text-input"
              dir="ltr"
              inputMode="numeric"
              value={d.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              placeholder="۱۴۰۵/۰۸/۱۰"
              aria-label="تاریخ ورود"
              aria-invalid={err("starts")}
            />
            <input
              className="text-input"
              dir="ltr"
              inputMode="numeric"
              value={d.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              placeholder="۰۸:۰۰"
              aria-label="ساعت ورود"
              aria-invalid={err("starts")}
            />
          </fieldset>
          <fieldset className="pt-field pt-stamp">
            <legend className="field-label">پایان اقامت (تخلیه)</legend>
            <input
              className="text-input"
              dir="ltr"
              inputMode="numeric"
              value={d.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              placeholder="۱۴۰۵/۰۸/۱۲"
              aria-label="تاریخ تخلیه"
              aria-invalid={err("ends")}
            />
            <input
              className="text-input"
              dir="ltr"
              inputMode="numeric"
              value={d.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              placeholder="۲۰:۰۰"
              aria-label="ساعت تخلیه"
              aria-invalid={err("ends")}
            />
          </fieldset>
        </div>

        <label className="pt-field">
          <span className="field-label">کد کوتاه ۸ نویسه‌ای گواهی</span>
          <input
            className="text-input latin pt-short"
            dir="ltr"
            value={short.length > 4 ? `${short.slice(0, 4)}-${short.slice(4)}` : short}
            onChange={(e) => set("short", e.target.value)}
            placeholder="XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={err("short")}
          />
        </label>

        {touched && !ok ? (
          <p className="field-error" role="alert">
            همهٔ مشخصات لازم است؛ تاریخ را به شکل ۱۴۰۵/۰۸/۱۰ یا «۱۰ آبان ۱۴۰۵» و ساعت را به شکل ۰۸:۰۰ وارد کنید.
          </p>
        ) : null}
        {check.data ? (
          <div className="verify-result" data-tone={check.data.valid ? "success" : "danger"} role="status">
            <Icon name={check.data.valid ? "shield-check" : "alert"} size={22} />
            <div>
              <strong>{check.data.valid ? "گواهی با این مشخصات اصل است" : "کد کوتاه با این مشخصات نمی‌خواند"}</strong>
              <p>
                {check.data.valid
                  ? "مشخصات چاپی دست‌نخورده است. وضعیت لحظه‌ای رزرو را در صورت دسترسی به اینترنت با QR هم بررسی کنید."
                  : "یا گواهی جعلی است یا یکی از مشخصات با برگه فرق دارد (نام، ساعت، تعداد نفرات). دوباره با دقت تطبیق دهید."}
              </p>
            </div>
          </div>
        ) : null}
        {check.error ? (
          <p className="field-error" role="alert">
            {check.error.message}
          </p>
        ) : null}
        <button
          type="submit"
          className="btn btn-secondary btn-block"
          disabled={check.isPending}
          aria-busy={check.isPending}
        >
          {check.isPending ? <span className="spinner" aria-hidden="true" /> : <Icon name="shield-check" size={18} />}
          بررسی اصالت آفلاین
        </button>
      </form>
    </article>
  );
}
