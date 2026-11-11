"use client";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useState, type ReactNode } from "react";
import { ApiError } from "@/shared/api/client";
import { dk, isMfaGate, isStepUp, type Desk, type DeskUnit } from "@/shared/api/desk";
import { toast } from "@/shared/ui/toast";
import { StepUpDialog } from "./StepUpDialog";

/**
 * زمان‌اجرای کنش‌های پیشخوان — یک مسیر برای همهٔ دکمه‌ها:
 *   · اجرای درخواست، ابطال تصویر زندهٔ میز و اعلان موفقیت؛
 *   · ‎403 step_up_required‎ ⇒ پنجرهٔ «تأیید تازه» و تکرار خودکار همان کنش پس از تأیید؛
 *   · ‎403 mfa_required‎ ⇒ تازه‌سازی وضعیت عامل دوم تا دروازهٔ تمام‌صفحه جای میز را بگیرد؛
 *   · بقیهٔ خطاها ⇒ پیام فارسی خود سرور + کد پیگیری (برای خطای ۵xx، طبق شیوه‌نامهٔ گام ۵).
 */
export type RunOptions = {
  success?: string;
  /** کارت تازهٔ واحد را بی انتظار برای نظرسنجی بعدی در کش میز بنشان */
  patchUnit?: (result: unknown) => DeskUnit | null;
  /** خطا را به فرم بسپار (پیام فیلدها) به‌جای اعلان سراسری */
  quiet?: boolean;
};

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: unknown };

type Runtime = {
  run: <T>(task: () => Promise<T>, opts?: RunOptions) => Promise<Outcome<T>>;
  requestStepUp: (reason: string) => Promise<boolean>;
};

const Ctx = createContext<Runtime | null>(null);

export function useDeskRuntime(): Runtime {
  const ctx = use(Ctx);
  if (!ctx) throw new Error("DeskRuntime provider missing");
  return ctx;
}

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    const trace = (e.body as { trace_id?: unknown } | null)?.trace_id;
    if (e.status >= 500 && typeof trace === "string" && trace)
      return `${e.message} · کد پیگیری خطا: ${trace.slice(0, 12)}`;
    if (e.status === 0 || e.code === "network")
      return "ارتباط با سامانه برقرار نشد؛ اتصال شبکهٔ پیشخوان را بررسی کنید.";
    return e.message;
  }
  if (e instanceof TypeError) return "ارتباط با سامانه برقرار نشد؛ اتصال شبکهٔ پیشخوان را بررسی کنید.";
  return "کار انجام نشد؛ دوباره تلاش کنید.";
}

type Pending = { reason: string; resolve: (ok: boolean) => void };

export function DeskRuntimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<Pending | null>(null);

  const requestStepUp = (reason: string) =>
    new Promise<boolean>((resolve) => {
      setPending({ reason, resolve });
    });

  const settle = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  const run = async <T,>(task: () => Promise<T>, opts: RunOptions = {}): Promise<Outcome<T>> => {
    const attempt = async (retried: boolean): Promise<Outcome<T>> => {
      try {
        const value = await task();
        if (opts.patchUnit) {
          const unit = opts.patchUnit(value);
          if (unit)
            qc.setQueryData<Desk>(dk.desk, (d) =>
              d ? { ...d, units: d.units.map((u) => (u.code === unit.code ? unit : u)) } : d,
            );
        }
        void qc.invalidateQueries({ queryKey: ["staff"] });
        if (opts.success) toast(opts.success, "success");
        return { ok: true, value };
      } catch (error) {
        if (isStepUp(error) && !retried) {
          const verified = await requestStepUp("این کار به تأیید تازهٔ عامل دوم نیاز دارد.");
          if (verified) return attempt(true);
          return { ok: false, error };
        }
        if (isMfaGate(error)) {
          void qc.invalidateQueries({ queryKey: dk.mfa });
          void qc.invalidateQueries({ queryKey: ["session"] });
          return { ok: false, error };
        }
        if (error instanceof ApiError && error.status === 409) void qc.invalidateQueries({ queryKey: dk.desk });
        if (!opts.quiet) toast(errorText(error), "warn");
        return { ok: false, error };
      }
    };
    return attempt(false);
  };

  return (
    <Ctx value={{ run, requestStepUp }}>
      {children}
      <StepUpDialog
        isOpen={pending !== null}
        reason={pending?.reason ?? ""}
        onDone={(ok) => {
          if (ok) void qc.invalidateQueries({ queryKey: ["staff"] });
          settle(ok);
        }}
      />
    </Ctx>
  );
}
