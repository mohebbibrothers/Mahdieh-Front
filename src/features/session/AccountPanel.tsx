"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { reservationsQuery, standingQuery } from "@/shared/api/queries";
import type { Profile, Standing } from "@/shared/api/schemas";
import { destHref, reservationHref } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import { durationLabel, faDigits, formatMoment } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { closeAccount } from "./account-store";

/**
 * نمای «حساب» برای زائرِ واردشده: هویت، توان رزرو زنده (‎/me/standing‎)، رزروهای پیش‌رو
 * (‎/reservations?scope=upcoming‎) و خروج — همه بدون ترک صفحه.
 */
export function AccountPanel({
  profile,
  onCompleteProfile,
  onLogout,
  busy,
}: {
  profile: Profile;
  onCompleteProfile: () => void;
  onLogout: (everywhere: boolean) => void;
  busy: boolean;
}) {
  const standing = useQuery({ ...standingQuery, enabled: profile.is_profile_complete });
  const upcoming = useQuery(reservationsQuery("upcoming"));
  const [confirmAll, setConfirmAll] = useState(false);
  const name = profile.display_name || [profile.first_name, profile.last_name].join(" ").trim() || "زائر گرامی";
  const reservations = upcoming.data?.results ?? [];
  const portal = destHref("portal");

  return (
    <div className="account-panel">
      <section className="account-id" aria-label="مشخصات حساب">
        <span className="account-id__avatar" aria-hidden="true">
          {(profile.first_name || name).slice(0, 1)}
        </span>
        <div className="account-id__text">
          <strong>{name}</strong>
          <bdi className="latin" dir="ltr">
            {profile.phone_masked}
          </bdi>
        </div>
        <span className="status-chip" data-status={profile.is_profile_complete ? "free" : "buffer"}>
          {profile.is_profile_complete ? "مشخصات کامل" : "مشخصات ناقص"}
        </span>
      </section>

      {profile.is_profile_complete ? (
        <StandingCard standing={standing.data} pending={standing.isPending} />
      ) : (
        <div className="account-alert" data-tone="warn">
          <Icon name="id-card" size={18} />
          <div>
            <strong>یک گام تا رزرو</strong>
            <p>برای ثبت رزرو، مشخصات سرپرست زائران (نام، کد ملی یا گذرنامه، شهر) را یک بار کامل کنید.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={onCompleteProfile}>
              تکمیل مشخصات <Icon name="arrow-left" size={16} />
            </button>
          </div>
        </div>
      )}

      <section className="account-section" aria-labelledby="acc-upcoming">
        <h3 id="acc-upcoming">رزروهای پیش‌رو</h3>
        {upcoming.isPending ? <div className="skeleton skeleton--block" aria-hidden="true" /> : null}
        {upcoming.isError ? <p className="field-help">فهرست رزروها اکنون در دسترس نیست.</p> : null}
        {upcoming.isSuccess && reservations.length === 0 ? (
          <p className="account-empty">
            <Icon name="calendar" size={18} /> رزرو فعالی ندارید.{" "}
            <Link href={destHref("calendar")} className="section-link" onClick={closeAccount}>
              دیدن زمان‌های آزاد
            </Link>
          </p>
        ) : null}
        <ul className="account-reservations">
          {reservations.map((r) => (
            <li key={r.id} className="account-res">
              <div className="account-res__head">
                <strong>{r.unit_title}</strong>
                <span className="status-chip" data-status={r.is_active ? "free" : "past"}>
                  {r.status_label}
                </span>
              </div>
              <p>
                {r.weekday} <bdi>{r.date_jalali}</bdi> · {r.duration_label} · {faDigits(r.guests_count)} نفر
              </p>
              <p className="account-res__meta">
                کد پیگیری{" "}
                <bdi className="latin" dir="ltr">
                  {r.code}
                </bdi>
                {r.can_cancel ? <> · لغو رایگان تا {formatMoment(r.free_cancel_until)}</> : null}
              </p>
              <Link className="account-res__open" href={reservationHref(r.code)} onClick={closeAccount}>
                <Icon name="certificate" size={16} /> گواهی، تقویم و لغو
                <Icon name="chevron-left" size={16} />
              </Link>
            </li>
          ))}
        </ul>
        {portal ? (
          <Link className="account-portal" href={portal} onClick={closeAccount}>
            <Icon name="user" size={18} />
            <span>
              <strong>پرتال زائر</strong>
              <small>گواهی، هماهنگی ورود، صف انتظار، سابقهٔ سفرها و امنیت حساب</small>
            </span>
            <Icon name="chevron-left" size={16} />
          </Link>
        ) : null}
      </section>

      <div className="account-actions account-actions--split">
        <button type="button" className="btn btn-secondary" onClick={() => onLogout(false)} disabled={busy}>
          <Icon name="log-out" size={18} /> خروج از حساب
        </button>
        {confirmAll ? (
          <button
            type="button"
            className="btn btn-ghost account-danger"
            onClick={() => onLogout(true)}
            disabled={busy}
            autoFocus
          >
            مطمئنم؛ از همهٔ دستگاه‌ها خارج شو
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmAll(true)} disabled={busy}>
            خروج از همهٔ دستگاه‌ها
          </button>
        )}
      </div>
    </div>
  );
}

function StandingCard({ standing, pending }: { standing: Standing | undefined; pending: boolean }) {
  if (pending) return <div className="skeleton skeleton--block" aria-hidden="true" />;
  if (!standing) return null;
  /** سهمیهٔ نیم‌روزی ⇒ «چقدر مانده» (مفیدتر از «۰ از ۷»)؛ رزرو فعال ⇒ شمارش ساده. */
  const left = (remaining: number) => (remaining <= 0 ? "سهمیه پر است" : `${durationLabel(remaining)} مانده`);
  const rows = [
    {
      label: "رزرو فعال",
      used: standing.active.used,
      limit: standing.active.limit,
      text: `${faDigits(standing.active.used)} از ${faDigits(standing.active.limit)}`,
    },
    {
      label: `در ${faDigits(standing.window.window_days ?? 0)} روز اخیر`,
      used: standing.window.used,
      limit: standing.window.limit,
      text: left(standing.window.remaining),
    },
    {
      label: "در یک سال اخیر",
      used: standing.year.used,
      limit: standing.year.limit,
      text: left(standing.year.remaining),
    },
  ];
  return (
    <section className="account-section" aria-labelledby="acc-standing">
      <h3 id="acc-standing">
        سهمیهٔ شما
        <span className={cx("status-chip")} data-status={standing.can_book ? "free" : "occupied"}>
          {standing.can_book ? "امکان رزرو دارید" : "فعلاً امکان رزرو نیست"}
        </span>
      </h3>
      <ul className="quota-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span>{r.label}</span>
            <meter min={0} max={Math.max(1, r.limit)} value={r.used} aria-label={`${r.label}: ${r.text}`} />
            <span className="quota-list__val">{r.text}</span>
          </li>
        ))}
      </ul>
      {standing.blockers.length ? (
        <ul className="account-blockers">
          {standing.blockers.map((b) => (
            <li key={b.code}>
              <Icon name="info" size={16} /> {b.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
