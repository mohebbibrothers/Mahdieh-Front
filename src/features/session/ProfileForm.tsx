"use client";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, useState, type FormEvent } from "react";
import { z } from "zod/mini";
import { fieldErrors, updateProfile, type ProfileInput } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { configQuery } from "@/shared/api/queries";
import type { Profile } from "@/shared/api/schemas";
import { latinDigits } from "@/shared/lib/fa";
import { Combobox, type ComboOption } from "@/shared/ui/Combobox";
import { Icon } from "@/shared/ui/Icon";
import { isValidNationalId } from "./identity";

const provinceRow = z.object({ value: z.string(), label: z.string() });
const countryRow = z.object({ code: z.string(), title: z.string(), title_en: z.string(), priority: z.boolean() });
const IRAN = "IR";

type Field = keyof ProfileInput;

/**
 * تکمیل پروفایل (ADR-0019): تبعهٔ ایران ⇒ نام فارسی، کد ملی، استان، شهر؛
 * زائر خارجی ⇒ نام مطابق گذرنامه، ملیت، شمارهٔ گذرنامه، شهر. فهرست‌ها از ‎/config‎ می‌آیند،
 * بررسی فوری در مرورگر فقط راهنماست و پیام‌های فیلدبه‌فیلد سرور زیر همان فیلد می‌نشیند.
 */
