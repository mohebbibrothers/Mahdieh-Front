"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useAvailability } from "@/features/booking-draft/use-availability";
import { openAccount } from "@/features/session/account-store";
import { ProfileForm } from "@/features/session/ProfileForm";
import { SignInForm, type SignInStep } from "@/features/session/SignInForm";
import { logout } from "@/shared/api/auth";
import { readPolicies, type Policies } from "@/shared/api/policies";
import { configQuery, propertyQuery, qk, reservationsQuery, sessionQuery, standingQuery } from "@/shared/api/queries";
import type { Reservation, SessionState } from "@/shared/api/schemas";
import { destHref, reservationHref } from "@/shared/config/destinations";
import { faCount } from "@/shared/lib/fa";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { DEFAULT_LATTICE, stayRange, type Lattice } from "./model";
import { BookingHero, BookingSteps, StayRibbon, StepCard, rangeLabel, spanLabel, type RibbonData } from "./parts";
import { ReservationView, freshCodes } from "./ReservationView";
import { StepDetails } from "./StepDetails";
import { setSearch, useSearch } from "./use-search";

const GUEST: SessionState = { authenticated: false, profile: null, mfa_pending: false };

function readLattice(raw: Record<string, number> | undefined): Lattice {
  return {
    cellHours: raw?.cell_hours ?? DEFAULT_LATTICE.cellHours,
    gridStartHour: raw?.grid_start_hour ?? DEFAULT_LATTICE.gridStartHour,
  };
}

