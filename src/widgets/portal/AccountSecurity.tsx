"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProfileForm } from "@/features/session/ProfileForm";
import { logout } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { myIcsHref, revokeSession, sessionsQuery } from "@/shared/api/portal";
import { qk } from "@/shared/api/queries";
import type { Profile, SessionItem, SessionState } from "@/shared/api/schemas";
import { faDigits, formatMoment, formatYear, tehranToday } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { deviceKind } from "./model";
import { SectionHead } from "./parts";

const GUEST: SessionState = { authenticated: false, profile: null, mfa_pending: false };

/** حساب و امنیت — مشخصات سجلی، دستگاه‌های واردشده (لغو نشست) و اشتراک تقویم همهٔ سفرها. */
export function AccountSecurity({ profile }: { profile: Profile }) {
  const [editOpen, setEditOpen] = useState(false);
  const qc = useQueryClient();
  return (
    <section className="pt-section" aria-labelledby="pt-acc-title" id="account">
      <SectionHead
        id="pt-acc-title"
        icon="shield-check"
        title="حساب، مشخصات و امنیت ورود"
        aside="محرمانه نزد موقوفهٔ مهدیه"
      />
      <div className="pt-acc">
        <article className="pt-card pt-profile">
          <header className="pt-card__head">
            <h3>
              <Icon name="id-card" size={18} /> مشخصات سرپرست زائران
            </h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}>
              <Icon name="pencil" size={14} /> {profile.is_profile_complete ? "ویرایش" : "تکمیل مشخصات"}
            </button>
          </header>
          <dl className="pt-kv">
            <div>
              <dt>نام و نام خانوادگی</dt>
              <dd>{profile.display_name || "—"}</dd>
            </div>
            <div>
              <dt>تلفن همراه</dt>
              <dd>
                <bdi dir="ltr">{faDigits(profile.phone_masked)}</bdi>
              </dd>
            </div>
            <div>
              <dt>{profile.id_document_type === "passport" ? "شمارهٔ گذرنامه" : "کد ملی"}</dt>
              <dd>
                <bdi dir="ltr">{faDigits(profile.national_id_masked || "—")}</bdi>
              </dd>
            </div>
            <div>
              <dt>تابعیت</dt>
              <dd>{profile.nationality_title || "—"}</dd>
            </div>
            <div>
              <dt>استان و شهر مبدأ</dt>
              <dd>{[profile.province_title, profile.city].filter(Boolean).join("، ") || "—"}</dd>
            </div>
            <div>
              <dt>عضویت از</dt>
              <dd>{formatYear(tehranToday(new Date(profile.date_joined)))}</dd>
            </div>
          </dl>
          {!profile.is_profile_complete ? (
            <p className="pt-card__warn">
              <Icon name="info" size={14} /> برای رزرو تازه، تکمیل مشخصات سجلی لازم است.
            </p>
          ) : null}
          <a className="pt-ics" href={myIcsHref} download="mahdieh-trips.ics">
            <Icon name="calendar-plus" size={18} />
            <span>
              <strong>تقویم همهٔ سفرهای پیش‌رو</strong>
              <small>یک فایل ICS برای گوشی یا رایانه؛ شامل همهٔ رزروهای فعال شما</small>
            </span>
            <Icon name="arrow-left" size={16} />
          </a>
        </article>
        <Sessions />
      </div>
      <AppDialog
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        title="مشخصات سرپرست زائران"
        subtitle="اطلاعات سجلی برای ثبت رسمی در دفتر پذیرش مهدیه."
        size="sm"
      >
        {editOpen ? (
          <div className="account-flow">
            <ProfileForm
              profile={profile}
              submitLabel="ثبت مشخصات"
              skipLabel="انصراف"
              onSkip={() => setEditOpen(false)}
              onDone={(p) => {
                qc.setQueryData<SessionState>(qk.session, (s) => ({
                  ...(s ?? GUEST),
                  authenticated: true,
                  profile: p,
                }));
                void qc.invalidateQueries({ queryKey: ["me"] });
                setEditOpen(false);
                toast("مشخصات سجلی ثبت شد.", "success");
              }}
            />
          </div>
        ) : null}
      </AppDialog>
    </section>
  );
}

