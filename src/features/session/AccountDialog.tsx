"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { logout, remainingAttempts, requestOtp, retryAfter, verifyOtp, type OtpRequested } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { configQuery, qk, sessionQuery } from "@/shared/api/queries";
import type { Profile, SessionState } from "@/shared/api/schemas";
import { faCount, faDigits } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { AccountPanel } from "./AccountPanel";
import { closeAccount, useAccountDialog } from "./account-store";
import { checkPhone, mmss, prettyPhone } from "./identity";
import { OtpField } from "./OtpField";
import { ProfileForm } from "./ProfileForm";

type CodeState = {
  e164: string;
  expiresAt: number;
  resendAt: number;
  delivery: string;
};
type Step = "phone" | "code" | "profile" | "account";

/** مهلت‌ها هم‌تراز با ساعت ثانیه‌ای useClock ⇒ شمارش دقیقاً از ۰۲:۰۰ آغاز می‌شود (نه ۰۲:۰۱). */
const secondNow = () => Math.floor(Date.now() / 1000) * 1000;

const GUEST: SessionState = { authenticated: false, profile: null, mfa_pending: false };

/**
 * پنجرهٔ یگانهٔ «حساب» (ورود با کد یک‌بارمصرف، تکمیل پروفایل، حساب من، خروج).
 * یک بار در سربرگ سوار می‌شود و از هر جای برنامه با openAccount() باز می‌شود.
 * پیامک خاموش/مسدود/ناموفق صادقانه گفته می‌شود (delivery_status بک‌اند)، نه «کد ارسال شد» دروغین.
 */
