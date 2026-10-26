"use client";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import type { Policies } from "@/shared/api/policies";
import type { FreeWindow, Quote, Standing, UnitDetail } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import {
  durationLabel,
  faDigits,
  formatClock,
  formatDayLabel,
  formatDayMonth,
  formatMoment,
  guestsLabel,
  tehranToday,
} from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { windowLabel, type AvailCopy } from "@/widgets/units-page/copy";
import { tripStart, type Clock, type Trip } from "@/widgets/units-page/model";
import { periodHour, type AccountGate, type MainAction } from "./model";

export type PanelProps = {
  unit: UnitDetail;
  trip: Trip;
  clock: Clock;
  copy: AvailCopy;
  action: MainAction;
  account: AccountGate;
  standing: Standing | undefined;
  quote: Quote | undefined;
  quoteChecking: boolean;
  nearest: FreeWindow | null;
  settling: boolean;
  signedIn: boolean;
  firstName: string;
  onTrip: () => void;
  onMain: () => void;
  onNearest: (w: FreeWindow) => void;
  onWaitlist: (() => void) | null;
  calendarHref: Route;
  policies: Policies;
};

const hh = (h: number) => `${faDigits(String(h).padStart(2, "0"))}:${faDigits("00")}`;
const periodWord = (p: "day" | "night") => (p === "day" ? "روز" : "شب");

/** ورود/خروج بازهٔ سفر بر پایهٔ شبکهٔ سرور (پیش از دریافت ماتریس هم قابل نمایش). */
function stayMoments(trip: Trip, clock: Clock): { start: string; end: string } | null {
  if (!trip.day) return null;
  const start = tripStart(trip.day, trip.period, clock);
  const end = new Date(Date.parse(start) + trip.cells * clock.cellHours * 3_600_000).toISOString();
  return { start, end };
}

function guardMessage(p: PanelProps): string {
  const a = p.account;
  if (a.kind === "active")
    return `برای انتخاب تازه، ابتدا وضعیت رزرو فعلی باید روشن شود (حداکثر ${faDigits(a.limit)} رزرو فعال برای هر حساب).`;
  if (a.kind === "cooldown") return `محدودیت زمانی حساب تا ${formatMoment(a.until)}؛ مستقل از آزاد بودن واحد است.`;
  if (a.kind === "suspended") return `امکان رزرو برای حساب شما تا ${formatMoment(a.until)} بسته است.`;
  if (a.kind === "quota") return a.message;
  if (p.action.label === "نیازمند اتصال") return "برای ادامه، اتصال اینترنت لازم است؛ انتخاب شما حفظ می‌شود.";
  if (p.action.label === "نیازمند بررسی زمان‌ها") return "برای ادامه، دریافت تازهٔ زمان‌ها لازم است.";
  if (a.kind === "profile") return "پیش از صدور، اطلاعات هویتی در گام بعد تکمیل می‌شود؛ هنوز رزروی ثبت نشده است.";
  if (a.kind === "guest") return "پس از انتخاب، ورود تلفنی و بررسی شرایط حساب انجام می‌شود؛ هنوز رزروی ثبت نشده است.";
  return "شرایط حساب شما در گام بعد دوباره بررسی و رزرو صادر می‌شود؛ هنوز رزروی ثبت نشده است.";
}

