"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { feedbackStateQuery, rk, submitFeedback, type FeedbackState } from "@/shared/api/reservations";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";

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

/** وضعیت فرم در سطح پنجره ⇒ دکمهٔ ثبت در پای ثابت پنجره (در موبایل همیشه در دسترس). */
function useFeedbackForm(token: string) {
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
      // پنجره بسته نمی‌شود: همان‌جا «ثبت شد» و بازتاب دل‌نوشته نشان داده می‌شود (لحظهٔ قدردانی)
      qc.setQueryData(feedbackStateQuery(token).queryKey, s);
      void qc.invalidateQueries({ queryKey: ["me", "reservation"] });
      void qc.invalidateQueries({ queryKey: ["me", "reservations"] }); // سابقهٔ پرتال: ستون «ارزیابی»
    },
  });
  return { rating, setRating, scores, setScores, recommend, setRecommend, comment, setComment, send };
}
type FormModel = ReturnType<typeof useFeedbackForm>;

function Form({ formId, state, f }: { formId: string; state: FeedbackState; f: FormModel }) {
  const max = state.comment_max_length;
  const left = max - f.comment.length;
  return (
    <form
      id={formId}
      className="feedback-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (f.rating && !f.send.isPending) f.send.mutate();
      }}
    >
      <Stars
        name={`${formId}-r`}
        label="امتیاز کلی این زیارت و اقامت *"
        value={f.rating}
        onChange={f.setRating}
        labels={state.rating_labels}
      />
      {state.subscores.length ? (
        <fieldset className="feedback-form__subs">
          <legend className="feedback-form__subs-title">
            ریزامتیازها <span>(اختیاری)</span>
          </legend>
          {state.subscores.map((s) => (
            <Stars
              key={s.field}
              name={`${formId}-${s.field}`}
              label={s.label}
              size="sm"
              value={f.scores[s.field] ?? null}
              onChange={(v) => f.setScores((cur) => ({ ...cur, [s.field]: v }))}
              labels={state.rating_labels}
            />
          ))}
        </fieldset>
      ) : null}
      <fieldset className="feedback-form__rec">
        <legend className="field-label">مهدیه را به زائران دیگر پیشنهاد می‌کنید؟</legend>
        <div className="mini-seg">
          <button
            type="button"
            aria-pressed={f.recommend === true}
            onClick={() => f.setRecommend(f.recommend === true ? null : true)}
          >
            بله، حتماً
          </button>
          <button
            type="button"
            aria-pressed={f.recommend === false}
            onClick={() => f.setRecommend(f.recommend === false ? null : false)}
          >
            خیر
          </button>
        </div>
      </fieldset>
      <div className="feedback-form__note">
        <label className="field-label" htmlFor={`${formId}-c`}>
          دل‌نوشتهٔ شما <span>(اختیاری)</span>
        </label>
        <textarea
          id={`${formId}-c`}
          className="text-input"
          rows={4}
          maxLength={max}
          placeholder="چه چیزی دلتان را شاد کرد و چه چیزی را می‌شد بهتر کرد؟ هر کلمه‌تان مستقیم به دست مدیر مهدیه می‌رسد."
          aria-describedby={`${formId}-cc`}
          value={f.comment}
          onChange={(e) => f.setComment(e.target.value)}
        />
        <p id={`${formId}-cc`} className="feedback-form__count" data-low={left < 60 ? "" : undefined}>
          {faDigits(f.comment.length)} از {faDigits(max)} نویسه
        </p>
      </div>
      {f.send.error ? (
        <p className="field-error" role="alert">
          {f.send.error instanceof ApiError ? f.send.error.message : "ثبت دل‌نوشته ممکن نشد؛ دوباره تلاش کنید."}
        </p>
      ) : null}
    </form>
  );
}