/* ── گام‌های ۱ تا ۳ (پیش از ثبت) ──────────────────────────────────────────── */
function CheckoutStage({ unitCode, policies, lattice }: { unitCode: string; policies: Policies; lattice: Lattice }) {
  const qc = useQueryClient();
  const session = useQuery(sessionQuery);
  const property = useQuery(propertyQuery);
  const config = useQuery(configQuery);
  const { draft } = useAvailability();
  const [editing, setEditing] = useState(false);
  const [signInStep, setSignInStep] = useState<SignInStep>("phone");
  const otpLength = config.data?.auth.otp_length ?? 5;

  const profile = session.data?.profile ?? null;
  const floor = property.data?.find((f) => f.units.some((x) => x.code === unitCode));
  const unitInfo = floor?.units.find((x) => x.code === unitCode);
  const found = floor && unitInfo ? { unit: unitInfo, floor } : null;

  const range = draft.day ? stayRange({ day: draft.day, period: draft.period, cells: draft.cells }, lattice) : null;
  // کلید هم‌توانی و کلید کش استعلام هر دو از «مقدار» این شیء ساخته می‌شوند، نه از هویتش.
  const payload = range
    ? { unit_code: unitCode, start: range.start, end: range.end, guests_count: draft.guests }
    : null;
  const step: 1 | 2 | 3 | null = session.isPending
    ? null
    : !profile
      ? 1
      : !profile.is_profile_complete || editing
        ? 2
        : 3;

  const ribbon: RibbonData | null = found
    ? {
        unitIcon: found.unit.unit_type === "suite" ? "suite" : "room",
        unitCode: found.unit.code,
        unitTitle: found.unit.title,
        unitMeta: `${found.floor.title} · ${found.unit.type_label}`,
        range: range ? rangeLabel(range.start, range.end) : null,
        span: spanLabel(draft.cells),
        guests: draft.guests,
        capacity: found.unit.capacity_total,
      }
    : null;
  // «ویرایش»: بازگشت به تقویم P-04 با همان انتخاب (کشوی خلاصه باز)؛ تا پیش از انتشار تقویم، جست‌وجوی خانه
  const editParams = {
    ...(draft.day ? { day: draft.day } : {}),
    period: draft.period,
    cells: String(draft.cells),
    guests: String(draft.guests),
  };
  const editHref =
    (found && draft.day
      ? destHref("calendarFull", { from: draft.day, pick: found.unit.code, ...editParams })
      : destHref("calendarFull", draft.guests ? { guests: String(draft.guests) } : {})) ??
    (`/?${new URLSearchParams(editParams).toString()}#quick-search` as Route);

  const signOutAndRestart = async () => {
    try {
      await logout();
    } catch {
      /* نشست سمت سرور هم اگر مانده باشد با ورود تازه جایگزین می‌شود */
    }
    qc.setQueryData<SessionState>(qk.session, GUEST);
    qc.removeQueries({ queryKey: ["me"] });
    setSignInStep("phone");
  };

  const onCreated = (r: Reservation) => {
    freshCodes.add(r.code);
    toast(
      r.status === "hold" ? "درخواست ثبت شد؛ در انتظار تأیید پذیرش." : "رزرو قطعی شد؛ گواهی اقامت صادر شد.",
      "success",
    );
    setSearch({ code: r.code, unit: null, day: null, period: null, cells: null, guests: null });
    requestAnimationFrame(() =>
      document.querySelector(".booking-stage")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  if (property.data && !found) {
    return (
      <>
        <BookingSteps current={null} />
        <StepCard
          step={null}
          title="این واحد پیدا نشد"
          lead="ممکن است نشانی ناقص باشد یا واحد موقتاً از چرخهٔ رزرو خارج شده باشد."
        >
          <div className="empty-actions">
            <Link className="btn btn-primary btn-lg" href={destHref("units")}>
              <Icon name="building" size={18} /> دیدن واحدهای اقامتی
            </Link>
          </div>
        </StepCard>
      </>
    );
  }

  return (
    <>
      <StayRibbon
        data={ribbon}
        pending={!ribbon}
        edit={
          <Link className="ribbon-edit" href={editHref}>
            <Icon name="pencil" size={16} /> تغییر انتخاب
          </Link>
        }
      />
      <BookingSteps current={step} />

      {step === null ? (
        <StepCard step={null} title="در حال آماده‌سازی…">
          <div className="skeleton skeleton--block" aria-hidden="true" />
        </StepCard>
      ) : step === 1 ? (
        <StepCard
          step={1}
          focusKey={`1-${signInStep}`}
          title={signInStep === "phone" ? "ورود با شمارهٔ تلفن همراه" : "تأیید کد پیامک‌شده"}
          lead={
            signInStep === "phone"
              ? `کد ورود ${faCount(otpLength)} رقمی به‌صورت پیامک برای شما ارسال می‌شود. نیاز به ساخت گذرواژه نیست.`
              : "کد را وارد کنید؛ پس از تأیید مستقیماً به گام بعد می‌روید و انتخاب شما محفوظ می‌ماند."
          }
        >
          <SignInForm
            variant="page"
            phoneLabel="شمارهٔ تلفن همراه زائر اصلی"
            submitLabel="دریافت کد یک‌بارمصرف با پیامک"
            onStepChange={setSignInStep}
            onVerified={(res) => {
              const name = res.profile.first_name || "زائر گرامی";
              toast(
                res.is_new_user ? "حساب شما ساخته شد؛ مشخصات سجلی را کامل کنید." : `${name}، خوش برگشتید.`,
                "success",
              );
            }}
          />
        </StepCard>
      ) : step === 2 && profile ? (
        <StepCard
          step={2}
          focusKey={`2-${editing}`}
          title="مشخصات سجلی و هویتی سرپرست زائران"
          lead="اطلاعات سجلی جهت ثبت رسمی در دفتر پذیرش مهدیه و رعایت ضوابط اقامت وقفی الزامی است. این اطلاعات نزد موقوفه امانت و محفوظ است."
        >
          <div className="account-flow account-flow--page">
            <ProfileForm
              variant="page"
              profile={profile}
              lead={null}
              submitLabel="ثبت مشخصات و بررسی سهمیه"
              skipLabel={editing ? "انصراف از ویرایش" : "بازگشت به گام ورود"}
              onSkip={editing ? () => setEditing(false) : () => void signOutAndRestart()}
              onDone={(p) => {
                qc.setQueryData<SessionState>(qk.session, (s) => ({
                  ...(s ?? GUEST),
                  authenticated: true,
                  profile: p,
                }));
                void qc.invalidateQueries({ queryKey: ["me"] });
                setEditing(false);
                toast("مشخصات سجلی ثبت شد.", "success");
              }}
            />
          </div>
        </StepCard>
      ) : profile && payload ? (
        <StepCard
          step={3}
          focusKey="3"
          title="بررسی اهلیت رزرو و جزئیات سفر زیارتی"
          lead="استعلام برخط سهمیهٔ زائر و تکمیل نیازمندی‌های پذیرش در موقوفهٔ مهدیه."
        >
          <StepDetails
            payload={payload}
            profile={profile}
            lattice={lattice}
            policies={policies}
            onEditProfile={() => setEditing(true)}
            onCreated={onCreated}
            onProfileRequired={() => {
              void qc.invalidateQueries({ queryKey: qk.session });
              setEditing(true);
            }}
            onSignedOut={() => {
              qc.setQueryData<SessionState>(qk.session, GUEST);
              toast("نشست شما به پایان رسیده بود؛ دوباره وارد شوید — انتخابتان محفوظ است.", "warn");
            }}
          />
        </StepCard>
      ) : (
        <StepCard step={3} title="در حال آماده‌سازی…">
          <div className="skeleton skeleton--block" aria-hidden="true" />
        </StepCard>
      )}
    </>
  );
}

/* ── بی‌انتخاب: «از کجا شروع کنم» + رزروهای پیش‌رو ───────────────────────── */
function BookingEmpty() {
  const session = useQuery(sessionQuery);
  const signedIn = Boolean(session.data?.profile);
  const upcoming = useQuery({ ...reservationsQuery("upcoming"), enabled: signedIn });
  const standing = useQuery({ ...standingQuery, enabled: signedIn });
  // فعال‌ها نخست؛ لغوشده‌های پیش رو کم‌رنگ و پس از آن‌ها (برای دسترسی به سابقه و «رزرو تازه»).
  const list = [...(upcoming.data?.results ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active));
  const anyActive = list.some((r) => r.is_active);
  // رزرو فعال خودش دلیل «سقف رزرو فعال» است و در فهرست دیده می‌شود؛ بازدارنده فقط وقتی فهرست خالی است.
  const blocker = !list.length && standing.data && !standing.data.can_book ? standing.data.blockers[0] : undefined;
  return (
    <>
      <BookingSteps current={null} />
      <StepCard
        step={null}
        title={
          anyActive ? "رزروهای پیش‌روی شما" : list.length ? "رزروهای اخیر شما" : "نخست زمان اقامت و واحد را انتخاب کنید"
        }
        lead={
          list.length
            ? "برای دیدن گواهی، افزودن به تقویم یا لغو، رزرو را باز کنید."
            : "صدور رزرو از روی یک انتخاب مشخص انجام می‌شود: تاریخ و نیم‌روز ورود، مدت اقامت، تعداد زائران و واحد."
        }
      >
        {list.length ? (
          <ul className="res-list">
            {list.map((r) => (
              <li key={r.code}>
                <Link className="res-card" href={reservationHref(r.code)} data-active={r.is_active || undefined}>
                  <span className="res-card__icon" aria-hidden="true">
                    <Icon name="ticket" size={22} />
                  </span>
                  <span className="res-card__body">
                    <strong>
                      <bdi className="latin">{r.unit_code}</bdi> — {r.unit_title}
                    </strong>
                    <span>{rangeLabel(r.start, r.end)}</span>
                  </span>
                  <span className="res-card__status" data-status={r.status}>
                    {r.status_label}
                  </span>
                  <bdi className="res-card__code" dir="ltr">
                    {r.code}
                  </bdi>
                  <Icon name="chevron-left" size={18} className="res-card__go" />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {blocker ? (
          <div className="verdict verdict--warn" role="status">
            <Icon name="info" size={18} />
            <div className="verdict__body">
              <strong>{standing.data?.profile_complete ? "فعلاً امکان رزرو تازه ندارید" : "یک قدم تا رزرو"}</strong>
              <span>{blocker.message}</span>
            </div>
            {standing.data?.profile_complete ? null : (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => openAccount()}>
                تکمیل مشخصات
              </button>
            )}
          </div>
        ) : null}
        {session.isSuccess && !signedIn ? (
          <p className="empty-signin">
            <Icon name="user" size={18} />
            <span>رزرو پیشین دارید؟ با شمارهٔ همراه وارد شوید تا رزروها و گواهی‌هایتان این‌جا فهرست شوند.</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openAccount({ reason: "برای دیدن رزروهایتان با شمارهٔ همراه وارد شوید." })}
            >
              ورود
            </button>
          </p>
        ) : null}
        <div className="empty-actions">
          <Link className="btn btn-primary btn-lg" href={"/#quick-search" as Route}>
            <Icon name="search" size={18} /> انتخاب زمان اقامت
          </Link>
          <Link className="btn btn-secondary btn-lg" href={destHref("calendar")}>
            <Icon name="calendar" size={18} /> تقویم زمان‌های آزاد
          </Link>
          <Link className="btn btn-secondary btn-lg" href={destHref("units")}>
            <Icon name="building" size={18} /> واحدهای اقامتی
          </Link>
        </div>
      </StepCard>
    </>
  );
}

/* ── ورودی صفحه ─────────────────────────────────────────────────────────── */
export function BookingFlow() {
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const lattice = readLattice(config.data?.lattice);

  return (
    <>
      <BookingHero freeCancelHours={policies.cancelFreeHours} />
      <div className="booking-stage page-shell" id="booking-stage">
        {/* useSearchParams در خروجی ایستا مرز Suspense می‌خواهد؛ اسکلت همان حالت پیش از هیدراته شدن است */}
        <Suspense fallback={<StageSkeleton />}>
          <BookingStage policies={policies} lattice={lattice} />
        </Suspense>
      </div>
    </>
  );
}

function StageSkeleton() {
  return (
    <>
      <StayRibbon data={null} pending />
      <BookingSteps current={null} />
      <StepCard step={null} title="در حال آماده‌سازی…">
        <div className="skeleton skeleton--block" aria-hidden="true" />
      </StepCard>
    </>
  );
}

/**
 * نمای صفحه از نشانی: ‎code‎ ⇒ رزرو صادرشده، ‎unit‎ ⇒ گام‌های ۱ تا ۳، هیچ ⇒ فهرست/میان‌بُرها.
 * هر جابه‌جایی درون‌صفحه‌ای (کارت رزرو، منوی بالا، بازگشت مرورگر) نمای تازه را با حرکت ورود
 * می‌سازد و اگر آغاز آن بالای دید باشد، نرم تا همان‌جا می‌رود.
 */
function BookingStage({ policies, lattice }: { policies: Policies; lattice: Lattice }) {
  const hydrated = useHydrated();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const code = params.get("code");
  const unit = params.get("unit");
  const view = !hydrated ? "boot" : code ? `code:${code}` : unit ? `unit:${unit}` : "empty";

  const previous = useRef<string | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = view;
    if (before === null || before === "boot" || before === view) return;
    const stage = document.getElementById("booking-stage");
    if (!stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const top = stage.getBoundingClientRect().top;
    // آغاز نمای تازه بیرون از دید (بالا یا پایین‌تر از نیمهٔ صفحه) ⇒ رفتن نرم به آن
    if (top < header || top > window.innerHeight * 0.55) {
      stage.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, [view]);

  if (!hydrated) return <StageSkeleton />;
  return (
    <div key={view} className="booking-stage__view">
      {code ? (
        <ReservationView code={code} policies={policies} />
      ) : unit ? (
        <CheckoutStage unitCode={unit} policies={policies} lattice={lattice} />
      ) : (
        <BookingEmpty />
      )}
    </div>
  );
}
