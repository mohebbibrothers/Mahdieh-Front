"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Policies } from "@/shared/api/policies";
import { configQuery, propertyQuery, sessionQuery } from "@/shared/api/queries";
import { certificateQuery, feedbackToken, reservationIcsHref, timelineQuery } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import {
  durationLabel,
  faDigits,
  formatClock,
  formatDayMonth,
  formatFullDate,
  formatMoment,
  latinDigits,
  tehranToday,
} from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { CancelDialog } from "@/widgets/booking/CancelDialog";
import { CertificateSheet, printCertificate } from "@/widgets/booking/CertificateSheet";
import { FeedbackDialog } from "@/widgets/booking/FeedbackDialog";
import { CANCELLED, CERTIFIABLE, arrivalLabel, parseNote } from "@/widgets/booking/model";
import { ArrivalDialog } from "./ArrivalDialog";
import { arrivalCue, googleCalendarUrl, journey } from "./model";
import { CopyButton, PlateBadge, StatusPill, mmss } from "./parts";

/** «سانس روز / سانس شب» از ساعت تهران (شبکهٔ ۱۲ساعتهٔ ۰۸:۰۰/۲۰:۰۰). */
function shiftOf(iso: string): string {
  const h = Number(latinDigits(formatClock(iso)).slice(0, 2));
  return h >= 8 && h < 20 ? "سانس روز" : "سانس شب";
}
const dayOf = (iso: string) => formatFullDate(tehranToday(new Date(iso)));

const BADGE: Record<string, { icon: IconName; text: string }> = {
  hold: { icon: "hourglass", text: "در انتظار تأیید پذیرش" },
  confirmed: { icon: "shield-check", text: "تأییدشده و آمادهٔ پذیرش" },
  checked_in: { icon: "key", text: "در حال اقامت" },
  completed: { icon: "star", text: "اقامت پایان‌یافته" },
};

