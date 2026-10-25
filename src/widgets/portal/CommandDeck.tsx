"use client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useId, useState } from "react";
import { openAccount } from "@/features/session/account-store";
import { ApiError } from "@/shared/api/client";
import { reservationQuery } from "@/shared/api/reservations";
import type { Profile, Reservation, Standing } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { faDigits, formatMoment } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { rangeLabel } from "@/widgets/booking/parts";
import { normalizeCode } from "./model";
import { StatusPill } from "./parts";

/** دِک فرمان پرتال (طراح: ‎.portal-command-deck‎) — عنوان، سه کنش اصلی و نوار وضعیت زائر. */
export function CommandDeck({
  profile,
  standing,
  recent,
  onOpenCode,
  children,
}: {
  profile: Profile | null;
  standing: Standing | undefined;
  /** کدهای خود زائر برای انتخاب سریع در استعلام (به‌جای نمونه‌های ساختگی طراح) */
  recent: readonly Reservation[];
  onOpenCode: (code: string) => void;
  children?: React.ReactNode;
}) {
  const [lookupOpen, setLookupOpen] = useState(false);
  return (
    <section className="pt-deck" aria-labelledby="pt-deck-title">
      <header className="pt-deck__head">
        <p className="pt-eyebrow">سامانهٔ جامع پرتال زائر و مدیریت اقامت · مشهد مقدس</p>
        <h1 id="pt-deck-title">
          پرتال زائر؛ <em>پیگیری، گواهی</em> و همراه سفر رضوی.
        </h1>
        <p className="pt-deck__lead">
          مشاهده و مدیریت رزروهای فعال، دریافت گواهی الکترونیک، اعلام ساعت ورود، ثبت پلاک خودرو و سابقهٔ تشرف به بارگاه
          ملکوتی حضرت ثامن‌الحجج (ع).
        </p>
        <div className="pt-deck__actions">
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() =>
              profile
                ? setLookupOpen(true)
                : openAccount({ reason: "برای استعلام رزرو با کد رهگیری، با شمارهٔ همراه صاحب رزرو وارد شوید." })
            }
          >
            <Icon name="search" size={18} /> استعلام سریع با کد رهگیری
          </button>
          <Link className="btn btn-primary btn-lg" href={destHref("calendar")}>
            <Icon name="calendar" size={18} /> تقویم زمان‌های آزاد (رزرو تازه)
          </Link>
          <a className="btn btn-ghost btn-lg" href="#companion">
            <Icon name="compass" size={18} /> راهنمای خدمات و همراه سفر
          </a>
        </div>
      </header>
      {profile ? <StandingBar profile={profile} standing={standing} /> : children}
      {profile ? (
        <LookupDialog
          isOpen={lookupOpen}
          onOpenChange={setLookupOpen}
          recent={recent}
          onOpen={(code) => {
            setLookupOpen(false);
            onOpenCode(code);
          }}
        />
      ) : null}
    </section>
  );
}

function monogram(p: Profile): string {
  const a = p.first_name.trim()[0] ?? "";
  const b = p.last_name.trim()[0] ?? "";
  return a || b ? `${a}${b && a ? "‌" : ""}${b}` : "ز";
}

