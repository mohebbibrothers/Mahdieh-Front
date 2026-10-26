"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { draftStore } from "@/features/booking-draft/store";
import { ApiError } from "@/shared/api/client";
import type { Policies } from "@/shared/api/policies";
import { fetchQuote, qk, reservationsQuery, standingQuery } from "@/shared/api/queries";
import { createReservation, joinWaitlist, problemExtras, rk } from "@/shared/api/reservations";
import type {
  Alternative,
  Profile,
  Quote,
  Reservation,
  Standing,
  Violation,
  WaitlistEntry,
} from "@/shared/api/schemas";
import { reservationHref } from "@/shared/config/destinations";
import { cellsLabel, faCount, faDigits, formatMoment } from "@/shared/lib/fa";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { ArrivalPicker } from "./ArrivalPicker";
import {
  NEEDS,
  NOTE_MAX,
  alternativeToSelection,
  arrivalOptions,
  composeNote,
  forgetIdempotencyKey,
  idempotencyKeyFor,
  shortKey,
  type Lattice,
} from "./model";
import { PlateInput, type PlateValue } from "./PlateInput";
import { setSearch } from "./use-search";

type Payload = { unit_code: string; start: string; end: string; guests_count: number };

/** جایگزینی یک‌کلیکی: واحد در نشانی، زمان در پیش‌نویس (همان منبع حقیقت صفحهٔ نخست). */
export function applyAlternative(a: Alternative, lattice: Lattice) {
  const s = alternativeToSelection(a, lattice);
  draftStore.set({ day: s.day, period: s.period, cells: s.cells, searched: true });
  setSearch({ unit: s.unit });
  toast(`پیشنهاد «${a.unit_title} — ${a.date_jalali}» جایگزین شد.`, "success");
}

/* ── اهلیت و سهمیه ───────────────────────────────────────────────────────── */
function QuotaBar({ used, add, limit }: { used: number; add: number; limit: number }) {
  const pct = (n: number) => (limit > 0 ? Math.min(100, Math.max(0, (n / limit) * 100)) : 0);
  const u = pct(used);
  const a = Math.min(100 - u, pct(add));
  return (
    <svg className="quota-bar" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
      <rect className="quota-bar__track" width="100" height="6" rx="3" />
      <rect className="quota-bar__used" width={u} height="6" rx="3" />
      {a > 0 ? <rect className="quota-bar__add" x={u} width={a} height="6" rx="3" /> : null}
    </svg>
  );
}

