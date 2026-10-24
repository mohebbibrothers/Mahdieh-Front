"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { openAccount } from "@/features/session/account-store";
import { ApiError } from "@/shared/api/client";
import type { Policies } from "@/shared/api/policies";
import { propertyQuery, sessionQuery } from "@/shared/api/queries";
import {
  certificateQuery,
  feedbackToken,
  reservationIcsHref,
  reservationQuery,
  timelineQuery,
} from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { faDigits, formatMoment } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { CancelDialog } from "./CancelDialog";
import { CertificateSheet } from "./CertificateSheet";
import { FeedbackDialog } from "./FeedbackDialog";
import { CANCELLED, CERTIFIABLE, milestones } from "./model";
import { BookingSteps, StayRibbon, StepCard, rangeLabel, spanLabel } from "./parts";

/** رزروهایی که همین حالا در این زبانه ساخته شدند ⇒ بنر «زیارت قبول» و جشن کوچک ورود. */
export const freshCodes = new Set<string>();

function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return faDigits(`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
}

/** شمارش معکوس نگه‌داشت؛ با پایان مهلت، وضعیت تازه از سرور خوانده می‌شود (تأیید یا انقضا). */
function HoldCountdown({ r }: { r: Reservation }) {
  const qc = useQueryClient();
  const now = useClock(Boolean(r.hold_expires_at));
  const left = r.hold_expires_at ? Date.parse(r.hold_expires_at) - now : 0;
  const expired = now > 0 && left <= 0;
  useEffect(() => {
    if (expired) void qc.invalidateQueries({ queryKey: ["me", "reservation", r.code] });
  }, [expired, qc, r.code]);
  useEffect(() => {
    const t = setInterval(() => void qc.invalidateQueries({ queryKey: ["me", "reservation", r.code] }), 20_000);
    return () => clearInterval(t);
  }, [qc, r.code]);
  return (
    <div className="hold">
      <span className="hold__ring" aria-hidden="true">
        <Icon name="hourglass" size={26} />
      </span>
      <div>
        <strong>سانس برای شما نگه داشته شده است</strong>
        <p>
          کارشناس پذیرش درخواست را بررسی می‌کند؛ پس از تأیید، گواهی رسمی همین‌جا صادر و پیامک می‌شود. این صفحه خودکار
          به‌روز می‌شود.
        </p>
      </div>
      {r.hold_expires_at ? (
        <p className="hold__timer" role="timer" aria-live="off">
          <span>مهلت نگه‌داشت</span>
          <bdi dir="ltr">{now ? mmss(left) : "—"}</bdi>
        </p>
      ) : null}
    </div>
  );
}

function Banner({ r, fresh }: { r: Reservation; fresh: boolean }) {
  const status = r.status ?? "confirmed";
  const view: { tone: string; icon: IconName; title: string; text: string } = CANCELLED.has(status)
    ? {
        tone: "stopped",
        icon: "calendar-x",
        title: `این رزرو ${r.status_label} است`,
        text: "سانس آزاد شده و این رزرو دیگر گواهی معتبر ندارد.",
      }
    : status === "hold"
      ? {
          tone: "hold",
          icon: "hourglass",
          title: "درخواست شما ثبت شد · در انتظار تأیید پذیرش",
          text: "تا تأیید پذیرش، سانس برای شما محفوظ است.",
        }
      : status === "checked_in"
        ? {
            tone: "ok",
            icon: "key",
            title: "خوش آمدید · پذیرش شما انجام شده است",
            text: "اقامتی پربرکت و زیارتی مقبول برایتان آرزومندیم.",
          }
        : status === "completed"
          ? {
              tone: "ok",
              icon: "star",
              title: "اقامت شما به پایان رسید · زیارت قبول",
              text: "پیوند نظرسنجی رضایت برایتان پیامک شده است.",
            }
          : fresh
            ? {
                tone: "ok",
                icon: "check",
                title: "زیارت قبول · رزرو شما با موفقیت قطعی شد",
                text: "خانه‌ای برای شما در مهدیه مشهد مقدس آماده است. گواهی اقامت رسمی با کد پیگیری اختصاصی زیر صادر شد.",
              }
            : {
                tone: "ok",
                icon: "certificate",
                title: "رزرو قطعی شما",
                text: "گواهی رسمی اقامت با کد پیگیری اختصاصی زیر در دسترس است.",
              };
  return (
    <div
      className="success-banner"
      data-tone={view.tone}
      data-fresh={fresh || undefined}
      role={fresh ? "status" : undefined}
    >
      <span className="success-banner__icon" aria-hidden="true">
        <Icon name={view.icon} size={28} />
      </span>
      <div>
        <strong>{view.title}</strong>
        <p>{view.text}</p>
      </div>
    </div>
  );
}

function StayTimeline({ r }: { r: Reservation }) {
  const events = useQuery(timelineQuery(r.code));
  const now = useClock(false);
  const list = milestones(r, events.data?.results ?? [], now || Date.parse(r.created_at));
  return (
    <section className="stay-timeline" aria-labelledby="stay-timeline-title">
      <h3 id="stay-timeline-title">
        <Icon name="clock" size={18} /> گاه‌شمار وضعیت این رزرو
      </h3>
      <ol>
        {list.map((m, i) => (
          <li key={m.key} data-state={m.state}>
            <span className="stay-timeline__dot" aria-hidden="true">
              {m.state === "done" ? (
                <Icon name="check" size={14} />
              ) : m.key === "closed" ? (
                <Icon name="x" size={14} />
              ) : (
                faDigits(i + 1)
              )}
            </span>
            <strong>{m.title}</strong>
            <span>{m.at ? formatMoment(m.at) : m.detail}</span>
            {m.at ? <small>{m.detail}</small> : null}
            <span className="sr-only">
              {m.state === "done"
                ? "(انجام شد)"
                : m.state === "current"
                  ? "(مرحلهٔ جاری)"
                  : m.state === "stopped"
                    ? ""
                    : "(پیش‌رو)"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ReservationView({ code, policies }: { code: string; policies: Policies }) {
  const session = useQuery(sessionQuery);
  const profile = session.data?.profile ?? null;
  const signedIn = Boolean(profile);
  const res = useQuery({ ...reservationQuery(code), enabled: signedIn });
  const r = res.data;
  const status = r?.status ?? "confirmed";
  const cert = useQuery({ ...certificateQuery(code), enabled: Boolean(r && CERTIFIABLE.has(status)) });
  const property = useQuery(propertyQuery);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fresh] = useState(() => freshCodes.has(code));
  useEffect(() => {
    freshCodes.delete(code);
  }, [code]);

  if (session.isPending || (signedIn && res.isPending)) {
    return (
      <>
        <StayRibbon data={null} pending />
        <BookingSteps current={4} />
        <StepCard step={4} title="در حال بارگذاری رزرو…">
          <div className="skeleton skeleton--block cert-skeleton" aria-hidden="true" />
        </StepCard>
      </>
    );
  }
  if (!signedIn) {
    return (
      <StepCard
        step={null}
        title="برای دیدن این رزرو وارد حساب شوید"
        lead="گواهی و جزئیات هر رزرو فقط برای صاحب همان حساب نمایش داده می‌شود."
      >
        <div className="empty-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => openAccount({ reason: `مشاهدهٔ رزرو ${code}` })}
          >
            <Icon name="user" size={18} /> ورود با شمارهٔ همراه
          </button>
        </div>
      </StepCard>
    );
  }
  if (res.error || !r) {
    const notFound = res.error instanceof ApiError && res.error.status === 404;
    return (
      <StepCard
        step={null}
        title={notFound ? "رزروی با این کد در حساب شما پیدا نشد" : "بارگذاری رزرو ممکن نشد"}
        lead={
          notFound
            ? "کد پیگیری را بررسی کنید؛ هر رزرو فقط در حساب سازندهٔ خودش دیده می‌شود."
            : "اتصال را بررسی و صفحه را تازه کنید."
        }
      >
        <div className="empty-actions">
          <Link className="btn btn-primary btn-lg" href={destHref("bookingNav") ?? "/"}>
            <Icon name="ticket" size={18} /> رزروهای من
          </Link>
          {notFound ? null : (
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => void res.refetch()}>
              <Icon name="refresh" size={18} /> تلاش دوباره
            </button>
          )}
        </div>
      </StepCard>
    );
  }

  const fbToken = feedbackToken(r.feedback_url);
  const floorTitle = property.data?.find((f) => f.number === r.floor_number)?.title ?? null;
  // دادهٔ کهنهٔ کش پس از لغو/انقضا هرگز نباید برگهٔ «معتبر» یا دکمهٔ چاپ را نشان دهد.
  const certifiable = CERTIFIABLE.has(status);
  const certData = certifiable ? cert.data : undefined;
  const certPending = certifiable && cert.isPending;
  const certError = certifiable && !certData && cert.error;

  const unitType = property.data?.flatMap((f) => f.units).find((u) => u.code === r.unit_code);
  return (
    <>
      <StayRibbon
        data={{
          unitIcon: unitType?.unit_type === "large_room" ? "room" : "suite",
          unitTitle: `${r.unit_code} — ${r.unit_title}`,
          unitMeta: [floorTitle ?? `طبقهٔ ${faDigits(r.floor_number)}`, unitType?.type_label]
            .filter(Boolean)
            .join(" · "),
          range: rangeLabel(r.start, r.end),
          span: spanLabel(r.cells_count),
          guests: r.guests_count,
          capacity: unitType?.capacity_total ?? null,
        }}
      />
      <BookingSteps current={CANCELLED.has(status) ? null : 4} />
      <StepCard step={4} title="گواهی رسمی اقامت و بلیط دیجیتال" className="booking-card--result" focusKey={status}>
        <Banner r={r} fresh={fresh} />
        {status === "hold" ? <HoldCountdown r={r} /> : null}
        {certPending ? <div className="skeleton skeleton--block cert-skeleton" aria-hidden="true" /> : null}
        {certError ? (
          <div className="verdict verdict--warn" role="alert">
            <Icon name="wifi-off" size={18} />
            <p>
              <strong>گواهی بارگذاری نشد.</strong>
              <span>رزرو شما معتبر است؛ صفحه را تازه کنید.</span>
            </p>
          </div>
        ) : null}
        {certData ? (
          <CertificateSheet
            cert={certData}
            reservation={r}
            profile={profile}
            floorTitle={floorTitle}
            freeCancelHours={policies.cancelFreeHours}
            noShowGraceHours={policies.noShowGraceHours}
            noShowSuspensionDays={policies.noShowSuspensionDays}
          />
        ) : null}

        <div className="result-actions">
          {certData ? (
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <Icon name="printer" size={18} /> چاپ گواهی اقامت / دریافت PDF
            </button>
          ) : null}
          {r.is_active ? (
            <a className="btn btn-secondary" href={reservationIcsHref(r.code)} download={`mahdieh-${r.code}.ics`}>
              <Icon name="calendar-plus" size={18} /> افزودن به تقویم گوشی (دانلود ICS)
            </a>
          ) : null}
          {r.can_cancel ? (
            <button type="button" className="btn btn-danger-outline" onClick={() => setCancelOpen(true)}>
              <Icon name="calendar-x" size={18} /> پیش‌نمایش شرایط لغو رزرو
            </button>
          ) : null}
          {fbToken ? (
            <button type="button" className="btn btn-secondary" onClick={() => setFeedbackOpen(true)}>
              <Icon name="star" size={18} /> نظرسنجی پس از اقامت
            </button>
          ) : null}
          {CANCELLED.has(status) || status === "completed" ? (
            <Link className="btn btn-secondary" href={destHref("calendar")}>
              <Icon name="calendar" size={18} /> رزرو تازه
            </Link>
          ) : null}
        </div>

        <StayTimeline r={r} />
        {fbToken ? (
          <FeedbackDialog token={fbToken} code={r.code} isOpen={feedbackOpen} onOpenChange={setFeedbackOpen} />
        ) : null}
        {r.can_cancel ? <CancelDialog reservation={r} isOpen={cancelOpen} onOpenChange={setCancelOpen} /> : null}
      </StepCard>
    </>
  );
}