/** کارت شاخص اقامت (طراح: ‎.active-stay-card‎) — همهٔ کنش‌های پس از ثبت در یک‌جا. */
export function StayCard({
  r,
  others,
  onPick,
  policies,
  pinned,
  onUnpin,
}: {
  r: Reservation;
  /** همهٔ سفرهای پیش‌رو (برای تراشه‌های جابه‌جایی؛ فقط وقتی بیش از یکی باشد) */
  others: readonly Reservation[];
  onPick: (code: string) => void;
  policies: Policies;
  /** کارت از نشانی ‎?code=‎ باز شده و در فهرست پیش‌رو نیست (سفر گذشته/لغوشده) */
  pinned: boolean;
  onUnpin: () => void;
}) {
  const status = r.status ?? "confirmed";
  const property = useQuery(propertyQuery);
  const config = useQuery(configQuery);
  const session = useQuery(sessionQuery);
  const events = useQuery(timelineQuery(r.code));
  const now = useClock();
  const [certOpen, setCertOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const floor = property.data?.find((f) => f.number === r.floor_number);
  const unit = floor?.units.find((u) => u.code === r.unit_code);
  const site = config.data?.site;
  const fbToken = feedbackToken(r.feedback_url);
  const steps = journey(r, events.data?.results ?? [], now || Date.parse(r.created_at));
  const stopped = CANCELLED.has(status);
  const note = parseNote(r.guest_note ?? "");
  const badge = BADGE[status];

  return (
    <article className="pt-stay" aria-labelledby="pt-stay-title" data-status={status}>
      {others.length > 1 || pinned ? (
        <nav className="pt-stay__chips" aria-label="سفرهای پیش‌روی شما">
          {pinned ? (
            <button type="button" className="pt-chip" onClick={onUnpin}>
              <Icon name="arrow-right" size={14} /> بازگشت به سفر پیش‌رو
            </button>
          ) : null}
          {others.length > 1
            ? others.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  className="pt-chip"
                  aria-pressed={o.code === r.code}
                  onClick={() => onPick(o.code)}
                >
                  <bdi className="latin">{o.unit_code}</bdi>
                  <span>{formatDayMonth(tehranToday(new Date(o.start)))}</span>
                </button>
              ))
            : null}
        </nav>
      ) : null}

      <header className="pt-stay__head">
        <div className="pt-stay__title">
          <h2 id="pt-stay-title">
            {r.unit_title}{" "}
            <span className="pt-stay__code">
              (واحد <bdi className="latin">{r.unit_code}</bdi>)
            </span>
          </h2>
          <p className="pt-stay__specs">
            <span>{floor?.title ?? `طبقهٔ ${faDigits(r.floor_number)}`}</span>
            {unit ? (
              <span>
                {unit.type_label} · ظرفیت {faDigits(unit.capacity_total)} نفر ({faDigits(r.guests_count)} نفر ثبت‌شده)
              </span>
            ) : (
              <span>{faDigits(r.guests_count)} نفر ثبت‌شده</span>
            )}
            <span>ثبت {formatMoment(r.created_at)}</span>
          </p>
        </div>
        {badge && !stopped ? (
          <span className="pt-stay__badge" data-status={status}>
            <Icon name={badge.icon} size={18} />
            {badge.text}
          </span>
        ) : (
          <StatusPill status={status} label={r.status_label} />
        )}
      </header>

      {status === "hold" ? <HoldStrip r={r} /> : null}

      <dl className="pt-metrics">
        <div className="pt-metric">
          <dt>
            <Icon name="calendar-check" size={16} /> زمان آغاز پذیرش (ورود)
          </dt>
          <dd>
            {dayOf(r.start)}
            <small>
              ساعت {formatClock(r.start)} ({shiftOf(r.start)})
            </small>
          </dd>
        </div>
        <div className="pt-metric">
          <dt>
            <Icon name="calendar-x" size={16} /> زمان پایان اقامت (تخلیه)
          </dt>
          <dd>
            {dayOf(r.end)}
            <small>
              ساعت {formatClock(r.end)} ({shiftOf(r.end)})
            </small>
          </dd>
        </div>
        <div className="pt-metric">
          <dt>
            <Icon name="hourglass" size={16} /> مدت اقامت صلواتی
          </dt>
          <dd className="pt-metric__gold">
            {durationLabel(r.cells_count)}
            <small>{faDigits(r.cells_count)} نیم‌روز (۱۰۰٪ وقفی و رایگان)</small>
          </dd>
        </div>
        <div className="pt-metric">
          <dt>
            <Icon name="ticket" size={16} /> کد رهگیری رزرو
          </dt>
          <dd>
            <span className="pt-code">
              <bdi className="pt-code__text latin" dir="ltr">
                {r.code}
              </bdi>
              <CopyButton text={r.code} label="کد رهگیری" />
            </span>
            <small>ارائه به خادم پذیرش هنگام ورود</small>
          </dd>
        </div>
      </dl>

      {!stopped && status !== "completed" ? (
        <section className="pt-dock" aria-label="هماهنگی ورود">
          <div className="pt-dock__info">
            <p className="pt-dock__item">
              <span className="pt-dock__label">
                <Icon name="car" size={16} /> پلاک خودرو:
              </span>
              {r.vehicle_plate ? <PlateBadge text={r.vehicle_plate} /> : <em>ثبت نشده</em>}
            </p>
            <p className="pt-dock__item">
              <span className="pt-dock__label">
                <Icon name="clock" size={16} /> ساعت اعلامی رسیدن:
              </span>
              {r.expected_arrival ? (
                <strong>{arrivalLabel(r.expected_arrival.slice(0, 5))}</strong>
              ) : (
                <em>اعلام نشده</em>
              )}
            </p>
            {note.needs.length || note.text ? (
              <p className="pt-dock__item pt-dock__note">
                <span className="pt-dock__label">
                  <Icon name="note" size={16} /> یادداشت:
                </span>
                <span>{[...note.needs, note.text].filter(Boolean).join(" · ")}</span>
              </p>
            ) : null}
          </div>
          <div className="pt-dock__foot">
            <p className="pt-dock__cue" aria-live="polite">
              <Icon name="key" size={16} />
              {now ? arrivalCue(r, now) : `تحویل کلید از ساعت ${formatClock(r.start)}`}
            </p>
            {r.details_editable ? (
              <button type="button" className="btn btn-secondary pt-dock__edit" onClick={() => setArrivalOpen(true)}>
                <Icon name="pencil" size={16} />
                {r.vehicle_plate || r.expected_arrival ? "ویرایش ساعت و پلاک" : "ثبت ساعت و پلاک"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <ol className="pt-journey" aria-label="مراحل سفر شما">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className="pt-journey__step"
            data-state={s.state}
            aria-current={s.state === "current" ? "step" : undefined}
          >
            <span className="pt-journey__dot" aria-hidden="true">
              {s.state === "done" ? (
                <Icon name="check" size={16} />
              ) : s.state === "stopped" ? (
                <Icon name="x" size={16} />
              ) : (
                faDigits(i + 1)
              )}
            </span>
            <span className="pt-journey__body">
              <strong>{s.title}</strong>
              <span>{s.detail}</span>
              {s.at && s.state === "done" ? <time dateTime={s.at}>{formatMoment(s.at)}</time> : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="pt-actions">
        {CERTIFIABLE.has(status) ? (
          <button type="button" className="pt-act pt-act--cert" onClick={() => setCertOpen(true)}>
            <Icon name="certificate" size={18} /> گواهی رسمی اقامت (مشاهده و چاپ)
          </button>
        ) : null}
        {r.is_active ? (
          <a className="pt-act pt-act--ics" href={reservationIcsHref(r.code)} download={`mahdieh-${r.code}.ics`}>
            <Icon name="calendar-plus" size={18} />
            <span>
              افزودن به تقویم (<bdi className="latin">.ics</bdi>)
            </span>
          </a>
        ) : null}
        {r.is_active && site ? (
          <a
            className="pt-act pt-act--gcal"
            href={googleCalendarUrl(r, { name: site.name, phone: site.support_phone, address: site.support_address })}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="calendar" size={18} /> تقویم گوگل
            <Icon name="external-link" size={14} className="pt-act__ext" />
            <span className="sr-only">(در زبانهٔ تازه)</span>
          </a>
        ) : null}
        {fbToken ? (
          <button type="button" className="pt-act pt-act--ics" onClick={() => setFeedbackOpen(true)}>
            <Icon name="star" size={18} /> ثبت نظر و دل‌نوشته
          </button>
        ) : null}
        {stopped || status === "completed" ? (
          <Link className="pt-act pt-act--ics" href={destHref("calendar")}>
            <Icon name="calendar" size={18} /> رزرو تازه
          </Link>
        ) : null}
        {r.can_cancel ? (
          <button type="button" className="pt-act pt-act--cancel" onClick={() => setCancelOpen(true)}>
            <Icon name="calendar-x" size={18} /> لغو رزرو
          </button>
        ) : null}
      </div>
      {r.can_cancel ? (
        <p className="pt-stay__fine">
          <Icon name="info" size={14} />
          لغو رایگان و با بازگشت سهمیه تا {formatMoment(r.free_cancel_until)}؛ پس از آن لغو ممکن است اما سهمیه
          برنمی‌گردد.
        </p>
      ) : null}

      {CERTIFIABLE.has(status) ? (
        <CertificateDialog
          r={r}
          isOpen={certOpen}
          onOpenChange={setCertOpen}
          policies={policies}
          floorTitle={floor?.title ?? null}
          profile={session.data?.profile ?? null}
        />
      ) : null}
      {r.details_editable ? <ArrivalDialog reservation={r} isOpen={arrivalOpen} onOpenChange={setArrivalOpen} /> : null}
      {r.can_cancel ? <CancelDialog reservation={r} isOpen={cancelOpen} onOpenChange={setCancelOpen} /> : null}
      {fbToken ? (
        <FeedbackDialog token={fbToken} code={r.code} isOpen={feedbackOpen} onOpenChange={setFeedbackOpen} />
      ) : null}
    </article>
  );
}

/** نگه‌داشت در انتظار تأیید: شمارش معکوس + تازه‌سازی دوره‌ای تا تأیید/انقضا. */
function HoldStrip({ r }: { r: Reservation }) {
  const qc = useQueryClient();
  const now = useClock(Boolean(r.hold_expires_at));
  const left = r.hold_expires_at ? Date.parse(r.hold_expires_at) - now : 0;
  const expired = now > 0 && left <= 0;
  useEffect(() => {
    if (expired) void qc.invalidateQueries({ queryKey: ["me"] });
  }, [expired, qc]);
  useEffect(() => {
    const t = setInterval(() => void qc.invalidateQueries({ queryKey: ["me", "reservations"] }), 20_000);
    return () => clearInterval(t);
  }, [qc]);
  return (
    <div className="pt-hold" role="status">
      <span className="pt-hold__ring" aria-hidden="true">
        <Icon name="hourglass" size={22} />
      </span>
      <p>
        <strong>سانس برای شما نگه داشته شده است</strong>
        <span>پس از تأیید پذیرش، گواهی رسمی همین‌جا صادر و پیامک می‌شود؛ این کارت خودکار به‌روز می‌شود.</span>
      </p>
      {r.hold_expires_at ? (
        <p className="pt-hold__timer" role="timer" aria-live="off">
          <span>مهلت</span>
          <bdi dir="ltr">{now ? mmss(left) : "—"}</bdi>
        </p>
      ) : null}
    </div>
  );
}

function CertificateDialog({
  r,
  isOpen,
  onOpenChange,
  policies,
  floorTitle,
  profile,
}: {
  r: Reservation;
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  policies: Policies;
  floorTitle: string | null;
  profile: Parameters<typeof CertificateSheet>[0]["profile"];
}) {
  const cert = useQuery({ ...certificateQuery(r.code), enabled: isOpen });
  const [printing, setPrinting] = useState(false);
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="گواهی رسمی و معتبر اقامت زائر"
      subtitle="امضای دیجیتال سرور مهدیه · قابل استعلام برخط با QR و آفلاین با کد کوتاه"
      size="lg"
      actions={
        <>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!cert.data || printing}
            aria-busy={printing || undefined}
            onClick={() => {
              setPrinting(true);
              void printCertificate().finally(() => setPrinting(false));
            }}
          >
            <Icon name="printer" size={18} /> {printing ? "آماده‌سازی برگهٔ A4…" : "چاپ رسمی گواهی / دریافت PDF"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>
            بستن
          </button>
        </>
      }
    >
      <div className={cx("pt-cert", cert.isPending && "is-pending")}>
        {cert.isPending ? <div className="skeleton skeleton--block cert-skeleton" aria-hidden="true" /> : null}
        {cert.error ? (
          <div className="verdict verdict--warn" role="alert">
            <Icon name="wifi-off" size={18} />
            <p>
              <strong>گواهی بارگذاری نشد.</strong>
              <span>{cert.error.message}</span>
            </p>
          </div>
        ) : null}
        {cert.data ? (
          <CertificateSheet
            cert={cert.data}
            reservation={r}
            profile={profile}
            floorTitle={floorTitle}
            freeCancelHours={policies.cancelFreeHours}
            noShowGraceHours={policies.noShowGraceHours}
            noShowSuspensionDays={policies.noShowSuspensionDays}
          />
        ) : null}
      </div>
    </AppDialog>
  );
}
