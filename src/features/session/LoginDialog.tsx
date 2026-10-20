"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState, type FormEvent } from "react";
import { ApiError, resetCsrf } from "@/shared/api/client";
import { configQuery, qk, requestOtp, verifyOtp } from "@/shared/api/queries";
import { faDigits } from "@/shared/lib/fa";
import { mmss, useCountdown } from "@/shared/lib/use-countdown";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { announceSoon } from "@/shared/ui/PageLink";
import { toast } from "@/shared/ui/toast";
import { closeLogin, useLoginState } from "./auth-store";
import { OtpInput } from "./OtpInput";
import { formatMobile, normalizeIranMobile } from "./phone";

type Step =
  { kind: "phone" } | { kind: "code"; phone: string; expiresAt: number; resendAt: number; smsBlocked: boolean };

/** پاسخ ۴۲۹ ⇒ لحظهٔ مجاز بعدی؛ سرور زمان را در `retry_after` می‌دهد. */
function retryAt(e: unknown): number | null {
  if (!(e instanceof ApiError) || e.status !== 429) return null;
  const s = (e.body as { retry_after?: number } | null)?.retry_after;
  return Date.now() + (typeof s === "number" && s > 0 ? s : 60) * 1000;
}

/**
 * ورود/ثبت‌نام درون‌برنامه‌ای با کد پیامکی (طرح گام ۱ از P-05) — بدون رفتن به صفحهٔ دیگر.
 * کاربر تازه با همان تأیید کد ساخته می‌شود (بک‌اند)؛ طول کد، اعتبار و فاصلهٔ ارسال دوباره
 * از ‎/config‎ می‌آید. پس از ورود، توکن CSRF و همهٔ کوئری‌های وابسته به نشست تازه می‌شوند.
 */
export function LoginDialog() {
  const { open, intent } = useLoginState();
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={(o) => (o ? null : closeLogin())}
      title="ورود یا ثبت‌نام"
      subtitle="فقط با شمارهٔ همراه — بدون گذرواژه"
      size="sm"
      closeLabel="بستن پنجرهٔ ورود"
    >
      {/* با هر بار باز شدن از گام نخست؛ وضعیت پنجرهٔ بسته نگه داشته نمی‌شود. */}
      {open ? <LoginFlow intent={intent} /> : null}
    </AppDialog>
  );
}

