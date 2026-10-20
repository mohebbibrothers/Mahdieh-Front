"use client";
import { useQuery } from "@tanstack/react-query";
import { AccountTrigger } from "@/features/session/AccountButton";
import { useSyncExternalStore } from "react";
import { meQuery, occasionsQuery, reservationsQuery, standingQuery } from "@/shared/api/queries";
import { addDays, formatDayLabel, formatMoment, tehranToday } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";

/** اتصال قطع ⇒ اطلاع محترمانه؛ دادهٔ آخر (کش TanStack Query) نمایش می‌ماند. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    (l) => {
      window.addEventListener("online", l);
      window.addEventListener("offline", l);
      return () => {
        window.removeEventListener("online", l);
        window.removeEventListener("offline", l);
      };
    },
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div className="status-banner" role="status">
      <Icon name="wifi-off" size={18} />
      <span>اتصال اینترنت قطع است؛ آخرین وضعیت دریافت‌شده را می‌بینید. ثبت رزرو پس از وصل‌شدن ممکن است.</span>
    </div>
  );
}

/** سفر پیش رو (واردشده) و موانع رزرو (پروفایل ناقص، خنک‌شدن، محرومیت، سهمیه). */
export function AccountBanners() {
  const me = useQuery(meQuery);
  const signedIn = Boolean(me.data);
  const upcoming = useQuery({ ...reservationsQuery("upcoming"), enabled: signedIn });
  const standing = useQuery({ ...standingQuery, enabled: signedIn });
  const next = upcoming.data?.results.find((r) => r.is_active);

  if (!signedIn) return null;
  if (next) {
    return (
      <aside className="page-shell trip-banner" aria-label="سفر پیش رو">
        <div className="trip-banner__copy">
          <span className="trip-banner__icon">
            <Icon name="calendar-check" size={22} />
          </span>
          <div>
            <strong>سفر بعدی شما به مهدیه</strong>
            <p>
              {formatMoment(next.start)} · {next.unit_title} · <bdi className="latin">{next.code}</bdi>
              {next.status_label ? <span className="pill">{next.status_label}</span> : null}
            </p>
          </div>
        </div>
        <AccountTrigger className="btn btn-secondary">
          جزئیات رزرو
          <Icon name="arrow-left" size={18} />
        </AccountTrigger>
      </aside>
    );
  }
  const blocker = standing.data && !standing.data.can_book ? standing.data.blockers[0] : undefined;
  if (blocker) {
    return (
      <aside className="page-shell trip-banner" data-tone="warn" aria-label="وضعیت رزرو شما">
        <div className="trip-banner__copy">
          <span className="trip-banner__icon">
            <Icon name="info" size={22} />
          </span>
          <div>
            <strong>{standing.data?.profile_complete ? "فعلاً امکان رزرو تازه ندارید" : "یک قدم تا رزرو"}</strong>
            <p>{blocker.message}</p>
          </div>
        </div>
        <AccountTrigger className="btn btn-secondary">
          {standing.data?.profile_complete ? "مشاهدهٔ وضعیت" : "تکمیل اطلاعات"}
          <Icon name="arrow-left" size={18} />
        </AccountTrigger>
      </aside>
    );
  }
  return null;
}

/** مناسبت پیش رو در ۱۴ روز آینده — فقط وقتی دادهٔ واقعی هست. */
export function OccasionBanner() {
  const today = tehranToday();
  const occasions = useQuery(occasionsQuery(today, addDays(today, 14)));
  const next = occasions.data
    ?.filter((o) => o.date_gregorian >= today)
    .sort((a, b) => Number(b.is_peak) - Number(a.is_peak) || a.date_gregorian.localeCompare(b.date_gregorian))[0];
  if (!next) return null;
  const busy = next.is_peak || next.demand_level === "high" || next.demand_level === "peak";
  return (
    <aside className="page-shell occasion-banner" aria-label="مناسبت پیش رو">
      <span className="occasion-banner__icon">
        <Icon name="calendar" size={22} />
      </span>
      <div>
        <strong>
          {next.title} · {formatDayLabel(next.date_gregorian)}
        </strong>
        <p>
          {next.description ||
            (busy
              ? "ایام پرتردد است؛ زمان‌های آزاد زودتر پر می‌شوند. پیش از برنامه‌ریزی سفر، تقویم را ببینید."
              : "پیش از برنامه‌ریزی سفر، زمان‌های آزاد این روزها را ببینید.")}
        </p>
      </div>
      <a href="#availability" className="text-link">
        بررسی زمان‌ها <Icon name="arrow-left" size={16} />
      </a>
    </aside>
  );
}