function StandingPanel({
  standing,
  profile,
  cells,
  active,
}: {
  standing: Standing | undefined;
  profile: Profile;
  cells: number;
  active: Reservation | undefined;
}) {
  const ok = standing?.can_book ?? true;
  const until = standing?.suspended_until ?? standing?.cooldown_until ?? standing?.next_eligible_at ?? null;
  const tiles = standing
    ? [
        {
          key: "active",
          title: "سقف رزرو فعال",
          q: standing.active,
          add: 1,
          unit: "رزرو",
          note: `حداکثر ${faDigits(standing.active.limit)} رزرو فعال در هر زمان`,
        },
        {
          key: "window",
          title: `سهمیهٔ ${faDigits(standing.window.window_days ?? 30)} روزه`,
          q: standing.window,
          add: cells,
          unit: "نیم‌روز",
          note: `سقف ${faDigits(standing.window.limit)} نیم‌روز در هر پنجرهٔ ماهانه`,
        },
        {
          key: "year",
          title: "سهمیهٔ سالانه",
          q: standing.year,
          add: cells,
          unit: "نیم‌روز",
          note: `سقف ${faDigits(standing.year.limit)} نیم‌روز اقامت در سال شمسی`,
        },
      ]
    : [];

  return (
    <section className="standing" data-ok={ok} aria-labelledby="standing-title" aria-busy={!standing}>
      <header className="standing__head">
        <span className="standing__badge" aria-hidden="true">
          <Icon name={ok ? "shield-check" : "lock"} size={22} />
        </span>
        <div className="standing__titles">
          <h3 id="standing-title">
            {!standing
              ? "در حال استعلام اهلیت رزرو…"
              : ok
                ? "اهلیت رزرو زائر: مجاز و دارای سهمیه"
                : "فعلاً امکان ثبت رزرو جدید نیست"}
          </h3>
          <p>استعلام آنی از موتور قوانین و سهمیه‌های مهدیه</p>
        </div>
        <div className="standing__who">
          <strong>{profile.display_name}</strong>
          <bdi className="latin" dir="ltr">
            {profile.phone_masked}
          </bdi>
        </div>
      </header>

      <ul className="standing__quotas">
        {standing
          ? tiles.map((t) => {
              const after = t.q.used + t.add;
              const over = after > t.q.limit;
              return (
                <li key={t.key} data-over={over || undefined}>
                  <span className="standing__q-title">{t.title}</span>
                  <strong className="standing__q-value">
                    <b>{faDigits(t.q.used)}</b> از {faDigits(t.q.limit)}
                  </strong>
                  <QuotaBar used={t.q.used} add={ok ? t.add : 0} limit={t.q.limit} />
                  <small>{t.note}</small>
                  {ok ? (
                    <small className="standing__q-after">
                      با این رزرو: {faDigits(after)} از {faDigits(t.q.limit)} {t.unit}
                    </small>
                  ) : null}
                </li>
              );
            })
          : [0, 1, 2].map((i) => <li key={i} className="skeleton-tile" aria-hidden="true" />)}
      </ul>

      {standing && !ok ? (
        <div className="standing__blockers" role="alert">
          <strong>
            <Icon name="alert" size={18} /> امکان ثبت رزرو جدید وجود ندارد
          </strong>
          <ul>
            {standing.blockers.map((b) => (
              <li key={b.code}>{b.message}</li>
            ))}
          </ul>
          {until ? <p>از {formatMoment(until)} دوباره می‌توانید رزرو کنید.</p> : null}
          {active ? (
            <Link className="btn btn-secondary btn-sm" href={reservationHref(active.code)}>
              <Icon name="ticket" size={16} /> مشاهدهٔ رزرو فعال <bdi>{active.code}</bdi>
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ── پیشنهادهای جایگزین و تخلف‌ها ─────────────────────────────────────────── */
export function Alternatives({ items, lattice }: { items: Alternative[]; lattice: Lattice }) {
  if (!items.length) return null;
  return (
    <div className="alts">
      <p className="alts__title">
        <Icon name="sparkle" size={16} /> نزدیک‌ترین گزینه‌های آزاد (با یک لمس جایگزین می‌شود):
      </p>
      <ul className="alts__list">
        {items.map((a) => (
          <li key={`${a.unit_code}-${a.start}`}>
            <button type="button" className="alt-chip" onClick={() => applyAlternative(a, lattice)}>
              <span className="alt-chip__unit">
                <bdi className="latin">{a.unit_code}</bdi> · {a.unit_title}
              </span>
              <span className="alt-chip__when">{a.date_jalali}</span>
              {a.is_same_unit ? <span className="alt-chip__tag">همین واحد</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViolationList({ items }: { items: Violation[] }) {
  if (!items.length) return null;
  return (
    <ul className="violations">
      {items.map((v) => (
        <li key={v.code}>
          <Icon name="info" size={16} />
          {v.message}
        </li>
      ))}
    </ul>
  );
}

/* ── صف انتظار ──────────────────────────────────────────────────────────── */
function WaitlistOffer({ payload, offerMinutes }: { payload: Payload; offerMinutes: number }) {
  const qc = useQueryClient();
  const join = useMutation<WaitlistEntry, Error>({
    mutationFn: () => joinWaitlist(payload),
    onSuccess: () => toast("در صف انتظار ثبت شدید؛ با آزاد شدن سانس پیامک می‌گیرید.", "success"),
    onError: (e) => {
      if (e instanceof ApiError && e.code === "slot_already_free") {
        void qc.invalidateQueries({ queryKey: ["me", "quote"] });
        void qc.invalidateQueries({ queryKey: ["calendar"] });
      }
    },
  });
  if (join.data) {
    return (
      <div className="waitlist waitlist--joined" role="status">
        <Icon name="check" size={18} />
        <p>
          <strong>در صف انتظار هستید — نوبت {faDigits(join.data.position)}</strong>
          <span>
            اگر این سانس آزاد شود، پیامک پیشنهاد می‌گیرید و {faCount(offerMinutes)} دقیقه برای پذیرش آن فرصت دارید.
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className="waitlist">
      <p>
        <strong>این سانس پر است؛ اما می‌توانید در صف انتظار بمانید.</strong>
        <span>با لغو هر رزرو، به ترتیب نوبت به زائران صف پیامک پیشنهاد ارسال می‌شود.</span>
      </p>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => join.mutate()}
        disabled={join.isPending}
      >
        <Icon name="hourglass" size={16} />
        {join.isPending ? "در حال ثبت…" : "عضویت در صف انتظار"}
      </button>
      {join.error ? (
        <p className="field-error" role="alert">
          {join.error instanceof ApiError ? join.error.message : "ثبت در صف انتظار ممکن نشد؛ دوباره تلاش کنید."}
        </p>
      ) : null}
    </div>
  );
}

/* ── نتیجهٔ استعلام سانس ─────────────────────────────────────────────────── */
function QuoteVerdict({
  quote,
  pending,
  error,
  lattice,
  payload,
  policies,
}: {
  quote: Quote | undefined;
  pending: boolean;
  error: Error | null;
  lattice: Lattice;
  payload: Payload;
  policies: Policies;
}) {
  if (pending) {
    return (
      <div className="verdict verdict--pending" role="status">
        <span className="spinner" aria-hidden="true" /> در حال بررسی آزاد بودن سانس و قواعد رزرو شما…
      </div>
    );
  }
  if (error || !quote) {
    return (
      <div className="verdict verdict--warn" role="alert">
        <Icon name="wifi-off" size={18} />
        <p>
          <strong>استعلام سانس ممکن نشد.</strong>
          <span>
            {error instanceof ApiError ? error.message : "اتصال را بررسی کنید؛ پیش از ثبت دوباره بررسی می‌شود."}
          </span>
        </p>
      </div>
    );
  }
  if (quote.allowed) {
    return (
      <div className="verdict verdict--ok" role="status">
        <Icon name="calendar-check" size={18} />
        <p>
          <strong>
            این سانس برای شما آزاد و مجاز است — {cellsLabel(quote.cells)}، {quote.duration_label}
          </strong>
          {quote.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </p>
      </div>
    );
  }
  return (
    <div className="verdict verdict--bad" role="alert">
      <Icon name={quote.is_available ? "info" : "calendar-x"} size={18} />
      <div className="verdict__body">
        <strong>{quote.is_available ? "این انتخاب با قواعد رزرو سازگار نیست" : "این سانس دیگر آزاد نیست"}</strong>
        <ViolationList items={quote.violations} />
        {quote.notes.map((n) => (
          <span key={n}>{n}</span>
        ))}
        <Alternatives items={quote.alternatives} lattice={lattice} />
        {!quote.is_available && policies.waitlistEnabled ? (
          <WaitlistOffer payload={payload} offerMinutes={policies.waitlistOfferMinutes} />
        ) : null}
      </div>
    </div>
  );
}

/* ── گام ۳ ──────────────────────────────────────────────────────────────── */
export function StepDetails({
  payload,
  profile,
  lattice,
  policies,
  onEditProfile,
  onCreated,
  onProfileRequired,
  onSignedOut,
}: {
  payload: Payload;
  profile: Profile;
  lattice: Lattice;
  policies: Policies;
  onEditProfile: () => void;
  onCreated: (r: Reservation) => void;
  onProfileRequired: () => void;
  onSignedOut: () => void;
}) {
  const id = useId();
  const qc = useQueryClient();
  const standing = useQuery(standingQuery);
  const upcoming = useQuery(reservationsQuery("upcoming"));
  const quote = useQuery({
    queryKey: ["me", "quote", payload] as const,
    queryFn: () => fetchQuote(payload),
    staleTime: 20_000,
    retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
  });
  const cells = Math.max(
    1,
    Math.round((Date.parse(payload.end) - Date.parse(payload.start)) / (lattice.cellHours * 3_600_000)),
  );

  const [arrival, setArrival] = useState<string | null>(null);
  const [plate, setPlate] = useState<PlateValue>({ text: "", complete: true });
  const [plateTouched, setPlateTouched] = useState(false);
  const [needs, setNeeds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const note = composeNote(needs, text);
  const headLen = composeNote(needs, "").length + (needs.length ? 3 : 0);
  const textMax = Math.max(0, NOTE_MAX - headLen);
  const key = useMemo(() => idempotencyKeyFor(payload), [payload]);
  const options = useMemo(() => arrivalOptions(payload.start), [payload.start]);

  const create = useMutation<Reservation, Error>({
    mutationFn: () =>
      createReservation(
        {
          ...payload,
          ...(note ? { guest_note: note } : {}),
          ...(arrival ? { expected_arrival: arrival } : {}),
          ...(plate.text ? { vehicle_plate: plate.text } : {}),
        },
        key,
      ),
    onSuccess: (r) => {
      forgetIdempotencyKey(payload);
      qc.setQueryData(rk.reservation(r.code), r);
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["calendar"] });
      onCreated(r);
    },
    onError: (e) => {
      if (!(e instanceof ApiError)) return;
      if (e.status === 401) onSignedOut();
      else if (e.status === 403) onProfileRequired();
      else if (e.status === 409 || e.status === 422) {
        void qc.invalidateQueries({ queryKey: ["me", "quote"] });
        void qc.invalidateQueries({ queryKey: qk.standing });
        void qc.invalidateQueries({ queryKey: ["calendar"] });
      }
    },
  });

  const extras = problemExtras(create.error);
  const activeRes = upcoming.data?.results.find((r) => r.is_active);
  const blocked = standing.data ? !standing.data.can_book : false;
  const quoteBad = quote.data ? !quote.data.allowed : false;
  const plateBad = plateTouched && !plate.complete;
  const canSubmit = !blocked && !quoteBad && !create.isPending;

  const submit = () => {
    setPlateTouched(true);
    if (!plate.complete) {
      document.getElementById(`${id}-plate`)?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    create.mutate();
  };

  return (
    <div className="details">
      <StandingPanel standing={standing.data} profile={profile} cells={cells} active={activeRes} />
      {!blocked ? (
        <QuoteVerdict
          quote={quote.data}
          pending={quote.isPending}
          error={quote.error}
          lattice={lattice}
          payload={payload}
          policies={policies}
        />
      ) : null}

      <form
        className="account-flow account-flow--page details__form"
        noValidate
        aria-labelledby={`${id}-h`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h3 className="details__section" id={`${id}-h`}>
          <Icon name="map-pin" size={18} /> اطلاعات تکمیلی ورود به مشهد
        </h3>
        <div className="acc-row acc-row--trio">
          <ArrivalPicker
            options={options}
            value={arrival}
            onChange={setArrival}
            help="جهت هماهنگی پرسنل خدام و تحویل بدون معطلی کلید واحد"
          />
          <div id={`${id}-plate`}>
            <PlateInput onChange={setPlate} invalid={plateBad} />
          </div>
        </div>

        <div className="acc-field note-field">
          <label className="field-label" htmlFor={`${id}-note`}>
            یادداشت یا نیاز ویژهٔ زائر (اختیاری)
          </label>
          <div className="need-chips" role="group" aria-label="نیازهای ویژه (افزودن به یادداشت)">
            {NEEDS.map((n) => (
              <button
                key={n}
                type="button"
                className="need-chip"
                aria-pressed={needs.includes(n)}
                onClick={() => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]))}
              >
                <Icon name={needs.includes(n) ? "check" : "plus"} size={14} />
                {n}
              </button>
            ))}
          </div>
          <textarea
            id={`${id}-note`}
            className="text-input note-field__input"
            rows={3}
            maxLength={textMax}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, textMax))}
            placeholder="مثلاً: همراه با یک زائر سالمند هستیم و طبقهٔ پایین برایمان راحت‌تر است."
            aria-describedby={`${id}-note-c`}
          />
          <p className="note-field__count" id={`${id}-note-c`} aria-live="polite">
            <bdi>
              {faDigits(note.length)} / {faDigits(NOTE_MAX)}
            </bdi>{" "}
            نویسه
          </p>
        </div>

        <p className="idem-note">
          <Icon name="shield-check" size={16} />
          <span>
            این درخواست با کلید امن هم‌توان (<bdi dir="ltr">{shortKey(key)}</bdi>) محافظت می‌شود و در صورت دوبار کلیک
            هرگز رزرو تکراری صادر نخواهد شد.
          </span>
        </p>

        {create.error ? (
          <div className="verdict verdict--bad submit-error" role="alert">
            <Icon name="alert" size={18} />
            <div className="verdict__body">
              <strong>{create.error instanceof ApiError ? create.error.message : "ارتباط با سرور برقرار نشد."}</strong>
              {create.error instanceof ApiError ? null : (
                <span>
                  نگران نباشید؛ با تلاش دوباره همان درخواست (با همان کلید) فرستاده می‌شود و رزرو تکراری ساخته نمی‌شود.
                </span>
              )}
              <ViolationList items={extras.violations} />
              <Alternatives items={extras.alternatives} lattice={lattice} />
            </div>
          </div>
        ) : null}

        <div className="account-actions account-actions--page details__actions">
          <button
            type="submit"
            className={cx("btn btn-primary btn-lg account-submit")}
            disabled={!canSubmit}
            aria-busy={create.isPending}
          >
            {create.isPending ? <span className="spinner" aria-hidden="true" /> : <Icon name="certificate" size={20} />}
            {create.isPending ? "در حال صدور گواهی…" : "تأیید نهایی و صدور گواهی اقامت"}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={onEditProfile}>
            <Icon name="pencil" size={18} /> ویرایش مشخصات سجلی
          </button>
        </div>
      </form>
    </div>
  );
}