function LoginFlow({ intent }: { intent: "account" | "booking" | "portal" }) {
  const qc = useQueryClient();
  const config = useQuery(configQuery);
  const otpLength = config.data?.auth.otp_length ?? 5;
  const [step, setStep] = useState<Step>({ kind: "phone" });
  const [phoneRaw, setPhoneRaw] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const ids = { phone: useId(), hint: useId(), err: useId(), form: useId(), status: useId() };

  const blockedFor = useCountdown(blockedUntil);
  const resendIn = useCountdown(step.kind === "code" ? step.resendAt : null);
  const expiresIn = useCountdown(step.kind === "code" ? step.expiresAt : null);

  const send = async (phone: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(phone);
      const now = Date.now();
      setStep({
        kind: "code",
        phone,
        expiresAt: now + r.expires_in * 1000,
        resendAt: now + r.resend_after * 1000,
        smsBlocked: r.delivery_status === "blocked",
      });
      setCode("");
    } catch (e) {
      const until = retryAt(e);
      if (until) setBlockedUntil(until);
      setError(e instanceof ApiError ? e.message : "ارتباط با سامانه ممکن نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    if (step.kind !== "code" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await verifyOtp(step.phone, value);
      resetCsrf();
      await qc.invalidateQueries({ queryKey: qk.session });
      void qc.invalidateQueries({ queryKey: ["me"] });
      closeLogin();
      const name = r.profile.first_name || "";
      toast(
        r.is_new_user ? "حساب شما ساخته شد؛ به مهدیه خوش آمدید." : `خوش آمدید${name ? `، ${name}` : ""}.`,
        "success",
      );
      if (intent === "booking") announceSoon("booking", "انتخاب شما همین‌جا نگه داشته شد.");
      else if (r.next_step === "complete_profile") toast("برای ثبت رزرو، تکمیل مشخصات زائر لازم است.", "info");
    } catch (e) {
      const until = retryAt(e);
      if (until) setBlockedUntil(until);
      const remaining =
        e instanceof ApiError ? (e.body as { remaining_attempts?: number } | null)?.remaining_attempts : undefined;
      setError(
        (e instanceof ApiError ? e.message : "ارتباط با سامانه ممکن نشد.") +
          (typeof remaining === "number" ? ` ${faDigits(remaining)} تلاش دیگر باقی است.` : ""),
      );
      setCode("");
      setShake((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  // با هر گام، فوکوس روی فیلد اصلی همان گام (شماره یا نخستین خانهٔ کد).
  useEffect(() => {
    document.querySelector<HTMLElement>(".login-flow [data-autofocus]")?.focus();
  }, [step.kind]);

  // Web OTP (کروم اندروید): کد پیامک بدون تایپ پر می‌شود؛ با ترک این گام لغو می‌شود.
  const phoneForOtp = step.kind === "code" ? step.phone : null;
  useEffect(() => {
    if (!phoneForOtp || !("OTPCredential" in window)) return;
    const ac = new AbortController();
    const get = navigator.credentials.get as (o: object) => Promise<{ code?: string } | null>;
    get
      .call(navigator.credentials, { otp: { transport: ["sms"] }, signal: ac.signal })
      .then((c) => {
        if (c?.code) setCode(c.code.replace(/\D/g, "").slice(0, otpLength));
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [phoneForOtp, otpLength]);

  const onPhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    const phone = normalizeIranMobile(phoneRaw);
    if (!phone) {
      setError("شمارهٔ همراه معتبر نیست. نمونهٔ درست: ۰۹۱۲۳۴۵۶۷۸۹");
      setShake((n) => n + 1);
      return;
    }
    void send(phone);
  };

  const onCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length === otpLength) void verify(code);
    else {
      setError(`کد ${faDigits(otpLength)} رقمی را کامل وارد کنید.`);
      setShake((n) => n + 1);
    }
  };

  const throttled = blockedFor > 0;

  if (step.kind === "phone") {
    return (
      <form id={ids.form} className="login-flow" noValidate onSubmit={onPhoneSubmit} data-step="phone">
        <ol className="login-steps" aria-label="مراحل ورود">
          <li aria-current="step">شمارهٔ همراه</li>
          <li>کد پیامکی</li>
        </ol>
        <p className="login-lead">
          کد ورود {faDigits(otpLength)} رقمی برایتان پیامک می‌شود. اگر بار اول است، حساب شما با همین کد ساخته می‌شود.
        </p>
        <label className="form-label" htmlFor={ids.phone}>
          شمارهٔ تلفن همراه
        </label>
        <div className="phone-field" data-invalid={error ? "" : undefined} key={`p${shake}`}>
          <span className="phone-field__prefix latin" aria-hidden="true">
            +98
          </span>
          <input
            id={ids.phone}
            className="phone-field__input latin"
            type="tel"
            dir="ltr"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="0912 345 6789"
            maxLength={20}
            required
            data-autofocus=""
            value={phoneRaw}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${ids.err} ${ids.hint}` : ids.hint}
            onChange={(e) => {
              setPhoneRaw(e.currentTarget.value);
              if (error) setError(null);
            }}
          />
        </div>
        <p id={ids.hint} className="form-hint">
          قالب‌های ۰۹…، ‎+98…‎ و ارقام فارسی پذیرفته می‌شود. شماره نزد مهدیه محرمانه می‌ماند.
        </p>
        {error ? (
          <p id={ids.err} className="form-error" role="alert">
            <Icon name="alert-triangle" size={16} /> {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || throttled} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {throttled ? `تلاش دوباره تا ${faDigits(mmss(blockedFor))}` : "دریافت کد یک‌بارمصرف"}
          {!busy && !throttled ? <Icon name="arrow-left" size={18} /> : null}
        </button>
        <p className="login-privacy">
          <Icon name="lock" size={14} /> دیدن واحدها و زمان‌های آزاد نیازی به ورود ندارد؛ ورود فقط برای ثبت و پیگیری
          رزرو است.
        </p>
      </form>
    );
  }

  const expired = expiresIn === 0;
  return (
    <form id={ids.form} className="login-flow" noValidate onSubmit={onCodeSubmit} data-step="code">
      <ol className="login-steps" aria-label="مراحل ورود">
        <li data-done="">شمارهٔ همراه</li>
        <li aria-current="step">کد پیامکی</li>
      </ol>
      <p className="login-lead login-lead--center" id={ids.status}>
        کد {faDigits(otpLength)} رقمی به شمارهٔ{" "}
        <bdi className="latin" dir="ltr">
          {formatMobile(step.phone)}
        </bdi>{" "}
        پیامک شد.
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setStep({ kind: "phone" });
            setError(null);
          }}
        >
          <Icon name="edit" size={14} /> تغییر شماره
        </button>
      </p>
      {step.smsBlocked ? (
        <p className="login-notice" role="status">
          <Icon name="info" size={18} />
          <span>
            ارسال پیامک در این نسخهٔ سامانه هنوز فعال نشده است؛ کد به گوشی نمی‌رسد. با روشن شدن پنل پیامک، ورود از همین
            پنجره انجام می‌شود.
          </span>
        </p>
      ) : null}
      <OtpInput
        key={`o${shake}`}
        length={otpLength}
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(null);
        }}
        onComplete={(v) => void verify(v)}
        invalid={Boolean(error)}
        disabled={busy || throttled || expired}
        describedBy={error ? `${ids.err} ${ids.status}` : ids.status}
      />
      {error ? (
        <p id={ids.err} className="form-error form-error--center" role="alert">
          <Icon name="alert-triangle" size={16} /> {error}
        </p>
      ) : null}
      <div className="otp-meta">
        <span className={expired ? "otp-meta__expired" : undefined} aria-live="polite">
          {expired ? "اعتبار کد تمام شد؛ کد تازه بگیرید." : <>اعتبار کد: {faDigits(mmss(expiresIn))}</>}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={busy || resendIn > 0 || throttled}
          onClick={() => void send(step.phone)}
        >
          {resendIn > 0 ? `ارسال دوباره تا ${faDigits(mmss(resendIn))}` : "ارسال دوبارهٔ پیامک"}
        </button>
      </div>
      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={busy || throttled || expired || code.length !== otpLength}
        aria-busy={busy}
      >
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        تأیید و ورود
        {!busy ? <Icon name="check" size={18} /> : null}
      </button>
    </form>
  );
}
