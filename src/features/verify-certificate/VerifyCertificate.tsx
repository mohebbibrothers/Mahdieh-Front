"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { configQuery, verifyCertificate } from "@/shared/api/queries";
import type { Verification } from "@/shared/api/schemas";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { PageLink } from "@/shared/ui/PageLink";
import { parseCertificateToken } from "./parse-token";

/**
 * استعلام گواهی اقامت — تأیید امضای سمت سرور (نه هش سمت کاربر که جعل‌پذیر بود) و تطبیق
 * با وضعیت لحظه‌ای رزرو. برای بازرسی با مشخصات چاپی، صفحهٔ بازرسی آفلاین جنگو.
 */
const FIELD_LABELS: Array<[string, string]> = [
  ["code", "کد رزرو"],
  ["holder", "نام زائر"],
  ["unit", "واحد"],
  ["floor", "طبقه"],
  ["guests", "نفرات"],
  ["starts", "ورود"],
  ["ends", "خروج"],
];

export function VerifyCertificateButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Icon name="certificate" size={18} />
        استعلام گواهی اقامت
      </button>
      <VerifyCertificateDialog isOpen={open} onOpenChange={setOpen} />
    </>
  );
}

function VerifyCertificateDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (o: boolean) => void }) {
  const id = useId();
  const [raw, setRaw] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const config = useQuery({ ...configQuery, enabled: isOpen });
  const mutation = useMutation({ mutationFn: (token: string) => verifyCertificate(token) });

  const statusLabel = (value: string | null) => {
    const list = (config.data?.labels.reservation_status ?? []) as Array<{ value: string; label: string }>;
    return list.find((x) => x.value === value)?.label ?? value ?? "—";
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          mutation.reset();
          setInputError(null);
        }
      }}
      title="استعلام گواهی اقامت"
      subtitle="نشانی زیر QR گواهی را بچسبانید؛ امضای آن روی سرور مهدیه بررسی می‌شود."
      size="sm"
    >
      <form
        className="verify-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const token = parseCertificateToken(raw);
          if (!token) {
            setInputError("نشانی یا کد واردشده شبیه گواهی مهدیه نیست. نشانی کامل زیر QR را وارد کنید.");
            return;
          }
          setInputError(null);
          mutation.mutate(token);
        }}
      >
        <label htmlFor={`${id}-token`} className="field-label">
          نشانی یا کد تأیید
        </label>
        <textarea
          id={`${id}-token`}
          className="text-input verify-form__input"
          dir="ltr"
          rows={3}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="https://…/verify/…"
          aria-invalid={inputError ? true : undefined}
          aria-describedby={inputError ? `${id}-err` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {inputError ? (
          <p id={`${id}-err`} className="field-error" role="alert">
            {inputError}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? "در حال بررسی…" : "بررسی گواهی"}
          <Icon name="shield-check" size={18} />
        </button>
      </form>

      {mutation.isError ? (
        <div className="verify-result" data-tone="danger" role="alert">
          <Icon name="info" size={22} />
          <div>
            <strong>بررسی انجام نشد</strong>
            <p>{mutation.error.message}</p>
          </div>
        </div>
      ) : null}
      {mutation.data ? <VerifyResult result={mutation.data} statusLabel={statusLabel} /> : null}

      <p className="verify-foot">
        گواهی بدون اینترنت در دست دارید؟{" "}
        <PageLink page="verify" className="text-link">
          بازرسی با مشخصات چاپی و کد کوتاه
        </PageLink>
      </p>
    </AppDialog>
  );
}

function VerifyResult({ result, statusLabel }: { result: Verification; statusLabel: (v: string | null) => string }) {
  const tone = result.valid ? "success" : result.crypto_valid ? "warn" : "danger";
  const title = result.valid
    ? "گواهی معتبر است"
    : result.crypto_valid && result.mismatch
      ? "گواهی اصل است، اما با رزرو فعلی نمی‌خواند"
      : result.crypto_valid
        ? "گواهی اصل است، اما رزرو دیگر فعال نیست"
        : "گواهی معتبر نیست";
  return (
    <div className="verify-result" data-tone={tone} role="status">
      <Icon name={result.valid ? "shield-check" : "info"} size={22} />
      <div>
        <strong>{title}</strong>
        {result.error && !result.crypto_valid ? <p>{result.error}</p> : null}
        {result.crypto_valid ? (
          <dl className="verify-fields">
            {FIELD_LABELS.filter(([k]) => result.payload[k] !== undefined).map(([k, label]) => (
              <div key={k}>
                <dt>{label}</dt>
                <dd>
                  <bdi>{faDigits(String(result.payload[k]))}</bdi>
                </dd>
              </div>
            ))}
            <div>
              <dt>وضعیت فعلی</dt>
              <dd>{statusLabel(result.reservation_status)}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    </div>
  );
}
