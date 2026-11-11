"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { OtpField } from "@/features/session/OtpField";
import { ApiError } from "@/shared/api/client";
import { dk, verifyMfa } from "@/shared/api/desk";
import { faDigits, latinDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { recoveryReady } from "./model";

/** کد بازیابی: دو گروه ۵ نویسه‌ای (خط تیره و فاصله اختیاری). */

/** پیام فارسی خطای کد عامل دوم (قفل موقت، کد نادرست، تلاش باقی‌مانده). */
export function mfaErrorText(e: unknown): string {
  if (!(e instanceof ApiError)) return "تأیید انجام نشد؛ دوباره تلاش کنید.";
  const body = e.body as { remaining_attempts?: unknown; retry_after?: unknown } | null;
  const left = typeof body?.remaining_attempts === "number" ? body.remaining_attempts : null;
  const wait = typeof body?.retry_after === "number" ? Math.ceil(body.retry_after / 60) : null;
  if (wait) return `${e.message} (حدود ${faDigits(wait)} دقیقهٔ دیگر)`;
  if (left !== null) return `${e.message} · ${faDigits(left)} تلاش دیگر باقی است.`;
  return e.message;
}

/**
 * «تأیید تازه» برای کارهای پرخطر (نمایش شمارهٔ کامل، خروجی با شماره): کد ۶ رقمی برنامهٔ
 * Authenticator یا یکی از کدهای بازیابی. با موفقیت، کنش معلق خودکار تکرار می‌شود.
 */
export function StepUpDialog({
  isOpen,
  reason,
  onDone,
}: {
  isOpen: boolean;
  reason: string;
  onDone: (verified: boolean) => void;
}) {
  const qc = useQueryClient();
  const [digits, setDigits] = useState("");
  const [recovery, setRecovery] = useState("");
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errId = useId();
  const recId = useId();

  const reset = () => {
    setDigits("");
    setRecovery("");
    setError(null);
    setBusy(false);
    setMode("totp");
  };

  const submit = async (code: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verifyMfa(latinDigits(code).trim());
      qc.setQueryData(dk.mfa, res.status);
      reset();
      onDone(true);
    } catch (e) {
      setDigits("");
      setError(mfaErrorText(e));
      setBusy(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onDone(false);
        }
      }}
      title="تأیید امنیتی دومرحله‌ای خادم"
      subtitle={reason || "برای حفظ حریم زائران، این کار تأیید تازهٔ عامل دوم می‌خواهد."}
      size="sm"
      className="rc-stepup"
      actions={
        mode === "recovery" ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !recoveryReady(recovery)}
            onClick={() => void submit(recovery)}
          >
            <Icon name="shield-check" size={18} /> تأیید کد بازیابی
          </button>
        ) : undefined
      }
    >
      <div className="rc-stepup__body">
        <span className="rc-stepup__seal" aria-hidden="true">
          <Icon name="shield-check" size={28} />
        </span>
        {mode === "totp" ? (
          <>
            <p className="rc-stepup__lead">کد ۶ رقمی برنامهٔ Authenticator گوشی خادم کشیک را وارد کنید.</p>
            <OtpField
              length={6}
              value={digits}
              onChange={setDigits}
              onComplete={(v) => void submit(v)}
              invalid={error !== null}
              disabled={busy}
              describedBy={error ? errId : undefined}
              label="کد ۶ رقمی عامل دوم"
            />
          </>
        ) : (
          <label className="rc-field" htmlFor={recId}>
            <span className="field-label">کد بازیابی یک‌بارمصرف</span>
            <input
              id={recId}
              className="text-input latin"
              dir="ltr"
              autoComplete="one-time-code"
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && recoveryReady(recovery)) void submit(recovery);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errId : undefined}
              placeholder="XXXXX-XXXXX"
            />
          </label>
        )}
        <p id={errId} className="field-error" role="alert" hidden={!error}>
          {error}
        </p>
        <button
          type="button"
          className="text-link rc-stepup__switch"
          onClick={() => {
            setError(null);
            setMode(mode === "totp" ? "recovery" : "totp");
          }}
        >
          {mode === "totp" ? "گوشی در دسترس نیست؟ ورود با کد بازیابی" : "بازگشت به کد ۶ رقمی برنامه"}
        </button>
      </div>
    </AppDialog>
  );
}
