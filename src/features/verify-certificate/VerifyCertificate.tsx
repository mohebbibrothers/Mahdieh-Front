"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { configQuery, verifyCertificate } from "@/shared/api/queries";
import type { Verification } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { faDigits } from "@/shared/lib/fa";
import { requestVerifyJump } from "@/shared/lib/verify-jump";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { parseCertificateToken } from "./parse-token";
import { QrScanner } from "./QrScanner";

type Tab = "scan" | "paste";
/** گوشی/تبلت (اشاره‌گر لمسی) با دوربین ⇒ زبانهٔ اسکن؛ رایانه ⇒ چسباندن نشانی (دوربین هم در دسترس). */
const defaultTab = (): Tab =>
  typeof window !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  window.matchMedia("(pointer: coarse)").matches
    ? "scan"
    : "paste";
const TABS: Array<{ id: Tab; label: string; icon: "scan" | "link" }> = [
  { id: "scan", label: "اسکن با دوربین", icon: "scan" },
  { id: "paste", label: "نشانی یا کد", icon: "link" },
];

/**
 * استعلام گواهی اقامت — تأیید امضای سمت سرور (نه هش سمت کاربر که جعل‌پذیر بود) و تطبیق
 * با وضعیت لحظه‌ای رزرو.
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

/**
 * پیوند QR گواهی (‎/verify/<token>/‎) را بک‌اند به ‎/?verify=<token>‎ هدایت می‌کند؛ همین‌جا پنجره خودکار باز،
 * استعلام اجرا و پارامتر از نشانی پاک می‌شود (تا رفرش/اشتراک، استعلام را تکرار نکند).
 */
function takeVerifyParam(): string | null {
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("verify");
  if (raw === null) return null;
  url.searchParams.delete("verify");
  window.history.replaceState(null, "", url); // null ⇒ Next همگام می‌شود (نه state داخلی __NA)
  return raw;
}

export function VerifyCertificateButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<string | null>(null);
  useEffect(() => {
    const raw = takeVerifyParam();
    if (raw === null) return;
    // همگام‌سازی با سامانهٔ بیرونی (نشانی مرورگر) — فقط یک بار پس از سوار شدن.
    /* eslint-disable react-hooks/set-state-in-effect */
    setInitial(raw);
    setOpen(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Icon name="certificate" size={18} />
        استعلام گواهی اقامت
      </button>
      <VerifyCertificateDialog isOpen={open} onOpenChange={setOpen} initial={initial} />
    </>
  );
}

function VerifyCertificateDialog({
  isOpen,
  onOpenChange,
  initial,
}: {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  initial: string | null;
}) {
  const verifyOffline = destHref("verifyOffline");
  const id = useId();
  const [raw, setRaw] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("paste");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const config = useQuery({ ...configQuery, enabled: isOpen });
  const mutation = useMutation({ mutationFn: (token: string) => verifyCertificate(token) });
  const autoRan = useRef<string | null>(null);
  const { mutate } = mutation;
  useEffect(() => {
    if (!isOpen || initial === null || autoRan.current === initial) return;
    autoRan.current = initial;
    const token = parseCertificateToken(initial);
    // پر کردن فرم از پیوند QR (منبع بیرونی) — یک بار برای هر پیوند.
    /* eslint-disable react-hooks/set-state-in-effect */
    setRaw(initial);
    setTab("paste");
    if (token) mutate(token);
    else setInputError("پیوند گواهی کامل نیست. نشانی کامل زیر QR را وارد کنید.");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, initial, mutate]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current && initial === null) setTab(defaultTab()); // همگام با محیط دستگاه، هنگام باز شدن
    wasOpen.current = isOpen;
  }, [isOpen, initial]);

  const submitToken = (text: string) => {
    const token = parseCertificateToken(text);
    if (!token) {
      setInputError("نشانی یا کد واردشده شبیه گواهی مهدیه نیست. نشانی کامل زیر QR را وارد کنید.");
      return;
    }
    setInputError(null);
    mutation.mutate(token);
  };

  const onTabKey = (e: KeyboardEvent, current: Tab) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === current);
    const next =
      e.key === "Home"
        ? TABS[0]
        : e.key === "End"
          ? TABS[TABS.length - 1]
          : TABS[(i + (e.key === "ArrowLeft" ? 1 : -1) + TABS.length) % TABS.length]; // راست‌به‌چپ
    if (!next) return;
    setTab(next.id);
    mutation.reset();
    tabRefs.current[next.id]?.focus();
  };

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
      subtitle="QR گواهی را با دوربین اسکن کنید یا نشانی زیر آن را بچسبانید؛ امضا روی سرور مهدیه بررسی می‌شود."
      size="sm"
    >
      <div className="verify-tabs" role="tablist" aria-label="روش استعلام">
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-controls={`${id}-panel-${t.id}`}
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => onTabKey(e, t.id)}
            onClick={() => {
              if (tab !== t.id) mutation.reset();
              setTab(t.id);
            }}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "scan" ? (
        <div role="tabpanel" id={`${id}-panel-scan`} aria-labelledby={`${id}-tab-scan`} className="verify-panel">
          <QrScanner
            onDetect={(text) => {
              setRaw(text);
              submitToken(text);
            }}
            onPaste={() => setTab("paste")}
          />
        </div>
      ) : (
        <form
          role="tabpanel"
          id={`${id}-panel-paste`}
          aria-labelledby={`${id}-tab-paste`}
          className="verify-form verify-panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submitToken(raw);
          }}
        >
          <label htmlFor={`${id}-token`} className="field-label">
            نشانی یا کد تأیید
          </label>
          <textarea
            id={`${id}-token`}
            className="text-input verify-form__input latin"
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
      )}

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
      {verifyOffline ? (
        <p className="verify-foot">
          گواهی بدون اینترنت در دست دارید؟{" "}
          <Link
            href={verifyOffline}
            className="text-link"
            onClick={(e) => {
              // پنجره بسته شود (در هر صفحه)؛ در خود پرتال: پیمایش نرم تا کارت آفلاین + درخشش + فوکوس.
              onOpenChange(false);
              mutation.reset();
              if (requestVerifyJump()) e.preventDefault();
            }}
          >
            بازرسی با مشخصات چاپی و کد کوتاه
          </Link>
        </p>
      ) : null}
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
                  {k === "code" ? (
                    <bdi className="latin" dir="ltr">
                      {String(result.payload[k])}
                    </bdi>
                  ) : (
                    <bdi>{faDigits(String(result.payload[k]))}</bdi>
                  )}
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
