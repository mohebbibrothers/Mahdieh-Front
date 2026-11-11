"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { OtpField } from "@/features/session/OtpField";
import { ApiError } from "@/shared/api/client";
import { confirmTotp, dk, setupTotp, verifyMfa, type MfaEnrollment, type MfaStatus } from "@/shared/api/desk";
import { copyText } from "@/shared/lib/clipboard";
import { faDigits, latinDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { recoveryReady, safeNext } from "./model";
import { mfaErrorText } from "./StepUpDialog";

const svgUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/**
 * دروازهٔ تمام‌صفحهٔ عامل دوم — تا تأیید نشود، هیچ دادهٔ زائری بارگذاری نمی‌شود (API هم ‎403‎ می‌دهد).
 * ثبت‌نشده ⇒ فعال‌سازی TOTP (QR + کلید دستی ⇒ کد ⇒ ده کد بازیابی)؛ ثبت‌شده ⇒ کد ۶ رقمی یا کد بازیابی.
 * پس از تأیید، اگر سرور کاربر را از صفحهٔ دیگری به اینجا فرستاده باشد (‎?next=‎) به همان‌جا برمی‌گردد.
 */
export function MfaGate({
  status,
  name,
  next,
  onHold,
}: {
  status: MfaStatus;
  name: string;
  next: string | null;
  /** نگه‌داشتن دروازه تا ذخیرهٔ کدهای بازیابی (حتی اگر وضعیت سرور همان لحظه «تأییدشده» شود). */
  onHold: (hold: boolean) => void;
}) {
  const qc = useQueryClient();
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [confirmed, setConfirmed] = useState<MfaStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [digits, setDigits] = useState("");
  const [recovery, setRecovery] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errId = useId();
  const savedId = useId();

  const finish = (fresh: MfaStatus) => {
    onHold(false);
    const target = safeNext(next);
    if (target) {
      window.location.assign(target);
      return;
    }
    qc.setQueryData(dk.mfa, fresh);
    void qc.invalidateQueries({ queryKey: ["session"] });
    void qc.invalidateQueries({ queryKey: ["staff"] });
  };

  const guard = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setDigits("");
      setError(e instanceof ApiError ? mfaErrorText(e) : "ارتباط با سامانه برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  const verify = (code: string) =>
    guard(async () => {
      const res = await verifyMfa(latinDigits(code).trim());
      finish(res.status);
    });

  const begin = () =>
    guard(async () => {
      setEnrollment(await setupTotp());
    });

  const confirm = (code: string) =>
    guard(async () => {
      const res = await confirmTotp(latinDigits(code).trim());
      // وضعیت تازه («تأییدشده») عمداً تا کلیک «ورود به پیشخوان» در کش نمی‌رود: وگرنه دروازه همان
      // لحظه باز می‌شد و کدهای بازیابی پیش از ذخیره‌شدن از صفحه محو می‌شدند.
      onHold(true);
      setConfirmed(res.status);
      setCodes(res.recovery_codes);
    });

  const codesText = codes ? codes.join("\n") : "";
  const downloadCodes = () => {
    const blob = new Blob([`کدهای بازیابی میز پذیرش مهدیه — ${name}\n\n${codesText}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mahdieh-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const step = codes ? "codes" : enrollment ? "scan" : status.enrolled ? "verify" : "intro";

  return (
    <section className="rc-gate" aria-labelledby="rc-gate-title" data-step={step}>
      <div className="rc-gate__card">
        <span className="rc-gate__seal" aria-hidden="true">
          <Icon name="shield-check" size={28} />
        </span>
        <p className="rc-eyebrow">پیشخوان خادمان · سد امنیتی دومرحله‌ای</p>
        <h1 id="rc-gate-title" className="rc-gate__title">
          {step === "codes"
            ? "کدهای بازیابی را نگه دارید"
            : step === "verify"
              ? `${name}، خوش آمدید`
              : "فعال‌سازی تأیید دومرحله‌ای"}
        </h1>
        <p className="rc-gate__lead">
          {step === "verify"
            ? "برای ورود به پیشخوان و دیدن پروندهٔ زائران، کد ۶ رقمی برنامهٔ Authenticator گوشی خود را وارد کنید."
            : step === "intro"
              ? "حریم زائران امانت است: پیش از نخستین شیفت، برنامهٔ Authenticator (مثل Google Authenticator یا Microsoft Authenticator) را به حساب خادمی خود وصل کنید."
              : step === "scan"
                ? "کد QR را با برنامهٔ Authenticator بخوانید (یا کلید را دستی وارد کنید) و سپس کد ۶ رقمی نمایش‌داده‌شده را بنویسید."
                : "هر کد فقط یک بار کار می‌کند. اگر گوشی در دسترس نبود، با یکی از این کدها وارد شوید. این فهرست دیگر نمایش داده نمی‌شود."}
        </p>

        {step === "intro" ? (
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={() => void begin()}
            disabled={busy}
          >
            <Icon name="qr" size={20} /> آغاز فعال‌سازی و دریافت کد QR
          </button>
        ) : null}

        {step === "scan" && enrollment ? (
          <div className="rc-gate__scan">
            <img className="rc-gate__qr" src={svgUri(enrollment.qr_svg)} alt="کد QR اتصال برنامهٔ Authenticator" />
            <div className="rc-gate__secret">
              <span className="field-label">کلید دستی</span>
              <bdi className="latin" dir="ltr">
                {enrollment.secret_display}
              </bdi>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  void copyText(enrollment.secret).then((ok) =>
                    toast(ok ? "کلید رونوشت شد." : "رونوشت ممکن نشد.", ok ? "success" : "warn"),
                  )
                }
              >
                <Icon name="copy" size={16} /> رونوشت
              </button>
            </div>
            <OtpField
              length={6}
              value={digits}
              onChange={setDigits}
              onComplete={(v) => void confirm(v)}
              invalid={error !== null}
              disabled={busy}
              describedBy={error ? errId : undefined}
              label="کد ۶ رقمی برنامه"
            />
          </div>
        ) : null}

        {step === "verify" ? (
          <div className="rc-gate__verify">
            {useRecovery ? (
              <label className="rc-field">
                <span className="field-label">کد بازیابی یک‌بارمصرف</span>
                <input
                  className="text-input latin"
                  dir="ltr"
                  value={recovery}
                  onChange={(e) => setRecovery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && recoveryReady(recovery)) void verify(recovery);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errId : undefined}
                  placeholder="XXXXX-XXXXX"
                  autoComplete="one-time-code"
                />
              </label>
            ) : (
              <OtpField
                length={6}
                value={digits}
                onChange={setDigits}
                onComplete={(v) => void verify(v)}
                invalid={error !== null}
                disabled={busy}
                describedBy={error ? errId : undefined}
                label="کد ۶ رقمی عامل دوم"
              />
            )}
            {useRecovery ? (
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={busy || !recoveryReady(recovery)}
                onClick={() => void verify(recovery)}
              >
                <Icon name="shield-check" size={18} /> ورود با کد بازیابی
              </button>
            ) : null}
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setError(null);
                setUseRecovery(!useRecovery);
              }}
            >
              {useRecovery ? "بازگشت به کد ۶ رقمی برنامه" : "گوشی در دسترس نیست؟ ورود با کد بازیابی"}
            </button>
            {status.recovery_codes_remaining > 0 && status.recovery_codes_remaining <= 3 ? (
              <p className="rc-gate__hint">
                <Icon name="alert" size={16} /> فقط {faDigits(status.recovery_codes_remaining)} کد بازیابی برایتان
                مانده؛ پس از ورود، از منوی خادم کدهای تازه بسازید.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "codes" && codes ? (
          <div className="rc-gate__codes">
            <ol className="rc-codes" aria-label="کدهای بازیابی">
              {codes.map((c) => (
                <li key={c}>
                  <bdi className="latin" dir="ltr">
                    {c}
                  </bdi>
                </li>
              ))}
            </ol>
            <div className="rc-gate__row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  void copyText(codesText).then((ok) =>
                    toast(ok ? "کدها رونوشت شد." : "رونوشت ممکن نشد.", ok ? "success" : "warn"),
                  )
                }
              >
                <Icon name="copy" size={16} /> رونوشت همه
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={downloadCodes}>
                <Icon name="download" size={16} /> ذخیرهٔ فایل
              </button>
            </div>
            <label className="rc-check" htmlFor={savedId}>
              <input id={savedId} type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
              <span>کدها را در جای امنی (جدا از گوشی) نگه داشتم.</span>
            </label>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              disabled={!saved}
              onClick={() => {
                if (confirmed) finish(confirmed);
              }}
            >
              <Icon name="arrow-left" size={18} /> ورود به پیشخوان
            </button>
          </div>
        ) : null}

        <p id={errId} className="field-error rc-gate__error" role="alert" hidden={!error}>
          {error}
        </p>
      </div>
    </section>
  );
}