/** نوار وضعیت زائر: هویت، سه سهمیهٔ زندهٔ سرور و نشان اهلیت رزرو تازه. */
function StandingBar({ profile, standing }: { profile: Profile; standing: Standing | undefined }) {
  const blocker = standing && !standing.can_book ? standing.blockers[0] : undefined;
  return (
    <div className="pt-standing">
      <div className="pt-standing__who">
        <span className="pt-avatar" aria-hidden="true">
          {monogram(profile)}
        </span>
        <p>
          <strong>{profile.display_name || "زائر گرامی"}</strong>
          <span>
            <span>
              {profile.id_document_type === "passport" ? "گذرنامه" : "کد ملی"}:{" "}
              <bdi dir="ltr">{faDigits(profile.national_id_masked || "—")}</bdi>
            </span>
            {profile.city ? <span>شهر مبدأ: {profile.city}</span> : null}
            <span>
              همراه: <bdi dir="ltr">{faDigits(profile.phone_masked)}</bdi>
            </span>
          </span>
        </p>
      </div>
      <div className="pt-standing__quota">
        {standing ? (
          <span className="pt-quotas" role="group" aria-label="سهمیه‌های شما">
            <QuotaDots label="رزرو فعال" used={standing.active.used} limit={standing.active.limit} />
            <QuotaBar
              label={`${faDigits(standing.window.window_days ?? 30)} روزه`}
              used={standing.window.used}
              limit={standing.window.limit}
            />
            <QuotaBar label="سالانه" used={standing.year.used} limit={standing.year.limit} />
          </span>
        ) : (
          <span className="skeleton pt-standing__skel" aria-hidden="true" />
        )}
        {!standing ? null : !profile.is_profile_complete ? (
          <button type="button" className="pt-badge pt-badge--warn" onClick={() => openAccount()}>
            <Icon name="id-card" size={16} /> تکمیل مشخصات سجلی
          </button>
        ) : standing.can_book ? (
          <span className="pt-badge pt-badge--ok">
            <span className="pt-pulse" aria-hidden="true" /> مجاز به رزرو جدید
          </span>
        ) : (
          <span className="pt-badge pt-badge--hold" title={blocker?.message}>
            <Icon name="hourglass" size={16} />
            {standing.suspended_until
              ? `تعلیق تا ${formatMoment(standing.suspended_until)}`
              : standing.cooldown_until
                ? `رزرو تازه از ${formatMoment(standing.cooldown_until)}`
                : standing.active.remaining <= 0
                  ? "سقف رزرو فعال پر است"
                  : "رزرو تازه فعلاً ممکن نیست"}
          </span>
        )}
      </div>
      {blocker && profile.is_profile_complete && standing && standing.active.remaining > 0 ? (
        <p className="pt-standing__why">
          <Icon name="info" size={14} /> {blocker.message}
        </p>
      ) : null}
    </div>
  );
}

function QuotaDots({ label, used, limit }: { label: string; used: number; limit: number }) {
  const n = Math.min(Math.max(limit, 0), 6);
  return (
    <span className="pt-quota" role="img" aria-label={`${label}: ${faDigits(used)} از ${faDigits(limit)}`}>
      <span className="pt-quota__dots" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <i key={i} data-used={i < used || undefined} />
        ))}
      </span>
      <span aria-hidden="true">
        {label}: {faDigits(used)} از {faDigits(limit)}
      </span>
    </span>
  );
}

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const left = Math.max(0, limit - used);
  return (
    <span
      className="pt-quota pt-quota--bar"
      role="meter"
      aria-label={`سهمیهٔ ${label}`}
      title={`سهمیهٔ ${label}: ${faDigits(left)} نیم‌روز باقی‌مانده از ${faDigits(limit)}`}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      aria-valuetext={`${faDigits(left)} نیم‌روز باقی‌مانده از ${faDigits(limit)}`}
    >
      {/* درصد با ویژگی SVG (نه style درون‌خطی ⇒ سازگار با CSP سخت‌گیر) */}
      <svg className="pt-quota__track" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
        <rect className="pt-quota__rail" width="100" height="6" rx="3" />
        <rect className="pt-quota__fill" width={pct} height="6" rx="3" />
      </svg>
      <span aria-hidden="true">
        {label}: <b>{faDigits(left)}</b> از {faDigits(limit)} مانده
      </span>
    </span>
  );
}

