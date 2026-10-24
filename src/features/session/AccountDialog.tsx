"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { logout, type SessionResult } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { configQuery, qk, sessionQuery } from "@/shared/api/queries";
import type { Profile, SessionState } from "@/shared/api/schemas";
import { faCount } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { toast } from "@/shared/ui/toast";
import { AccountPanel } from "./AccountPanel";
import { closeAccount, useAccountDialog } from "./account-store";
import { ProfileForm } from "./ProfileForm";
import { SignInForm, type SignInStep } from "./SignInForm";

type Step = SignInStep | "profile" | "account";

const GUEST: SessionState = { authenticated: false, profile: null, mfa_pending: false };

/**
 * پنجرهٔ یگانهٔ «حساب» (ورود با کد یک‌بارمصرف، تکمیل پروفایل، حساب من، خروج).
 * یک بار در سربرگ سوار می‌شود و از هر جای برنامه با openAccount() باز می‌شود. فرم ورود همان
 * ‎SignInForm‎ گام ۱ صفحهٔ صدور رزرو است (یک منطق، دو جا).
 */
export function AccountDialog() {
  const { open, intent } = useAccountDialog();
  const qc = useQueryClient();
  const session = useQuery(sessionQuery);
  const config = useQuery(configQuery);
  const profile = session.data?.profile ?? null;
  const otpLength = config.data?.auth.otp_length ?? 5;

  const [step, setStep] = useState<"profile" | null>(null);
  const [signInStep, setSignInStep] = useState<SignInStep>("phone");
  const [busy, setBusy] = useState(false);
  const onSignInStep = useCallback((s: SignInStep) => setSignInStep(s), []);

  const current: Step = step ?? (profile ? "account" : signInStep);

  const onOpenChange = (next: boolean) => {
    if (!next) {
      closeAccount();
      setStep(null);
      setSignInStep("phone");
      setBusy(false);
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

  const onVerified = (res: SessionResult) => {
    if (res.next_step === "complete_profile") {
      toast(res.is_new_user ? "حساب شما ساخته شد." : "وارد شدید.", "success");
      setStep("profile");
    } else afterSignedIn(res.profile, res.is_new_user);
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

  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={titles[current].title}
      subtitle={titles[current].sub}
      closeLabel="بستن پنجرهٔ حساب"
    >
      {current === "phone" || current === "code" ? (
        <SignInForm onVerified={onVerified} onStepChange={onSignInStep} reason={intent.reason} />
      ) : null}

      {current === "profile" ? (
        <div className="account-flow" data-step="profile">
          <ProfileForm
            profile={profile}
            onDone={(p) => {
              qc.setQueryData<SessionState>(qk.session, (s) => ({ ...(s ?? GUEST), authenticated: true, profile: p }));
              void qc.invalidateQueries({ queryKey: ["me"] });
              afterSignedIn(p, false);
            }}
            onSkip={intent.then ? undefined : () => onOpenChange(false)}
          />
        </div>
      ) : null}

      {current === "account" && profile ? (
        <div className="account-flow" data-step="account">
          <AccountPanel
            profile={profile}
            busy={busy}
            onCompleteProfile={() => setStep("profile")}
            onLogout={(all) => void doLogout(all)}
          />
        </div>
      ) : null}
    </AppDialog>
  );
}
