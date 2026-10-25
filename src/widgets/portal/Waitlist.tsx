"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type OfferResult, respondOffer, waitlistQuery, withdrawWaitlist } from "@/shared/api/portal";
import type { SlotOffer, WaitlistEntry } from "@/shared/api/schemas";
import { faDigits, formatMoment } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { rangeLabel, spanLabel } from "@/widgets/booking/parts";
import { SectionHead, mmss } from "./parts";

/** دلیل‌های رد/انصراف (همان فهرست بک‌اند ‎DeclineReason‎). */
const REASONS: Array<[string, string]> = [
  ["time_not_suitable", "زمان پیشنهادی مناسب نیست"],
  ["plan_changed", "برنامهٔ سفر تغییر کرد"],
  ["found_elsewhere", "اقامت دیگری پیدا کردم"],
  ["by_mistake", "درخواست اشتباهی ثبت شده بود"],
  ["other", "سایر موارد"],
];

/** صف انتظار زائر — نوبت، پیشنهاد باز با شمارش معکوس و پاسخ درجا (بی‌نیاز از پیوند پیامک). */
export function Waitlist({ onAccepted }: { onAccepted: (code: string) => void }) {
  const list = useQuery(waitlistQuery);
  const entries = list.data?.results ?? [];
  if (!entries.length) return null;
  return (
    <section className="pt-section" aria-labelledby="pt-wait-title">
      <SectionHead
        id="pt-wait-title"
        icon="bell"
        title="صف انتظار و پیشنهاد سانس"
        aside="با آزاد شدن سانس، به ترتیب نوبت پیامک و همین‌جا پیشنهاد می‌شود."
      />
      <ul className="pt-wait">
        {entries.map((e) => (
          <li key={e.id}>
            <WaitCard entry={e} onAccepted={onAccepted} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WaitCard({ entry, onAccepted }: { entry: WaitlistEntry; onAccepted: (code: string) => void }) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const offer = entry.open_offer;
  return (
    <article className="pt-wait__card" data-offer={offer ? true : undefined}>
      <div className="pt-wait__main">
        <span className="pt-wait__pos">
          <small>نوبت</small> <b>{faDigits(entry.position)}</b>
        </span>
        <div className="pt-wait__body">
          <strong>
            {entry.unit_title} (<bdi className="latin">{entry.unit_code}</bdi>)
          </strong>
          <span>
            {rangeLabel(entry.starts_at, entry.ends_at)} · {spanLabel(entry.cells_count)} ·{" "}
            {faDigits(entry.guests_count)} نفر
          </span>
          <span className="pt-wait__meta">
            {entry.status_label} · ثبت {formatMoment(entry.created_at)}
            {entry.offers_sent ? ` · ${faDigits(entry.offers_sent)} پیشنهاد تاکنون` : ""}
          </span>
        </div>
        {!offer ? (
          <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setWithdrawOpen(true)}>
            <Icon name="x" size={16} /> انصراف از صف
          </button>
        ) : null}
      </div>
      {offer ? <OfferPanel offer={offer} onAccepted={onAccepted} /> : null}
      <WithdrawDialog entry={entry} isOpen={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </article>
  );
}

function OfferPanel({ offer, onAccepted }: { offer: SlotOffer; onAccepted: (code: string) => void }) {
  const qc = useQueryClient();
  const now = useClock();
  const left = Date.parse(offer.expires_at) - now;
  const expired = now > 0 && left <= 0;
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("time_not_suitable");
  useEffect(() => {
    if (expired) void qc.invalidateQueries({ queryKey: ["me", "waitlist"] });
  }, [expired, qc]);

  const respond = useMutation<OfferResult, Error, "accept" | "decline">({
    mutationFn: (action) => respondOffer(offer.id, action, action === "decline" ? reason : undefined),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["calendar"] });
      if (res.kind === "accepted") {
        toast("سانس به نام شما رزرو شد؛ زیارت قبول.", "success");
        onAccepted(res.code);
      } else {
        toast("پیشنهاد رد شد و سانس به نفر بعدی صف رسید.", "info");
      }
    },
    onError: () => void qc.invalidateQueries({ queryKey: ["me", "waitlist"] }),
  });

  return (
    <div className="pt-offer" role="region" aria-label="پیشنهاد سانس آزادشده">
      <div className="pt-offer__head">
        <span className="pt-offer__icon" aria-hidden="true">
          <Icon name="sparkle" size={22} />
        </span>
        <p>
          <strong>سانس آزاد شد؛ برای شما نگه داشته شده است</strong>
          <span>
            واحد <bdi className="latin">{offer.unit_code}</bdi> · {rangeLabel(offer.starts_at, offer.ends_at)}
          </span>
        </p>
        <p className="pt-offer__timer" role="timer" aria-live="off" data-low={left < 5 * 60_000 || undefined}>
          <span>مهلت پاسخ</span>
          <bdi dir="ltr">{now ? mmss(left) : "—"}</bdi>
        </p>
      </div>
      {declining ? (
        <fieldset className="pt-reasons">
          <legend>دلیل رد پیشنهاد (برای بهبود نوبت‌دهی)</legend>
          {REASONS.map(([k, label]) => (
            <label key={k} className="pt-reason">
              <input
                type="radio"
                name={`reason-${offer.id}`}
                value={k}
                checked={reason === k}
                onChange={() => setReason(k)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {respond.error ? (
        <p className="field-error" role="alert">
          {respond.error.message}
        </p>
      ) : null}
      <div className="pt-offer__actions">
        {declining ? (
          <>
            <button
              type="button"
              className="btn btn-danger"
              disabled={respond.isPending || expired}
              onClick={() => respond.mutate("decline")}
            >
              تأیید رد پیشنهاد
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setDeclining(false)}>
              بازگشت
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={respond.isPending || expired}
              aria-busy={respond.isPending}
              onClick={() => respond.mutate("accept")}
            >
              {respond.isPending ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={18} />}
              پذیرش و ثبت رزرو
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={respond.isPending || expired}
              onClick={() => setDeclining(true)}
            >
              نمی‌خواهم
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function WithdrawDialog({
  entry,
  isOpen,
  onOpenChange,
}: {
  entry: WaitlistEntry;
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("plan_changed");
  const withdraw = useMutation({
    mutationFn: () => withdrawWaitlist(entry.id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast("از صف انتظار خارج شدید.", "success");
      onOpenChange(false);
    },
  });
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="انصراف از صف انتظار"
      subtitle={`${entry.unit_title} · ${rangeLabel(entry.starts_at, entry.ends_at)}`}
      size="sm"
      actions={
        <>
          <button
            type="button"
            className="btn btn-danger"
            disabled={withdraw.isPending}
            aria-busy={withdraw.isPending}
            onClick={() => withdraw.mutate()}
          >
            بله، انصراف از صف
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>
            ماندن در صف
          </button>
        </>
      }
    >
      <fieldset className="pt-reasons">
        <legend>دلیل انصراف</legend>
        {REASONS.map(([k, label]) => (
          <label key={k} className="pt-reason">
            <input
              type="radio"
              name={`wd-${entry.id}`}
              value={k}
              checked={reason === k}
              onChange={() => setReason(k)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      {withdraw.error ? (
        <p className="field-error" role="alert">
          {withdraw.error.message}
        </p>
      ) : null}
    </AppDialog>
  );
}