/** استعلام سریع با کد رهگیری — فقط رزروهای خود حساب (سرور برای کد دیگران ۴۰۴ می‌دهد). */
function LookupDialog({
  isOpen,
  onOpenChange,
  recent,
  onOpen,
}: {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  recent: readonly Reservation[];
  onOpen: (code: string) => void;
}) {
  const id = useId();
  const qc = useQueryClient();
  const [raw, setRaw] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "found"; r: Reservation }
    | { kind: "missing" }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const lookup = async (value: string) => {
    const code = normalizeCode(value);
    setRaw(code);
    if (code.length < 4) {
      setState({ kind: "error", msg: "کد رهگیری کامل نیست؛ آن را از پیامک یا گواهی رزرو وارد کنید." });
      return;
    }
    setState({ kind: "busy" });
    try {
      const r = await qc.fetchQuery(reservationQuery(code));
      setState({ kind: "found", r });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setState({ kind: "missing" });
      else setState({ kind: "error", msg: e instanceof Error ? e.message : "ارتباط برقرار نشد." });
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setState({ kind: "idle" });
      }}
      title="استعلام سریع رزرو با کد رهگیری"
      subtitle="وضعیت، گواهی و زمان‌بندی اقامت را با کد رهگیری رزرو خود ببینید."
      size="sm"
    >
      <form
        className="pt-lookup"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(raw);
        }}
      >
        <div className="pt-lookup__card">
          <label className="pt-lookup__label" htmlFor={`${id}-code`}>
            <span>کد رهگیری رزرو</span>
            <small>
              قالب: <bdi className="latin">M-1405-0011</bdi>
            </small>
          </label>
          <div className="pt-lookup__input">
            <Icon name="ticket" size={22} />
            <input
              id={`${id}-code`}
              className="latin"
              dir="ltr"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="M-1405-0000"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-invalid={state.kind === "error" || state.kind === "missing" ? true : undefined}
            />
          </div>
          {recent.length ? (
            <div className="pt-lookup__chips" role="group" aria-label="رزروهای خودتان">
              <span>رزروهای شما:</span>
              {recent.slice(0, 4).map((r) => (
                <button key={r.code} type="button" className="pt-lookup__chip" onClick={() => void lookup(r.code)}>
                  <bdi className="latin" dir="ltr">
                    {r.code}
                  </bdi>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {state.kind === "found" ? (
          <div className="pt-lookup__result" role="status">
            <div>
              <strong>
                {state.r.unit_title} (<bdi className="latin">{state.r.unit_code}</bdi>)
              </strong>
              <span>{rangeLabel(state.r.start, state.r.end)}</span>
              <span>{faDigits(state.r.guests_count)} نفر</span>
            </div>
            <StatusPill status={state.r.status} label={state.r.status_label} />
            <button type="button" className="btn btn-primary btn-block" onClick={() => onOpen(state.r.code)}>
              نمایش در پرتال <Icon name="arrow-left" size={18} />
            </button>
          </div>
        ) : null}
        {state.kind === "missing" ? (
          <div className="verdict verdict--warn" role="alert">
            <Icon name="info" size={18} />
            <div className="verdict__body">
              <strong>رزروی با این کد در حساب شما نیست</strong>
              <span>
                هر رزرو فقط در حساب سازندهٔ خودش دیده می‌شود. اگر گواهی چاپی کسی را بررسی می‌کنید، از «استعلام اصالت
                گواهی» استفاده کنید.
              </span>
              <a className="text-link" href="#verify" onClick={() => onOpenChange(false)}>
                استعلام اصالت گواهی اقامت
              </a>
            </div>
          </div>
        ) : null}
        {state.kind === "error" ? (
          <p className="field-error" role="alert">
            {state.msg}
          </p>
        ) : null}

        <div className="account-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={state.kind === "busy"}
            aria-busy={state.kind === "busy"}
          >
            {state.kind === "busy" ? <span className="spinner" aria-hidden="true" /> : <Icon name="search" size={18} />}
            جست‌وجوی رزرو
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>
            بستن
          </button>
        </div>
      </form>
    </AppDialog>
  );
}
