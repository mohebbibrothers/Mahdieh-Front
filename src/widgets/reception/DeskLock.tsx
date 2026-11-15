"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { OtpField } from "@/features/session/OtpField";
import { dk, verifyMfa } from "@/shared/api/desk";
import { faDigits, latinDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { mfaErrorText, StepUpDialog } from "./StepUpDialog";

/**
 * «قفل فوری پیشخوان» (طراح P-06، دکمهٔ قفل سرصفحه): خادم هنگام ترک میز با یک لمس — یا خودکار پس از
 * ۱۰ دقیقه بی‌کاری — اطلاعات زائران را از صفحه برمی‌دارد. قفل فقط پرده نیست: میز اصلاً رندر
 * نمی‌شود (هیچ نام و شماره‌ای در DOM نمی‌ماند) و نوسازی خودکار می‌ایستد. باز کردن، تأیید تازهٔ
 * سمت سرور می‌خواهد (کد ۶ رقمی Authenticator یا کد بازیابی) و با بارگذاری دوباره دور زده نمی‌شود.
 */
const LOCK_KEY = "mahdieh.desk.locked";
/** هم‌اندازهٔ پنجرهٔ «تأیید تازه» سرور (۶۰۰ ثانیه) */
export const IDLE_LOCK_MS = 10 * 60_000;
const ACTIVITY = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

function readLock(): boolean {
  try {
    return window.sessionStorage.getItem(LOCK_KEY) === "1";
  } catch {
    return false;
  }
}
function writeLock(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(LOCK_KEY, "1");
    else window.sessionStorage.removeItem(LOCK_KEY);
  } catch {
    /* نشست خصوصی/بی‌حافظه: قفل در همین صفحه همچنان کار می‌کند */
  }
}

/** وضعیت قفل + قفل خودکار پس از بی‌کاری. فقط در میزِ رندرشده در مرورگر صدا زده می‌شود. */
export function useDeskLock(idleMs: number = IDLE_LOCK_MS) {
  const [locked, setLocked] = useState(readLock);

  const lock = (reason: "manual" | "idle") => {
    writeLock(true);
    setLocked(true);
    toast(
      reason === "idle"
        ? "پیشخوان پس از ۱۰ دقیقه بی‌کاری خودکار قفل شد؛ اطلاعات زائران محافظت شد."
        : "پیشخوان قفل شد؛ اطلاعات زائران محافظت شد.",
      "info",
    );
  };
  const unlock = () => {
    writeLock(false);
    setLocked(false);
  };

  const onIdle = useEffectEvent(() => lock("idle"));
  useEffect(() => {
    if (locked) return;
    let timer = window.setTimeout(onIdle, idleMs);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onIdle, idleMs);
    };
    for (const t of ACTIVITY) window.addEventListener(t, reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const t of ACTIVITY) window.removeEventListener(t, reset);
    };
  }, [locked, idleMs]);

  return { locked, lock: () => lock("manual"), unlock };
}

/** صفحهٔ قفل: نام خادم کشیک، کد ۶ رقمی (تأیید سمت سرور)، راه کد بازیابی و پایان شیفت. */
export function DeskLockScreen({
  name,
  initials,
  onUnlock,
  onLogout,
}: {
  name: string;
  initials: string;
  onUnlock: () => void;
  onLogout: () => void;
}) {
  const qc = useQueryClient();
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const errId = useId();

  const done = () => {
    onUnlock();
    toast(`خوش آمدید، ${name}؛ پیشخوان باز شد.`, "success");
  };

  const submit = async (code: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verifyMfa(latinDigits(code).trim());
      qc.setQueryData(dk.mfa, res.status);
      done();
    } catch (e) {
      setDigits("");
      setError(mfaErrorText(e));
      setBusy(false);
    }
  };

  return (
    <section className="rc-locked rc-lockscreen" aria-labelledby="rc-lock-title">
      <span className="rc-lockscreen__seal" aria-hidden="true">
        <Icon name="lock" size={26} />
      </span>
      <h1 id="rc-lock-title">پیشخوان قفل است</h1>
      <p>
        اطلاعات زائران تا تأیید دوبارهٔ هویت خادم کشیک پنهان است. برای ادامه، کد ۶ رقمی برنامهٔ Authenticator را وارد
        کنید.
      </p>
      <div className="rc-lockscreen__who">
        <span className="rc-officer__avatar" aria-hidden="true">
          {initials}
        </span>
        <strong>{name}</strong>
      </div>
      <OtpField
        length={6}
        value={digits}
        onChange={setDigits}
        onComplete={(v) => void submit(v)}
        invalid={error !== null}
        disabled={busy}
        describedBy={error ? errId : undefined}
        label="کد ۶ رقمی باز کردن پیشخوان"
      />
      <p id={errId} className="field-error" role="alert" hidden={!error}>
        {error}
      </p>
      <div className="rc-locked__actions">
        <button type="button" className="btn btn-secondary" onClick={() => setRecovery(true)}>
          <Icon name="key" size={18} /> کد بازیابی
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLogout}>
          <Icon name="log-out" size={18} /> پایان شیفت
        </button>
      </div>
      <p className="rc-lockscreen__note">
        قفل خودکار پس از {faDigits(IDLE_LOCK_MS / 60_000)} دقیقه بی‌کاری؛ بارگذاری دوبارهٔ صفحه قفل را باز نمی‌کند.
      </p>
      <StepUpDialog
        isOpen={recovery}
        reason="باز کردن پیشخوان قفل‌شده با یکی از کدهای بازیابی یک‌بارمصرف"
        startWith="recovery"
        onDone={(ok) => {
          setRecovery(false);
          if (ok) done();
        }}
      />
    </section>
  );
}
