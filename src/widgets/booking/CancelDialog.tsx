"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { cancelPreviewQuery, cancelReservation, rk } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { faDigits, formatMoment } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";

/** دلیل‌های آماده — ‎reason_kind‎ زائر همیشه ‎guest_request‎ است؛ برچسب + متن آزاد در ‎reason‎ می‌رود. */
const REASONS = [
  "تغییر برنامهٔ سفر",
  "مشکل بلیت یا وسیلهٔ سفر",
  "بیماری یا مسئلهٔ خانوادگی",
  "رزرو در جای دیگر",
  "سایر",
] as const;
const REASON_MAX = 300;

/**
 * لغو در دو گام شفاف: «پیش‌نمایش پیامد» از خود سرور (رایگان یا دیرهنگام + خنک‌شدن) و سپس تأیید.
 * بی ‎confirm()‎ بومی (یادداشت ۳ طراح)؛ پس از لغو، همهٔ کش‌های وابسته (سهمیه، تقویم، گواهی) تازه می‌شوند.
 */
export function CancelDialog({
  reservation,
  isOpen,
  onOpenChange,
}: {
  reservation: Reservation;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const qc = useQueryClient();
  const preview = useQuery({ ...cancelPreviewQuery(reservation.code), enabled: isOpen });
  const [kind, setKind] = useState<(typeof REASONS)[number] | null>(null);
  const [text, setText] = useState("");
  const reason = [kind, text.trim()].filter(Boolean).join(" — ").slice(0, REASON_MAX);

  const cancel = useMutation<Reservation, Error>({
    mutationFn: () =>
      cancelReservation(reservation.code, { reason_kind: "guest_request", ...(reason ? { reason } : {}) }),
    onSuccess: (r) => {
      qc.setQueryData(rk.reservation(r.code), r);
      // گواهی رزرو لغوشده دیگر وجود ندارد (سرور ۴۰۹ می‌دهد) ⇒ پاک‌کردن به‌جای واکشی دوباره.
      const certKey = rk.certificate(r.code);
      qc.removeQueries({ queryKey: certKey, exact: true });
      void qc.invalidateQueries({
        queryKey: ["me"],
        predicate: (q) => q.queryKey.join("/") !== certKey.join("/"),
      });
      void qc.invalidateQueries({ queryKey: ["calendar"] });
      toast("رزرو لغو شد و سانس برای زائران دیگر آزاد شد.", "success");
      onOpenChange(false);
    },
    onError: () => void qc.invalidateQueries({ queryKey: rk.cancelPreview(reservation.code) }),
  });

  const p = preview.data;
  const blocked = p ? !p.cancellable : false;

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(o) => {
        if (!cancel.isPending) onOpenChange(o);
      }}
      title="پیش‌نمایش شرایط لغو رزرو"
      subtitle={
        <>
          رزرو{" "}
          <bdi className="latin" dir="ltr">
            {reservation.code}
          </bdi>{" "}
          — {reservation.unit_title}
        </>
      }
      size="md"
      actions={
        <>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!p || blocked || cancel.isPending}
            aria-busy={cancel.isPending || undefined}
            onClick={() => cancel.mutate()}
          >
            <Icon name="calendar-x" size={18} />
            {cancel.isPending ? "در حال لغو…" : p?.late ? "با پذیرش شرایط، لغو شود" : "لغو قطعی رزرو"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onOpenChange(false)}
            disabled={cancel.isPending}
          >
            منصرف شدم
          </button>
        </>
      }
    >
      <div className="cancel-flow">
        {preview.isPending ? (
          <div className="verdict verdict--pending" role="status">
            <span className="spinner" aria-hidden="true" /> در حال محاسبهٔ پیامد لغو در همین لحظه…
          </div>
        ) : preview.error ? (
          <div className="verdict verdict--warn" role="alert">
            <Icon name="wifi-off" size={18} />
            <p>
              <strong>پیش‌نمایش لغو بارگذاری نشد.</strong>
              <span>
                {preview.error instanceof ApiError ? preview.error.message : "اتصال را بررسی و دوباره تلاش کنید."}
              </span>
            </p>
          </div>
        ) : p ? (
          <div
            className={`verdict ${!p.cancellable ? "verdict--bad" : p.late ? "verdict--warn" : "verdict--ok"}`}
            role="status"
          >
            <Icon name={!p.cancellable ? "lock" : p.late ? "alert" : "shield-check"} size={18} />
            <p>
              <strong>
                {!p.cancellable ? "این رزرو قابل لغو نیست" : p.late ? "لغو دیرهنگام" : "لغو رایگان و بدون جریمه"}
              </strong>
              <span>{p.message}</span>
              {p.cancellable && !p.late && p.free_until ? (
                <span>مهلت لغو رایگان: {formatMoment(p.free_until)}</span>
              ) : null}
              {p.late && p.cooldown_until ? (
                <span>
                  تا {formatMoment(p.cooldown_until)} ({faDigits(p.cooldown_hours)} ساعت) امکان رزرو تازه نخواهید داشت.
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {p?.cancellable ? (
          <fieldset className="reason-set">
            <legend className="field-label">دلیل لغو (اختیاری؛ به بهبود میزبانی کمک می‌کند)</legend>
            <div className="need-chips">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="need-chip"
                  aria-pressed={kind === r}
                  onClick={() => setKind(kind === r ? null : r)}
                >
                  {kind === r ? <Icon name="check" size={14} /> : null}
                  {r}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor={`${id}-t`}>
              توضیح بیشتر
            </label>
            <textarea
              id={`${id}-t`}
              className="text-input"
              rows={2}
              maxLength={REASON_MAX - (kind ? kind.length + 3 : 0)}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="توضیح بیشتر (اختیاری)"
            />
          </fieldset>
        ) : null}

        {cancel.error ? (
          <p className="field-error" role="alert">
            {cancel.error instanceof ApiError
              ? cancel.error.message
              : "لغو انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید."}
          </p>
        ) : null}
      </div>
    </AppDialog>
  );
}