function PanelBody(p: PanelProps & { idPrefix: string }) {
  const stay = stayMoments(p.trip, p.clock);
  const tone = p.copy.tone;
  const free = p.action.kind === "continue";
  return (
    <>
      <p className="ud-panel__intro">شرایط سفرتان را مشخص کنید؛ مناسب بودن تمام بازه را با هم می‌بینیم.</p>
      <button type="button" className="ud-trip" onClick={p.onTrip} aria-haspopup="dialog">
        <Icon name={p.trip.day ? "calendar-check" : "calendar"} size={18} />
        <span>
          {p.trip.day ? formatDayLabel(p.trip.day) : "تاریخ سفر را انتخاب کنید"}
          <small>
            {stay && p.trip.day
              ? `ورود ${periodWord(p.trip.period)} ${hh(periodHour(p.trip.period, p.clock))} · خروج ${formatDayMonth(tehranToday(new Date(stay.end)))}، ${formatClock(stay.end)}`
              : "یا نزدیک‌ترین شروع آزاد را بررسی کنید"}
          </small>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      <div className="ud-counts">
        <button type="button" onClick={p.onTrip} aria-haspopup="dialog">
          <Icon name="users" size={16} /> {guestsLabel(p.trip.guests)}
          <span className="sr-only">، تغییر تعداد همسفران</span>
        </button>
        <button type="button" onClick={p.onTrip} aria-haspopup="dialog">
          <Icon name="clock" size={16} /> {durationLabel(p.trip.cells)}
          <span className="sr-only">، تغییر مدت اقامت</span>
        </button>
      </div>

      <div className="ud-panel__feedback" data-tone={tone} role="status" aria-live="polite">
        <Icon name={tone === "free" ? "calendar-check" : tone === "muted" ? "clock" : "info"} size={16} />
        <p>
          <strong>{p.copy.title}</strong>
          <span>{p.copy.sub}</span>
          {p.settling ? <span className="ud-panel__stale">در حال تازه‌سازی؛ نتیجهٔ قبلی دیده می‌شود.</span> : null}
        </p>
      </div>

      {p.signedIn && (free || p.quote) ? (
        <div className="ud-quote" aria-busy={p.quoteChecking}>
          {p.quoteChecking && !p.quote ? <p>در حال بررسی سهمیه و قواعد رزرو شما…</p> : null}
          {p.quote?.allowed ? (
            <p data-tone="ok">
              <Icon name="shield-check" size={16} /> با قواعد رزرو حساب شما هم‌خوان است.
            </p>
          ) : null}
          {p.quote?.violations.map((v) => (
            <p key={v.code} data-tone="warn">
              <Icon name="info" size={16} /> {v.message}
            </p>
          ))}
          {p.quote?.notes.map((n) => (
            <p key={n}>
              <Icon name="info" size={16} /> {n}
            </p>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        className={cx("btn btn-primary ud-panel__cta", p.action.disabled && "is-disabled")}
        aria-disabled={p.action.disabled || undefined}
        aria-describedby={`${p.idPrefix}-guard`}
        onClick={p.onMain}
      >
        {p.action.label} <Icon name="arrow-left" size={18} />
      </button>
      <p id={`${p.idPrefix}-guard`} className="ud-panel__guard">
        {guardMessage(p)}
      </p>
      {p.account.kind === "active" ? (
        <a className="ud-nearest" href={destHref("portal") ?? "/"}>
          مشاهدهٔ رزرو فعلی در پرتال <Icon name="arrow-left" size={16} />
        </a>
      ) : null}
      {p.nearest ? (
        <button type="button" className="ud-nearest" onClick={() => p.nearest && p.onNearest(p.nearest)}>
          <span>
            <small>نزدیک‌ترین شروع آزاد</small>
            {windowLabel(p.nearest)}
          </span>
          <Icon name="arrow-left" size={16} />
        </button>
      ) : null}
      {p.onWaitlist ? (
        <button type="button" className="ud-nearest" onClick={p.onWaitlist} aria-haspopup="dialog">
          <span>
            <small>همین بازه را می‌خواهید؟</small>
            آزاد شد خبرم کنید
          </span>
          <Icon name="bell" size={16} />
        </button>
      ) : null}
      <Link className="ud-nearest" href={p.calendarHref}>
        <span>
          <small>مقایسهٔ زمان‌ها با واحدهای دیگر</small>
          تقویم کامل
        </span>
        <Icon name="calendar" size={16} />
      </Link>

      <div className="ud-fair">
        <Icon name="shield-check" size={18} />
        <p>
          هیچ هزینه‌ای دریافت نمی‌شود. آزادی زمان، تضمین ثبت نهایی نیست.
          {p.standing ? (
            <span className="ud-fair__quota">
              سهمیهٔ شما: {faDigits(p.standing.window.remaining)} از {faDigits(p.standing.window.limit)} نیم‌روز در{" "}
              {faDigits(p.standing.window.window_days ?? p.policies.windowDays)} روز ·{" "}
              {faDigits(p.standing.year.remaining)} از {faDigits(p.standing.year.limit)} در سال
            </span>
          ) : null}
        </p>
      </div>
    </>
  );
}

function PanelTop({ signedIn, firstName, id }: { signedIn: boolean; firstName: string; id: string }) {
  return (
    <div className="ud-panel__top">
      <span className="ud-panel__emblem" aria-hidden="true">
        <Icon name="heart-hand" size={22} />
      </span>
      <div>
        <p>{signedIn ? `${firstName || "زائر"} عزیز، خوش آمدید` : "مهمان مهدیه هستید"}</p>
        <h2 id={id}>اقامت کاملاً رایگان</h2>
      </div>
    </div>
  );
}

/** پنل چسبان رزرو (رومیزی > ۹۰۰px). */
export function BookingPanel(p: PanelProps) {
  return (
    <aside className="ud-panel" aria-labelledby="ud-panel-title">
      <PanelTop signedIn={p.signedIn} firstName={p.firstName} id="ud-panel-title" />
      <PanelBody {...p} idPrefix="ud-panel" />
    </aside>
  );
}

/**
 * ≤۹۰۰px: نوار ثابت پایین (بالای زبانه‌های پایینی گوشی) با خلاصهٔ سفر و همان کنش اصلی. لمس خلاصه یا
 * کنش غیرفعال ⇒ همان پنل کامل در پنجرهٔ پایینی (دلیل غیرفعال بودن، سهمیه و بررسی شخصی هیچ‌گاه پنهان نمی‌ماند).
 */
export function MobileCta(p: PanelProps) {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <aside className="mobile-cta ud-cta" aria-label="ادامهٔ رزرو این واحد" data-float-guard="">
        <button type="button" className="ud-cta__summary" onClick={() => setSheet(true)} aria-haspopup="dialog">
          <strong>
            {p.trip.day ? (
              `${formatDayMonth(p.trip.day)} · ${periodWord(p.trip.period)} ${hh(periodHour(p.trip.period, p.clock))}`
            ) : (
              <>
                {p.unit.type_label} · <bdi className="latin">{p.unit.code}</bdi>
              </>
            )}
          </strong>
          <span>
            {p.action.disabled ? p.action.label : `${guestsLabel(p.trip.guests)} · ${durationLabel(p.trip.cells)}`}
          </span>
        </button>
        <button
          type="button"
          className={cx("btn btn-primary", p.action.disabled && "is-disabled")}
          aria-disabled={p.action.disabled || undefined}
          onClick={() => (p.action.disabled ? setSheet(true) : p.onMain())}
        >
          {p.action.disabled ? "وضعیت و راهنما" : p.action.label} <Icon name="arrow-left" size={18} />
        </button>
      </aside>
      <AppDialog
        isOpen={sheet}
        onOpenChange={setSheet}
        title="رزرو همین واحد"
        subtitle={
          <>
            {p.unit.title} · <bdi className="latin">{p.unit.code}</bdi>
          </>
        }
        className="ud-sheet"
        closeLabel="بستن"
      >
        <div className="ud-panel ud-panel--sheet">
          <PanelBody
            {...p}
            idPrefix="ud-sheet"
            onTrip={() => {
              setSheet(false);
              p.onTrip();
            }}
            onMain={() => {
              if (p.action.disabled) return;
              setSheet(false);
              p.onMain();
            }}
            onNearest={(w) => {
              setSheet(false);
              p.onNearest(w);
            }}
            onWaitlist={
              p.onWaitlist
                ? () => {
                    setSheet(false);
                    p.onWaitlist?.();
                  }
                : null
            }
          />
        </div>
      </AppDialog>
    </>
  );
}
