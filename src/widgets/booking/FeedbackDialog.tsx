"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { feedbackStateQuery, rk, submitFeedback, type FeedbackState } from "@/shared/api/reservations";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";

const SCALE = [1, 2, 3, 4, 5] as const;

/** ردیف امتیاز ستاره‌ای — گروه رادیویی بومی (پیمایش با پیکان‌ها رایگان) با ظاهر ستاره. */
function Stars({
  name,
  label,
  value,
  onChange,
  labels,
  size = "md",
}: {
  name: string;
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  labels: Record<string, string>;
  size?: "md" | "sm";
}) {
  return (
    <fieldset className={`stars stars--${size}`}>
      <legend>{label}</legend>
      <div className="stars__row">
        {SCALE.map((n) => {
          const on = value !== null && n <= value;
          return (
            <label key={n} className="stars__item" data-on={on ? "" : undefined}>
              <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
              {/* هر دو شکل حاضر؛ CSS بر پایهٔ امتیاز یا پیش‌نمایش نشانگر یکی را نشان می‌دهد */}
              <Icon name="star" size={size === "md" ? 28 : 20} className="stars__off" />
              <Icon name="star-fill" size={size === "md" ? 28 : 20} className="stars__on" />
              <span className="sr-only">
                {faDigits(n)} — {labels[String(n)]}
              </span>
            </label>
          );
        })}
        {size === "md" ? <output aria-live="polite">{value ? labels[String(value)] : "انتخاب کنید"}</output> : null}
      </div>
    </fieldset>
  );
}

function Form({ token, state, onDone }: { token: string; state: FeedbackState; onDone: () => void }) {
  const id = useId();
  const qc = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const send = useMutation<FeedbackState, Error>({
    mutationFn: () =>
      submitFeedback(token, {
        rating: rating ?? 0,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        would_recommend: recommend,
        scores,
      }),
    onSuccess: (s) => {
      qc.setQueryData(feedbackStateQuery(token).queryKey, s);
      void qc.invalidateQueries({ queryKey: ["me", "reservation"] });
      toast("سپاس از نظرتان؛ برای بهبود میزبانی زائران بعدی به کار می‌رود.", "success");
      onDone();
    },
  });

  return (
    <form
      id={`${id}-form`}
      className="feedback-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating) send.mutate();
      }}
    >
      <Stars
        name={`${id}-r`}
        label="امتیاز کلی اقامت *"
        value={rating}
        onChange={setRating}
        labels={state.rating_labels}
      />
      <div className="feedback-form__subs">
        {state.subscores.map((s) => (
          <Stars
            key={s.field}
            name={`${id}-${s.field}`}
            label={s.label}
            size="sm"
            value={scores[s.field] ?? null}
            onChange={(v) => setScores((cur) => ({ ...cur, [s.field]: v }))}
            labels={state.rating_labels}
          />
        ))}
      </div>
      <fieldset className="feedback-form__rec">
        <legend className="field-label">مهدیه را به زائران دیگر پیشنهاد می‌کنید؟</legend>
        <div className="mini-seg">
          <button
            type="button"
            aria-pressed={recommend === true}
            onClick={() => setRecommend(recommend === true ? null : true)}
          >
            بله، حتماً
          </button>
          <button
            type="button"
            aria-pressed={recommend === false}
            onClick={() => setRecommend(recommend === false ? null : false)}
          >
            خیر
          </button>
        </div>
      </fieldset>
      <label className="field-label" htmlFor={`${id}-c`}>
        چه چیزی خوب بود و چه چیزی را می‌شد بهتر کرد؟ (اختیاری)
      </label>
      <textarea
        id={`${id}-c`}
        className="text-input"
        rows={3}
        maxLength={state.comment_max_length}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {send.error ? (
        <p className="field-error" role="alert">
          {send.error instanceof ApiError ? send.error.message : "ثبت نظر ممکن نشد؛ دوباره تلاش کنید."}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={!rating || send.isPending}
        aria-busy={send.isPending || undefined}
      >
        <Icon name="star" size={18} /> {send.isPending ? "در حال ثبت…" : "ثبت نظر"}
      </button>
    </form>
  );
}

export function FeedbackDialog({
  token,
  code,
  isOpen,
  onOpenChange,
}: {
  token: string;
  code: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useQuery({ ...feedbackStateQuery(token), enabled: isOpen });
  const qc = useQueryClient();
  const s = state.data;
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="نظرسنجی پس از اقامت"
      subtitle={
        <>
          کمتر از یک دقیقه — رزرو{" "}
          <bdi className="latin" dir="ltr">
            {code}
          </bdi>
        </>
      }
      size="md"
    >
      {state.isPending ? (
        <div className="verdict verdict--pending" role="status">
          <span className="spinner" aria-hidden="true" /> در حال بارگذاری فرم…
        </div>
      ) : !s ? (
        <p className="field-error" role="alert">
          {state.error instanceof ApiError ? state.error.message : "فرم نظرسنجی بارگذاری نشد."}
        </p>
      ) : s.state === "open" ? (
        <Form token={token} state={s} onDone={() => onOpenChange(false)} />
      ) : (
        <div className={`verdict ${s.state === "submitted" ? "verdict--ok" : "verdict--warn"}`} role="status">
          <Icon name={s.state === "submitted" ? "check" : "lock"} size={18} />
          <p>
            <strong>{s.state === "submitted" ? "نظر شما ثبت شده است؛ سپاسگزاریم." : "این نظرسنجی بسته است."}</strong>
            {s.reason ? <span>{s.reason}</span> : null}
          </p>
        </div>
      )}
      {s && s.state !== "open" ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void qc.invalidateQueries({ queryKey: rk.reservation(code) });
            onOpenChange(false);
          }}
        >
          بستن
        </button>
      ) : null}
    </AppDialog>
  );
}
