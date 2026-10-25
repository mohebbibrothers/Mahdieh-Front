"use client";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod/mini";
import { fieldErrors, updateProfile, type ProfileInput } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { configQuery } from "@/shared/api/queries";
import type { Profile } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import { latinDigits } from "@/shared/lib/fa";
import { Combobox, type ComboOption } from "@/shared/ui/Combobox";
import { Icon } from "@/shared/ui/Icon";
import { isValidNationalId } from "./identity";

const provinceRow = z.object({ value: z.string(), label: z.string() });
const countryRow = z.object({ code: z.string(), title: z.string(), title_en: z.string(), priority: z.boolean() });
const IRAN = "IR";
/** استان‌های پرتکرار زائران (طراح P-05)؛ کشورها پرچم ‎priority‎ را از خود ‎/config‎ دارند. */
const FREQUENT_PROVINCES = new Set(["khorasan_razavi", "tehran", "isfahan", "fars", "khorasan_south"]);

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
  variant = "dialog",
  submitLabel = "ذخیره و ادامه",
  skipLabel = "بعداً کامل می‌کنم",
  lead,
}: {
  profile: Profile | null;
  onDone: (p: Profile) => void;
  onSkip?: (() => void) | undefined;
  variant?: "dialog" | "page";
  submitLabel?: string;
  skipLabel?: string;
  /** متن راهنمای بالای فرم؛ ‎null‎ = بی‌راهنما (صفحه خودش توضیح داده است) */
  lead?: ReactNode;
}) {
  const page = variant === "page";
  /**
   * ویرایش مشخصات کامل: مدرک هویتی ثبت‌شده (رمزنگاری‌شده؛ فقط ۴ نویسهٔ آخر برمی‌گردد) حفظ می‌شود و دوباره
   * خواسته نمی‌شود — مدرک خالی در ‎PATCH‎ یعنی «همان قبلی» (سرور: ‎_keeps_document‎). فقط با تغییر نوع تابعیت
   * یا کشور، یا انتخاب آگاهانهٔ «تغییر»، مدرک تازه لازم است.
   */
  const editing = Boolean(profile?.is_profile_complete);
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
  const [changeDoc, setChangeDoc] = useState(false);
  const [initial] = useState(v);
  const foreign = v.nationality !== IRAN;
  const masked = profile?.national_id_masked && profile.national_id_masked !== "—" ? profile.national_id_masked : null;
  const docOnFile =
    editing &&
    Boolean(masked) &&
    (foreign
      ? profile?.id_document_type === "passport" && v.nationality === profile.nationality
      : profile?.id_document_type === "national_id");
  const keepDoc = docOnFile && !changeDoc;
  const dirty =
    (["first_name", "last_name", "nationality", "province", "city"] as const).some(
      (k) => v[k].trim() !== initial[k].trim(),
    ) ||
    (!keepDoc && Boolean((foreign ? v.passport_number : v.national_id).trim()));
  const clean = editing && !dirty;

  const provinces = useMemo<ComboOption[]>(
    () =>
      (config.data?.provinces ?? []).flatMap((r) => {
        const p = provinceRow.safeParse(r);
        return p.success
          ? [{ value: p.data.value, label: p.data.label, priority: FREQUENT_PROVINCES.has(p.data.value) }]
          : [];
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
      if (!v.nationality) e.nationality = "کشور محل تابعیت را انتخاب کنید.";
      if (!keepDoc && v.passport_number.trim().length < 5)
        e.passport_number = "شمارهٔ گذرنامه را مطابق گذرنامه وارد کنید.";
    } else {
      if (!keepDoc && !isValidNationalId(v.national_id))
        e.national_id = "کد ملی ۱۰ رقمی معتبر نیست؛ دوباره بررسی کنید.";
      if (!v.province) e.province = "استان محل سکونت را انتخاب کنید.";
    }
    const city = v.city.trim().length;
    if (city < 2 || city > 60) e.city = "نام شهر باید بین ۲ تا ۶۰ نویسه باشد.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    if (clean) {
      if (onSkip) onSkip();
      else if (profile) onDone(profile);
      return;
    }
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
        national_id: foreign || keepDoc ? "" : latinDigits(v.national_id).replace(/\D/g, ""),
        passport_number: foreign && !keepDoc ? v.passport_number.trim().toUpperCase() : "",
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

  const text = (
    k: Field,
    label: string,
    extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {},
    after: ReactNode = null,
    tail: ReactNode = null,
  ) => (
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
      ) : (
        after
      )}
      {tail}
    </div>
  );

  const nid = latinDigits(v.national_id).replace(/\D/g, "");
  const nidState = foreign || nid.length < 10 ? null : isValidNationalId(nid) ? "ok" : "bad";
  const pickNationality = (kind: "ir" | "intl") => {
    if ((kind === "ir") === !foreign) return;
    setV((s) => ({ ...s, nationality: kind === "ir" ? IRAN : "" }));
    setErrors({});
  };

  const defaultLead = editing
    ? "مدرک هویتی شما محفوظ است و دوباره خواسته نمی‌شود؛ فقط مواردی را که تغییر کرده ویرایش کنید."
    : "برای رزرو، مشخصات سرپرست زائران یک بار ثبت می‌شود. کد ملی و گذرنامه رمزنگاری‌شده نگه‌داری می‌شوند و جایی نمایش داده نمی‌شوند.";
  const leadNode = lead === undefined ? defaultLead : lead;

  const docField: Field = foreign ? "passport_number" : "national_id";
  const docName = foreign ? "شمارهٔ گذرنامه" : "کد ملی";
  /** کارت «گاوصندوق مدرک»: نمای پوشانده + نشان رمزنگاری + تغییر آگاهانه. */
  const vault = (
    <div className="acc-field id-vault" data-field={docField}>
      <span className="field-label" id={`${formId}-vault`}>
        {foreign ? "شمارهٔ گذرنامه (Passport No.)" : "کد ملی ۱۰ رقمی"}
      </span>
      <div className="id-vault__card" role="group" aria-labelledby={`${formId}-vault`}>
        <span className="id-vault__icon" aria-hidden="true">
          <Icon name="lock" size={18} />
        </span>
        <span className="id-vault__body">
          <bdi className="id-vault__value latin" dir="ltr">
            {(foreign ? "•••• " : "•••••• ") + (masked ?? "").replace(/^\*+/, "")}
          </bdi>
          <span className="id-vault__badge">
            <Icon name="shield-check" size={12} /> ثبت‌شده و رمزنگاری‌شده
          </span>
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm id-vault__change"
          onClick={() => {
            setChangeDoc(true);
            requestAnimationFrame(() => document.getElementById(`${formId}-${docField}`)?.focus());
          }}
        >
          <Icon name="pencil" size={14} /> تغییر {docName}
        </button>
      </div>
      <p className="field-help">برای حریم خصوصی فقط ۴ نویسهٔ آخر نمایش داده می‌شود؛ نیازی به وارد کردن دوباره نیست.</p>
    </div>
  );
  const cancelChange =
    docOnFile && changeDoc ? (
      <button
        type="button"
        className="text-link id-vault__cancel"
        onClick={() => {
          setChangeDoc(false);
          setV((s) => ({ ...s, [docField]: "" }));
          setErrors((e) => ({ ...e, [docField]: undefined }));
        }}
      >
        <Icon name="x" size={12} /> انصراف از تغییر و حفظ {docName} ثبت‌شده
      </button>
    ) : null;

  const provinceField = (
    <div className="acc-field" data-field="province">
      <Combobox
        label="استان محل سکونت"
        required
        options={provinces}
        value={v.province}
        onChange={set("province")}
        error={errors.province}
        placeholder="نام استان را بنویسید"
        quickPicks={page ? 5 : 0}
      />
    </div>
  );
  const cityField = text("city", foreign ? "شهر محل سکونت در کشور مبدأ" : "شهر محل سکونت", {
    autoComplete: "address-level2",
    maxLength: 60,
  });

  return (
    <form id={formId} className={cx("profile-form", page && "profile-form--page")} onSubmit={submit} noValidate>
      {leadNode ? (
        <p className="account-lead">
          <Icon name="id-card" size={20} />
          <span>{leadNode}</span>
        </p>
      ) : null}

      <div className="acc-field profile-kind" data-field="kind">
        <span className="field-label" id={`${formId}-kind`}>
          نوع تابعیت زائر
        </span>
        {/* طراح: «کپسول تفکیک» دو گزینه‌ای به‌جای فهرست بلند کشورها برای اکثریت ایرانی. */}
        <div className="segment segment--wide profile-kind__seg" role="group" aria-labelledby={`${formId}-kind`}>
          <button type="button" aria-pressed={!foreign} onClick={() => pickNationality("ir")}>
            <Icon name="id-card" size={18} />
            <span>
              زائر ایرانی <small>با کد ملی ۱۰ رقمی</small>
            </span>
          </button>
          <button type="button" aria-pressed={foreign} onClick={() => pickNationality("intl")}>
            <Icon name="globe" size={18} />
            <span>
              زائر بین‌المللی <small>با گذرنامهٔ معتبر</small>
            </span>
          </button>
        </div>
      </div>

      {foreign ? (
        <div className="acc-field" data-field="nationality">
          <Combobox
            label="کشور تابعیت (ملیت)"
            required
            options={countries.filter((c) => c.value !== IRAN)}
            value={v.nationality}
            onChange={set("nationality")}
            error={errors.nationality}
            placeholder="نام کشور را بنویسید (فارسی یا لاتین)"
            quickPicks={page ? 6 : 0}
          />
        </div>
      ) : null}

      <div className="acc-row">
        {text("first_name", foreign ? "نام (مطابق گذرنامه)" : "نام", { autoComplete: "given-name", maxLength: 50 })}
        {text("last_name", foreign ? "نام خانوادگی (مطابق گذرنامه)" : "نام خانوادگی", {
          autoComplete: "family-name",
          maxLength: 50,
        })}
      </div>

      {foreign && keepDoc ? (
        vault
      ) : foreign ? (
        text(
          "passport_number",
          "شمارهٔ گذرنامه (Passport No.)",
          {
            dir: "ltr",
            autoComplete: "off",
            maxLength: 24,
            spellCheck: false,
            autoCapitalize: "characters",
          },
          <p className="field-help">حروف لاتین و ارقام مطابق صفحهٔ اول گذرنامهٔ معتبر</p>,
          cancelChange,
        )
      ) : keepDoc ? (
        <>
          {vault}
          <div className="acc-row">
            {provinceField}
            {cityField}
          </div>
        </>
      ) : (
        <div className="acc-row">
          {text(
            "national_id",
            "کد ملی ۱۰ رقمی",
            {
              dir: "ltr",
              inputMode: "numeric",
              autoComplete: "off",
              maxLength: 12,
              className: "text-input latin",
            },
            nidState ? (
              <p className="nid-check" data-state={nidState} id={`${formId}-national_id-check`} aria-live="polite">
                <Icon name={nidState === "ok" ? "check" : "info"} size={14} />
                {nidState === "ok" ? "رقم کنترل کد ملی درست است." : "رقم کنترل نمی‌خواند؛ ارقام را دوباره بررسی کنید."}
              </p>
            ) : (
              <p className="field-help">صحت کد ملی بر پایهٔ الگوریتم رسمی رقم کنترلی ثبت احوال سنجیده می‌شود.</p>
            ),
            cancelChange,
          )}
          {provinceField}
        </div>
      )}
      {foreign || !keepDoc ? cityField : null}
      {formError ? (
        <p className="account-alert" data-tone="danger" role="alert">
          <Icon name="info" size={18} /> {formError}
        </p>
      ) : null}

      <div className={cx("account-actions", page && "account-actions--page")}>
        <button
          type="submit"
          className={cx("btn btn-primary", page ? "btn-lg" : "btn-block")}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? "در حال ذخیره…" : clean ? "بدون تغییر — بستن" : submitLabel}
          <Icon name={clean ? "x" : "arrow-left"} size={18} />
        </button>
        {onSkip && !clean ? (
          <button
            type="button"
            className={cx("btn", page ? "btn-secondary btn-lg" : "btn-ghost btn-block")}
            onClick={onSkip}
          >
            {skipLabel}
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
