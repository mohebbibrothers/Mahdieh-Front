"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { resetCsrf } from "@/shared/api/client";
import { logout, meQuery, qk, reservationsQuery, standingQuery } from "@/shared/api/queries";
import type { Profile, SessionState } from "@/shared/api/schemas";
import { navHref } from "@/shared/config/site";
import { durationLabel, faDigits, formatMoment } from "@/shared/lib/fa";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { PageLink } from "@/shared/ui/PageLink";
import { Popover } from "@/shared/ui/Popover";
import { toast } from "@/shared/ui/toast";
import { openLogin } from "./auth-store";

const GUEST: SessionState = { authenticated: false, profile: null, mfa_pending: false };

/** سهمیه‌ها به «نیم‌روز» (سلول ۱۲ ساعته) شمرده می‌شوند ⇒ نمایش به زبان روز. */
const left = (cells: number) => (cells > 0 ? `${durationLabel(cells)} باقی` : "تمام شده");

export function displayName(p: Profile): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.display_name || "زائر مهدیه";
}

/** خروج: نشست سرور، توکن CSRF و دادهٔ شخصیِ کش‌شده همه پاک می‌شوند. */
export function useSignOut() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await logout();
      resetCsrf();
      qc.removeQueries({ queryKey: ["me"] });
      qc.setQueryData(qk.session, GUEST);
      toast("از حساب خارج شدید.", "success");
    } catch {
      toast("خروج انجام نشد؛ دوباره تلاش کنید.", "warn");
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}

/**
 * گوشهٔ چپ سربرگ (جای مورد انتظار کاربر فارسی‌زبان): مهمان ⇒ «ورود / ثبت‌نام» که پنجرهٔ ورود
 * را همین‌جا باز می‌کند؛ واردشده ⇒ نشان حساب با منوی حساب. در عرض‌های کوچک دکمهٔ دایره‌ای
 * هم‌اندازهٔ سه دکمهٔ دیگر می‌شود (CSS). پیش‌فرض ایستا = مهمان (بدون پرش چیدمان).
 */
export function AccountButton() {
  const me = useQuery(meQuery);
  const user = me.data;
  if (!user) {
    return (
      <button
        type="button"
        className="account-button"
        data-state="out"
        aria-haspopup="dialog"
        aria-label="ورود / ثبت‌نام با شمارهٔ همراه"
        onClick={() => openLogin("account")}
      >
        <Icon name="user" size={18} />
        <span className="account-button__text" aria-hidden="true">
          <span className="account-button__full">ورود / ثبت‌نام</span>
          <span className="account-button__short">ورود</span>
        </span>
      </button>
    );
  }
  const name = displayName(user);
  return (
    <Popover
      anchor="account"
      label="حساب کاربری"
      className="account-popover"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className={cx("account-button", p.className)}
          data-state="in"
          aria-label={`حساب ${name}`}
        >
          <span className="account-button__avatar" aria-hidden="true">
            {name.slice(0, 1)}
            {user.is_profile_complete ? null : <i className="account-button__dot" />}
          </span>
          <span className="account-button__text" aria-hidden="true">
            <span className="account-button__full">{user.first_name || "حساب من"}</span>
            <span className="account-button__short">حساب</span>
          </span>
          <Icon name="chevron-down" size={16} className="account-button__chev" />
        </button>
      )}
    >
      {(close) => <AccountPanel user={user} onDone={close} />}
    </Popover>
  );
}

/** منوی حساب — همان محتوا در پاپ‌اور سربرگ و برگهٔ پایینی موبایل. */
export function AccountPanel({ user, onDone }: { user: Profile; onDone: () => void }) {
  const upcoming = useQuery(reservationsQuery("upcoming"));
  const standing = useQuery(standingQuery);
  const signOut = useSignOut();
  const next = upcoming.data?.results.find((r) => r.is_active);
  const s = standing.data;
  const name = displayName(user);

  return (
    <div className="account-panel">
      <div className="account-panel__head">
        <span className="account-panel__avatar" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <div>
          <strong>{name}</strong>
          <bdi className="latin account-panel__phone" dir="ltr">
            {user.phone_masked}
          </bdi>
        </div>
        {user.is_staff_member ? <span className="pill">کارکنان</span> : null}
      </div>

      {user.is_profile_complete ? null : (
        <div className="account-panel__alert" role="status">
          <Icon name="info" size={18} />
          <p>
            <strong>یک قدم تا رزرو</strong>
            <span>برای ثبت رزرو، مشخصات زائر (نام و مدرک هویتی) باید تکمیل شود.</span>
          </p>
        </div>
      )}

      <section className="account-panel__trip" aria-label="سفر پیش رو">
        {upcoming.isPending ? (
          <span className="skeleton skeleton--line" aria-hidden="true" />
        ) : next ? (
          <>
            <span className="account-panel__trip-icon">
              <Icon name="calendar-check" size={20} />
            </span>
            <p>
              <strong>سفر بعدی: {formatMoment(next.start)}</strong>
              <span>
                {next.unit_title} · <bdi className="latin">{next.code}</bdi>
                {next.status_label ? <span className="pill">{next.status_label}</span> : null}
              </span>
            </p>
          </>
        ) : (
          <>
            <span className="account-panel__trip-icon">
              <Icon name="calendar" size={20} />
            </span>
            <p>
              <strong>رزرو فعالی ندارید</strong>
              <span>زمان دلخواه را از جست‌وجوی بالای صفحه انتخاب کنید.</span>
            </p>
          </>
        )}
      </section>

      {s ? (
        <dl className="account-panel__quota">
          <div>
            <dt>رزرو فعال</dt>
            <dd>
              {faDigits(s.active.used)} از {faDigits(s.active.limit)}
            </dd>
          </div>
          <div>
            <dt>{s.window.window_days ? `در ${faDigits(s.window.window_days)} روز اخیر` : "دوره"}</dt>
            <dd>{left(s.window.remaining)}</dd>
          </div>
          <div>
            <dt>امسال</dt>
            <dd>{left(s.year.remaining)}</dd>
          </div>
        </dl>
      ) : null}

      <nav className="account-panel__links" aria-label="حساب">
        {next ? null : (
          <a href={`${navHref("home")}#quick-search`} onClick={onDone}>
            <Icon name="calendar" size={18} /> <span>انتخاب زمان اقامت</span>
            <Icon name="arrow-left" size={16} className="account-panel__chev" />
          </a>
        )}
        <PageLink page="portal" className="account-panel__link">
          <Icon name="ticket" size={18} /> <span>رزروها، گواهی و پیگیری</span>
          <Icon name="arrow-left" size={16} className="account-panel__chev" />
        </PageLink>
        {user.is_profile_complete ? null : (
          <PageLink page="booking" className="account-panel__link">
            <Icon name="edit" size={18} /> <span>تکمیل مشخصات زائر</span>
            <Icon name="arrow-left" size={16} className="account-panel__chev" />
          </PageLink>
        )}
      </nav>

      <button
        type="button"
        className="btn btn-secondary btn-block account-panel__out"
        disabled={signOut.busy}
        onClick={() => {
          void signOut.run().then(onDone);
        }}
      >
        <Icon name="log-out" size={18} /> خروج از حساب
      </button>
    </div>
  );
}