export function AccountDialog() {
  const { open, intent } = useAccountDialog();
  const qc = useQueryClient();
  const session = useQuery(sessionQuery);
  const config = useQuery(configQuery);
  const profile = session.data?.profile ?? null;
  const otpLength = config.data?.auth.otp_length ?? 5;
  const allowIntl = config.data?.features.international_phones ?? false;

  const [step, setStep] = useState<Step | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [code, setCode] = useState<CodeState | null>(null);
  const [digits, setDigits] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const phoneId = useId();

  const current: Step = step ?? (profile ? "account" : "phone");
  const now = useClock(open && (current === "code" || lockedUntil > 0));
  const resendLeft = code ? Math.max(0, (code.resendAt - now) / 1000) : 0;
  const expiresLeft = code ? Math.max(0, (code.expiresAt - now) / 1000) : 0;
  const lockLeft = Math.max(0, (lockedUntil - now) / 1000);

  const reset = () => {
    setStep(null);
    setDigits("");
    setCodeError(null);
    setPhoneError(null);
    setBusy(false);
  };
  const onOpenChange = (next: boolean) => {
    if (!next) {
      closeAccount();
      reset();
    }
  };

  const afterSignedIn = (p: Profile, isNew: boolean) => {
    const name = p.first_name || "زائر گرامی";
    toast(isNew ? `${name}، به مهدیه خوش آمدید.` : `${name}، خوش برگشتید.`, "success");
    if (intent.then) {
      window.location.assign(intent.then);
      return;
    }
    onOpenChange(false);
  };

  const ask = async (e164: string) => {
    setBusy(true);
    setPhoneError(null);
    setCodeError(null);
    try {
      const r: OtpRequested = await requestOtp(e164);
      const t = secondNow();
      setCode({
        e164,
        expiresAt: t + r.expires_in * 1000,
        resendAt: t + r.resend_after * 1000,
        delivery: r.delivery_status,
      });
      setDigits("");
      setStep("code");
    } catch (e) {
      const wait = retryAfter(e);
      const msg = e instanceof ApiError ? e.message : "ارتباط با سامانه برقرار نشد؛ اتصال اینترنت را بررسی کنید.";
      if (current === "code") {
        setCodeError(msg);
        if (wait && code) setCode({ ...code, resendAt: secondNow() + wait * 1000 });
      } else {
        setPhoneError(msg);
        if (wait) setLockedUntil(secondNow() + wait * 1000);
      }
    } finally {
      setBusy(false);
    }
  };

  const submitPhone = (ev: FormEvent) => {
    ev.preventDefault();
    const c = checkPhone(phone, allowIntl);
    if (!c.ok) {
      setPhoneError(
        c.reason === "empty"
          ? "شمارهٔ تلفن همراه را وارد کنید."
          : c.reason === "foreign"
            ? "فعلاً فقط شماره‌های همراه ایران پذیرفته می‌شود (زائر خارجی با سیم‌کارت ایرانی)."
            : "شمارهٔ همراه معتبر نیست. مثال درست: ۰۹۱۲۳۴۵۶۷۸۹",
      );
      return;
    }
    if (code && code.e164 === c.e164 && Date.now() < code.resendAt && Date.now() < code.expiresAt) {
      // همان شماره و کد قبلی هنوز معتبر ⇒ پیامک تازه نمی‌خواهیم.
      setStep("code");
      return;
    }
    void ask(c.e164);
  };

  const verify = async (value: string) => {
    if (!code || busy) return;
    setBusy(true);
    setCodeError(null);
    try {
      const res = await verifyOtp(code.e164, value);
      qc.setQueryData<SessionState>(qk.session, { authenticated: true, profile: res.profile, mfa_pending: false });
      void qc.invalidateQueries({ queryKey: qk.session });
      void qc.invalidateQueries({ queryKey: ["me"] });
      setCode(null);
      if (res.next_step === "complete_profile") {
        toast(res.is_new_user ? "حساب شما ساخته شد." : "وارد شدید.", "success");
        setStep("profile");
      } else afterSignedIn(res.profile, res.is_new_user);
    } catch (e) {
      setDigits("");
      const left = remainingAttempts(e);
      const wait = retryAfter(e);
      if (e instanceof ApiError && e.code === "otp_mismatch" && left !== null) {
        setCodeError(`کد درست نیست؛ ${faCount(left)} بار دیگر می‌توانید امتحان کنید.`);
      } else if (wait !== null) {
        setCodeError(e instanceof ApiError ? e.message : "تلاش‌ها زیاد بود؛ کد تازه بگیرید.");
        setCode({ ...code, expiresAt: 0, resendAt: secondNow() + wait * 1000 });
      } else if (e instanceof ApiError && e.code === "otp_expired") {
        setCodeError(e.message);
        setCode({ ...code, expiresAt: 0, resendAt: Math.min(code.resendAt, secondNow()) });
      } else {
        setCodeError(e instanceof ApiError ? e.message : "ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.");
      }
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async (everywhere: boolean) => {
    setBusy(true);
    try {
      await logout(everywhere);
      qc.setQueryData<SessionState>(qk.session, GUEST);
      qc.removeQueries({ queryKey: ["me"] });
      toast(everywhere ? "از همهٔ دستگاه‌ها خارج شدید." : "از حساب خارج شدید.", "success");
      onOpenChange(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "خروج ممکن نشد؛ دوباره تلاش کنید.", "warn");
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Step, { title: string; sub: string }> = {
    phone: { title: "ورود یا ثبت‌نام", sub: "فقط با شمارهٔ همراه؛ بی‌نیاز از گذرواژه و ایمیل." },
    code: { title: "کد تأیید", sub: `کد ${faCount(otpLength)} رقمی پیامک‌شده را وارد کنید.` },
    profile: { title: "مشخصات سرپرست زائران", sub: "یک بار برای همیشه — پیش از نخستین رزرو." },
    account: { title: "حساب من", sub: "رزروها، سهمیه و تنظیمات ورود" },
  };

  const sms = code ? deliveryNotice(code.delivery) : null;
  const errId = `${phoneId}-err`;

  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={titles[current].title}
      subtitle={titles[current].sub}
      closeLabel="بستن پنجرهٔ حساب"
    >
      <div className="account-flow" data-step={current}>
        {current === "phone" ? (
          <form className="account-form" onSubmit={submitPhone} noValidate>
            {intent.reason ? (
              <p className="account-alert" data-tone="info">
                <Icon name="lock" size={18} /> {intent.reason}
              </p>
            ) : null}
            <div className="acc-field">
              <label className="field-label" htmlFor={phoneId}>
                شمارهٔ تلفن همراه
              </label>
              <div className="phone-input" data-invalid={phoneError ? true : undefined}>
                <span className="phone-input__prefix latin" dir="ltr" aria-hidden="true">
                  +98
                </span>
                <input
                  id={phoneId}
                  className="phone-input__control latin"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel-national"
                  enterKeyHint="send"
                  placeholder="0912 345 6789"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  aria-invalid={phoneError ? true : undefined}
                  aria-describedby={`${phoneId}-help${phoneError ? ` ${errId}` : ""}`}
                  autoFocus
                  required
                />
              </div>
              <p className="field-help" id={`${phoneId}-help`}>
                با ارقام فارسی یا انگلیسی؛ قالب‌های ۰۹…، ۹… و ‎+۹۸… پذیرفته می‌شود.
              </p>
              {phoneError ? (
                <p className="field-error" id={errId} role="alert">
                  {phoneError}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={busy || lockLeft > 0}
              aria-busy={busy || undefined}
            >
              {busy ? "در حال ارسال…" : lockLeft > 0 ? `تلاش دوباره تا ${faDigits(mmss(lockLeft))}` : "دریافت کد ورود"}
              <Icon name="arrow-left" size={18} />
            </button>
            <p className="account-note">
              <Icon name="shield-check" size={16} />
              شمارهٔ شما فقط برای ورود و پیامک رزرو به کار می‌رود و نزد مهدیه محرمانه می‌ماند.
            </p>
          </form>
        ) : null}

        {current === "code" && code ? (
          <form
            className="account-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (digits.length === otpLength) void verify(digits);
              else setCodeError(`کد ${faCount(otpLength)} رقمی را کامل وارد کنید.`);
            }}
            noValidate
          >
            <p className="account-lead">
              <Icon name="message" size={20} />
              <span>
                {sms?.tone === "ok" ? "کد به شمارهٔ " : "درخواست کد برای شمارهٔ "}
                <bdi className="latin" dir="ltr">
                  {prettyPhone(code.e164)}
                </bdi>
                {sms?.tone === "ok" ? " پیامک شد." : " ثبت شد."}{" "}
                <button type="button" className="text-button" onClick={() => setStep("phone")}>
                  تغییر شماره
                </button>
              </span>
            </p>
            {sms && sms.tone !== "ok" ? (
              <p className="account-alert" data-tone={sms.tone} role="status">
                <Icon name={sms.tone === "danger" ? "wifi-off" : "info"} size={18} />
                <span>{sms.text}</span>
              </p>
            ) : null}

            <OtpField
              length={otpLength}
              value={digits}
              onChange={(v) => {
                setDigits(v);
                if (codeError) setCodeError(null);
              }}
              onComplete={(v) => void verify(v)}
              invalid={Boolean(codeError)}
              disabled={busy}
              label={`کد ${faCount(otpLength)} رقمی`}
              describedBy={codeError ? `${phoneId}-code-err` : `${phoneId}-code-timer`}
            />
            {codeError ? (
              <p className="field-error otp-error" id={`${phoneId}-code-err`} role="alert">
                {codeError}
              </p>
            ) : null}

            <div className="otp-timer" id={`${phoneId}-code-timer`}>
              <span>
                {expiresLeft > 0 ? (
                  <>
                    اعتبار کد <bdi className="latin otp-timer__clock">{faDigits(mmss(expiresLeft))}</bdi>
                  </>
                ) : (
                  "کد منقضی شده است؛ کد تازه بگیرید."
                )}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={busy || resendLeft > 0}
                onClick={() => void ask(code.e164)}
              >
                {resendLeft > 0 ? `ارسال دوباره تا ${faDigits(mmss(resendLeft))}` : "ارسال دوبارهٔ کد"}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={busy || expiresLeft <= 0}
              aria-busy={busy || undefined}
            >
              {busy ? "در حال بررسی…" : "تأیید و ورود"}
              <Icon name="arrow-left" size={18} />
            </button>
          </form>
        ) : null}

        {current === "profile" ? (
          <ProfileForm
            profile={profile}
            onDone={(p) => {
              qc.setQueryData<SessionState>(qk.session, (s) => ({ ...(s ?? GUEST), authenticated: true, profile: p }));
              void qc.invalidateQueries({ queryKey: ["me"] });
              afterSignedIn(p, false);
            }}
            onSkip={intent.then ? undefined : () => onOpenChange(false)}
          />
        ) : null}

        {current === "account" && profile ? (
          <AccountPanel
            profile={profile}
            busy={busy}
            onCompleteProfile={() => setStep("profile")}
            onLogout={(all) => void doLogout(all)}
          />
        ) : null}
      </div>
    </AppDialog>
  );
}

/** سرنوشت پیامک (SmsStatus بک‌اند) ⇒ پیام صادقانه برای زائر. */
function deliveryNotice(status: string): { tone: "ok" | "warn" | "danger"; text: string } {
  switch (status) {
    case "sent":
    case "queued":
      return { tone: "ok", text: "" };
    case "suppressed":
      return {
        tone: "warn",
        text: "ارسال پیامک در این مرحلهٔ راه‌اندازی سامانه خاموش است و کد برای شما فرستاده نشد. ورود عمومی با فعال‌شدن پنل پیامک باز می‌شود؛ تا آن زمان برای رزرو با پذیرش تماس بگیرید.",
      };
    case "blocked":
      return {
        tone: "warn",
        text: "سقف پیامک این شماره فعلاً پر است. پس از پایان شمارش، «ارسال دوبارهٔ کد» را بزنید.",
      };
    default:
      return {
        tone: "danger",
        text: "پیامک کد به دست سامانهٔ پیامک نرسید. پس از پایان شمارش دوباره تلاش کنید؛ اگر تکرار شد با پذیرش تماس بگیرید.",
      };
  }
}