/** پس از ثبت — بازتاب آنچه زائر نوشته (از پاسخ سرور) و قدردانی. */
function Done({ state, fresh }: { state: FeedbackState; fresh: boolean }) {
  const sub = state.submitted;
  return (
    <div className="fb-done" role="status" data-fresh={fresh ? "" : undefined}>
      <span className="fb-done__seal" aria-hidden="true">
        <Icon name="feather" size={26} />
      </span>
      <h3 className="fb-done__title">
        {fresh ? "دل‌نوشتهٔ شما در دفتر مهدیه ثبت شد" : "دل‌نوشتهٔ این سفر پیش‌تر ثبت شده است"}
      </h3>
      <p className="fb-done__lead">
        سپاس از همراهی‌تان؛ نظر شما مستقیم به مدیر مهدیه می‌رسد و برای میزبانی بهتر زائران بعدی به کار می‌رود. زیارتتان
        قبول.
      </p>
      {sub ? (
        <figure className="fb-done__card">
          <div className="fb-done__rating">
            <span className="fb-done__stars" aria-hidden="true">
              {SCALE.map((n) => (
                <Icon key={n} name={n <= sub.rating ? "star-fill" : "star"} size={18} />
              ))}
            </span>
            <span>
              {faDigits(sub.rating)} از ۵ · {state.rating_labels[String(sub.rating)]}
            </span>
            {sub.would_recommend ? (
              <span className="fb-done__chip">
                <Icon name="heart-hand" size={14} /> پیشنهاد به دیگران
              </span>
            ) : null}
          </div>
          {sub.comment ? (
            <blockquote className="fb-done__quote">
              <p>{sub.comment}</p>
            </blockquote>
          ) : null}
        </figure>
      ) : null}
    </div>
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
  const formId = useId();
  const state = useQuery({ ...feedbackStateQuery(token), enabled: isOpen });
  const qc = useQueryClient();
  const f = useFeedbackForm(token);
  const s = state.data;
  const trip = s?.reservation;
  const close = () => {
    void qc.invalidateQueries({ queryKey: rk.reservation(code) });
    onOpenChange(false);
  };
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="دفتر دل‌نوشتهٔ زیارت"
      subtitle={
        <>
          {trip?.unit_title ? `${trip.unit_title} · ` : null}
          {trip?.date_jalali ? <bdi>{faDigits(trip.date_jalali)}</bdi> : "کمتر از یک دقیقه"}
          {" · رزرو "}
          <bdi className="latin" dir="ltr">
            {code}
          </bdi>
        </>
      }
      size="md"
      actions={
        s?.state === "open" ? (
          <>
            <button
              type="submit"
              form={formId}
              className="btn btn-primary btn-lg"
              disabled={!f.rating || f.send.isPending}
              aria-busy={f.send.isPending || undefined}
            >
              <Icon name="feather" size={18} /> {f.send.isPending ? "در حال ثبت…" : "ثبت در دفتر دل‌نوشته"}
            </button>
            {!f.rating ? <p className="feedback-form__need">برای ثبت، امتیاز کلی را انتخاب کنید.</p> : null}
          </>
        ) : s ? (
          <button type="button" className="btn btn-secondary btn-lg" onClick={close}>
            بستن
          </button>
        ) : undefined
      }
    >
      {state.isPending ? (
        <div className="verdict verdict--pending" role="status">
          <span className="spinner" aria-hidden="true" /> در حال گشودن دفتر…
        </div>
      ) : !s ? (
        <p className="field-error" role="alert">
          {state.error instanceof ApiError ? state.error.message : "دفتر دل‌نوشته بارگذاری نشد."}
        </p>
      ) : s.state === "open" ? (
        <Form formId={formId} state={s} f={f} />
      ) : s.state === "submitted" ? (
        <Done state={s} fresh={f.send.isSuccess} />
      ) : (
        <div className="verdict verdict--warn" role="status">
          <Icon name="lock" size={18} />
          <p>
            <strong>دفتر دل‌نوشتهٔ این سفر بسته است.</strong>
            {s.reason ? <span>{s.reason}</span> : null}
          </p>
        </div>
      )}
    </AppDialog>
  );
}