export function ProfileForm({
  profile,
  onDone,
  onSkip,
}: {
  profile: Profile | null;
  onDone: (p: Profile) => void;
  onSkip?: (() => void) | undefined;
}) {
  const config = useQuery(configQuery);
  const formId = useId();
  const [v, setV] = useState<ProfileInput>(() => ({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    nationality: profile?.nationality || IRAN,
    province: profile?.province ?? "",
    city: profile?.city ?? "",
    national_id: "",
    passport_number: "",
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const foreign = v.nationality !== IRAN;

  const provinces = useMemo<ComboOption[]>(
    () =>
      (config.data?.provinces ?? []).flatMap((r) => {
        const p = provinceRow.safeParse(r);
        return p.success ? [{ value: p.data.value, label: p.data.label }] : [];
      }),
    [config.data],
  );
  const countries = useMemo<ComboOption[]>(
    () =>
      (config.data?.countries ?? []).flatMap((r) => {
        const c = countryRow.safeParse(r);
        return c.success
          ? [{ value: c.data.code, label: c.data.title, keywords: c.data.title_en, priority: c.data.priority }]
          : [];
      }),
    [config.data],
  );

  const set = (k: Field) => (value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  /** همان قواعد سرور، برای بازخورد پیش از ارسال. */
  const localCheck = (): Partial<Record<Field, string>> => {
    const e: Partial<Record<Field, string>> = {};
    if (v.first_name.trim().length < 2) e.first_name = "نام را کامل بنویسید.";
    if (v.last_name.trim().length < 2) e.last_name = "نام خانوادگی را کامل بنویسید.";
    if (foreign) {
      if (v.passport_number.trim().length < 5) e.passport_number = "شمارهٔ گذرنامه را مطابق گذرنامه وارد کنید.";
    } else {
      if (!isValidNationalId(v.national_id)) e.national_id = "کد ملی ۱۰ رقمی معتبر نیست؛ دوباره بررسی کنید.";
      if (!v.province) e.province = "استان محل سکونت را انتخاب کنید.";
    }
    const city = v.city.trim().length;
    if (city < 2 || city > 60) e.city = "نام شهر باید بین ۲ تا ۶۰ نویسه باشد.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const local = localCheck();
    if (Object.keys(local).length) {
      setErrors(local);
      focusFirstError(formId, local);
      return;
    }
    setBusy(true);
    try {
      const saved = await updateProfile({
        ...v,
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        city: v.city.trim(),
        national_id: foreign ? "" : latinDigits(v.national_id).replace(/\D/g, ""),
        passport_number: foreign ? v.passport_number.trim().toUpperCase() : "",
        province: foreign ? "" : v.province,
      });
      onDone(saved);
    } catch (e) {
      const fe = fieldErrors(e) as Partial<Record<Field, string>>;
      setErrors(fe);
      if (Object.keys(fe).length) focusFirstError(formId, fe);
      else setFormError(e instanceof ApiError ? e.message : "ذخیرهٔ مشخصات ممکن نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const text = (k: Field, label: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <div className="acc-field" data-field={k}>
      <label className="field-label" htmlFor={`${formId}-${k}`}>
        {label}
        <span className="required-star" aria-hidden="true">
          {" "}
          *
        </span>
      </label>
      <input
        id={`${formId}-${k}`}
        className="text-input"
        value={v[k]}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `${formId}-${k}-err` : undefined}
        required
        {...extra}
      />
      {errors[k] ? (
        <p className="field-error" id={`${formId}-${k}-err`}>
          {errors[k]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form id={formId} className="profile-form" onSubmit={submit} noValidate>
      <p className="account-lead">
        <Icon name="id-card" size={20} />
        <span>
          برای رزرو، مشخصات سرپرست زائران یک بار ثبت می‌شود. کد ملی و گذرنامه رمزنگاری‌شده نگه‌داری می‌شوند و جایی نمایش
          داده نمی‌شوند.
        </span>
      </p>

      <div className="acc-field" data-field="nationality">
        <Combobox
          label="ملیت"
          required
          options={countries}
          value={v.nationality}
          onChange={set("nationality")}
          error={errors.nationality}
          placeholder="نام کشور را بنویسید"
        />
      </div>

      <div className="acc-row">
        {text("first_name", foreign ? "نام (مطابق گذرنامه)" : "نام", { autoComplete: "given-name", maxLength: 50 })}
        {text("last_name", foreign ? "نام خانوادگی (مطابق گذرنامه)" : "نام خانوادگی", {
          autoComplete: "family-name",
          maxLength: 50,
        })}
      </div>

      {foreign ? (
        text("passport_number", "شمارهٔ گذرنامه", {
          dir: "ltr",
          autoComplete: "off",
          maxLength: 24,
          spellCheck: false,
          autoCapitalize: "characters",
        })
      ) : (
        <>
          {text("national_id", "کد ملی", {
            dir: "ltr",
            inputMode: "numeric",
            autoComplete: "off",
            maxLength: 12,
            className: "text-input latin",
          })}
          <div className="acc-field" data-field="province">
            <Combobox
              label="استان محل سکونت"
              required
              options={provinces}
              value={v.province}
              onChange={set("province")}
              error={errors.province}
              placeholder="نام استان را بنویسید"
            />
          </div>
        </>
      )}
      {text("city", foreign ? "شهر محل سکونت" : "شهر", { autoComplete: "address-level2", maxLength: 60 })}

      {formError ? (
        <p className="account-alert" data-tone="danger" role="alert">
          <Icon name="info" size={18} /> {formError}
        </p>
      ) : null}

      <div className="account-actions">
        <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy || undefined}>
          {busy ? "در حال ذخیره…" : "ذخیره و ادامه"}
          <Icon name="arrow-left" size={18} />
        </button>
        {onSkip ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={onSkip}>
            بعداً کامل می‌کنم
          </button>
        ) : null}
      </div>
    </form>
  );
}

function focusFirstError(formId: string, e: Partial<Record<Field, string>>) {
  const order: Field[] = [
    "nationality",
    "first_name",
    "last_name",
    "passport_number",
    "national_id",
    "province",
    "city",
  ];
  const first = order.find((k) => e[k]);
  if (!first) return;
  requestAnimationFrame(() => {
    document.querySelector<HTMLInputElement>(`#${CSS.escape(formId)} [data-field="${first}"] input`)?.focus();
  });
}