function Sessions() {
  const qc = useQueryClient();
  const list = useQuery(sessionsQuery);
  const [confirmAll, setConfirmAll] = useState(false);
  const revoke = useMutation({
    mutationFn: (s: SessionItem) => revokeSession(s.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me", "sessions"] });
      toast("دسترسی آن دستگاه قطع شد.", "success");
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "قطع دسترسی ممکن نشد.", "warn"),
  });
  const all = useMutation({
    mutationFn: () => logout(true),
    onSuccess: () => {
      qc.setQueryData<SessionState>(qk.session, GUEST);
      qc.removeQueries({ queryKey: ["me"] });
      toast("از همهٔ دستگاه‌ها خارج شدید.", "success");
      setConfirmAll(false);
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "خروج ممکن نشد؛ دوباره تلاش کنید.", "warn"),
  });
  const items = [...(list.data?.results ?? [])].sort((a, b) => Number(b.is_current) - Number(a.is_current));

  return (
    <article className="pt-card pt-sessions">
      <header className="pt-card__head">
        <h3>
          <Icon name="lock" size={18} /> دستگاه‌های واردشده
        </h3>
        {items.length ? <span className="pt-count">{faDigits(items.length)}</span> : null}
      </header>
      {list.isPending ? (
        <div className="skeleton pt-past-skel" aria-hidden="true" />
      ) : list.error ? (
        <p className="pt-soft">فهرست دستگاه‌ها بارگذاری نشد.</p>
      ) : (
        <ul className="pt-devices">
          {items.map((s) => (
            <li key={s.id} data-current={s.is_current || undefined}>
              <span className="pt-devices__icon" aria-hidden="true">
                <Icon name={deviceKind(s.device)} size={20} />
              </span>
              <span className="pt-devices__body">
                <strong>
                  <bdi dir="ltr">{s.device || "دستگاه ناشناخته"}</bdi>
                  {s.is_current ? <em>همین دستگاه</em> : null}
                </strong>
                <small>
                  {s.network ? (
                    <>
                      شبکهٔ <bdi dir="ltr">{s.network}</bdi> ·{" "}
                    </>
                  ) : null}
                  آخرین فعالیت {formatMoment(s.last_seen_at)}
                </small>
              </span>
              {s.is_current ? null : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm pt-devices__revoke"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(s)}
                  aria-label={`خروج دستگاه ${s.device}`}
                >
                  <Icon name="log-out" size={16} /> خروج
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="pt-card__hint">
        <Icon name="info" size={14} /> دستگاهی را نمی‌شناسید؟ آن را خارج کنید؛ ورود دوباره فقط با کد پیامک به شمارهٔ شما
        ممکن است.
      </p>
      <button type="button" className="btn btn-danger-outline btn-block" onClick={() => setConfirmAll(true)}>
        <Icon name="log-out" size={18} /> خروج از همهٔ دستگاه‌ها
      </button>
      <AppDialog
        isOpen={confirmAll}
        onOpenChange={setConfirmAll}
        title="خروج از همهٔ دستگاه‌ها؟"
        subtitle="همهٔ نشست‌ها، از جمله همین مرورگر، بسته می‌شوند."
        size="sm"
        actions={
          <>
            <button
              type="button"
              className="btn btn-danger"
              disabled={all.isPending}
              aria-busy={all.isPending}
              onClick={() => all.mutate()}
            >
              بله، خروج از همه
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmAll(false)}>
              انصراف
            </button>
          </>
        }
      >
        <p className="pt-dialog-text">رزروها و گواهی‌های شما محفوظ می‌مانند و با ورود دوباره در دسترس‌اند.</p>
      </AppDialog>
    </article>
  );
}
