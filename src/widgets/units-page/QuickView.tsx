"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { featureIcon, unitPlan, unitTypeIcon } from "@/entities/unit/unit";
import { bookingHref } from "@/features/booking-draft/store";
import { BookingContinue } from "@/features/session/BookingContinue";
import { fetchQuote, meQuery } from "@/shared/api/queries";
import type { Alternative } from "@/shared/api/schemas";
import { faDigits, formatMoment, guestsLabel } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { tripSummary, type Action, type AvailCopy } from "./copy";
import type { Availability, CatalogUnit, Trip } from "./model";
import { composition } from "./UnitCard";

/**
 * «نگاه کوتاه به واحد»: همهٔ دادهٔ ثبت‌شدهٔ واحد + حکم بازهٔ سفر، و برای کاربر واردشده بررسی شخصی سرور
 * (‎/reservations/quote‎: سهمیه، فاصلهٔ رزروها، محرومیت و جایگزین‌ها) — پیش از رفتن به P-05.
 */
export function QuickView({
  unit,
  onClose,
  trip,
  availability,
  copy,
  compared,
  compareFull,
  onCompare,
  onAction,
  onAlternative,
  calendarHref,
  onWaitlist,
}: {
  unit: CatalogUnit | null;
  onClose: () => void;
  trip: Trip;
  availability: Availability | undefined;
  copy: AvailCopy | undefined;
  compared: boolean;
  compareFull: boolean;
  onCompare: () => void;
  onAction: (a: Action) => void;
  onAlternative: (a: Alternative) => void;
  calendarHref: Route;
  onWaitlist: (() => void) | null;
}) {
  return (
    <AppDialog
      isOpen={Boolean(unit)}
      onOpenChange={(o) => (o ? undefined : onClose())}
      size="lg"
      title={unit?.title ?? ""}
      subtitle={
        unit ? (
          <>
            کد واحد <bdi className="latin">{unit.code}</bdi> · {unit.floorTitle} · {unit.type_label}
          </>
        ) : undefined
      }
      closeLabel="بستن نگاه کوتاه"
    >
      {unit && copy ? (
        <Body
          unit={unit}
          trip={trip}
          availability={availability}
          copy={copy}
          compared={compared}
          compareFull={compareFull}
          onCompare={onCompare}
          onAction={onAction}
          onAlternative={onAlternative}
          calendarHref={calendarHref}
          onWaitlist={onWaitlist}
        />
      ) : null}
    </AppDialog>
  );
}

function Body({
  unit,
  trip,
  availability,
  copy,
  compared,
  compareFull,
  onCompare,
  onAction,
  onAlternative,
  calendarHref,
  onWaitlist,
}: {
  unit: CatalogUnit;
  trip: Trip;
  availability: Availability | undefined;
  copy: AvailCopy;
  compared: boolean;
  compareFull: boolean;
  onCompare: () => void;
  onAction: (a: Action) => void;
  onAlternative: (a: Alternative) => void;
  calendarHref: Route;
  onWaitlist: (() => void) | null;
}) {
  const me = useQuery(meQuery);
  const free = availability?.kind === "free" ? availability : null;
  const quote = useQuery({
    queryKey: ["quote", unit.code, free?.start, free?.end, trip.guests],
    queryFn: () =>
      fetchQuote({ unit_code: unit.code, start: free?.start ?? "", end: free?.end ?? "", guests_count: trip.guests }),
    enabled: Boolean(me.data && free),
    staleTime: 15_000,
    retry: false,
  });
  const blocked = quote.data ? !quote.data.allowed : false;
  const booking = free && trip.day && !blocked ? bookingHref(unit.code, { ...trip, day: trip.day }) : null;
  const mix = composition(unit);

  return (
    <div className="uqv">
      <figure className="uqv__visual" data-tone={unit.code === "B2" || unit.code === "B3" ? "cool" : undefined}>
        {unit.cover ? (
          <img src={unit.cover.url} alt={unit.cover.alt_text || unit.title} decoding="async" />
        ) : (
          <>
            <img
              src={unitPlan(unit.unit_type, unit.code)}
              alt={`تصویرسازی مفهومی ${unit.type_label}`}
              width={430}
              height={300}
            />
            <figcaption>
              <Icon name="info" size={14} /> تصویرسازی مفهومی؛ عکس و نقشهٔ واقعیِ تأییدشده هنوز ثبت نشده است.
            </figcaption>
          </>
        )}
      </figure>

      <ul className="uqv__facts">
        <li>
          <Icon name="users" size={18} />
          <span>
            <small>ظرفیت کل</small>
            <strong>{guestsLabel(unit.capacity_total)}</strong>
            {mix ? <small>{mix}</small> : null}
          </span>
        </li>
        <li>
          <Icon name="building" size={18} />
          <span>
            <small>طبقه</small>
            <strong>{unit.floorTitle}</strong>
          </span>
        </li>
        <li>
          <Icon name={unitTypeIcon(unit.unit_type)} size={18} />
          <span>
            <small>نوع</small>
            <strong>{unit.type_label}</strong>
          </span>
        </li>
      </ul>

      <section className="uqv__section uqv__avail" data-tone={copy.tone} aria-labelledby="uqv-time">
        <h3 id="uqv-time">برای سفر شما</h3>
        <p className="uqv__trip">{tripSummary(trip)}</p>
        <p className="uqv__verdict">
          <strong>{copy.title}</strong>
          <small>{copy.sub}</small>
        </p>
        <div className="uqv__avail-actions">
          {copy.action.kind === "pick" ? (
            <button type="button" className="btn btn-secondary" onClick={() => onAction(copy.action)}>
              <Icon name="calendar-check" size={18} /> انتخاب همین شروع
            </button>
          ) : null}
          {copy.action.kind === "trip" ? (
            <button type="button" className="btn btn-secondary" onClick={() => onAction(copy.action)}>
              <Icon name="sliders" size={18} /> تغییر شرایط سفر
            </button>
          ) : null}
          <Link className="btn btn-ghost" href={calendarHref}>
            <Icon name="calendar" size={18} /> دیدن در تقویم کامل
          </Link>
          {onWaitlist ? (
            <button type="button" className="btn btn-ghost" onClick={onWaitlist}>
              <Icon name="bell" size={18} /> آزاد شد خبرم کنید
            </button>
          ) : null}
        </div>
      </section>

      {me.data && free ? (
        <section className="uqv__section" aria-labelledby="uqv-check" aria-busy={quote.isFetching}>
          <h3 id="uqv-check">بررسی برای شما</h3>
          {quote.isPending ? <p className="inline-note">در حال بررسی سهمیه و قواعد رزرو شما…</p> : null}
          {quote.data?.allowed ? (
            <p className="inline-note" data-tone="ok">
              <Icon name="shield-check" size={16} /> با قواعد رزرو شما هم‌خوان است.
            </p>
          ) : null}
          {quote.data?.violations.map((v) => (
            <p key={v.code} className="inline-note" data-tone="warn">
              <Icon name="info" size={16} /> {v.message}
            </p>
          ))}
          {quote.data?.notes.map((n) => (
            <p key={n} className="inline-note">
              <Icon name="info" size={16} /> {n}
            </p>
          ))}
          {quote.data?.alternatives.length ? (
            <ul className="alt-list" aria-label="بازه‌های جایگزین">
              {quote.data.alternatives.slice(0, 4).map((a) => (
                <li key={`${a.unit_code}${a.start}`}>
                  <button type="button" onClick={() => onAlternative(a)}>
                    <strong>{a.unit_title}</strong>
                    <small>{formatMoment(a.start)}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {quote.isError ? (
            <p className="inline-note">بررسی شخصی ممکن نشد؛ در مرحلهٔ ثبت دوباره سنجیده می‌شود.</p>
          ) : null}
        </section>
      ) : null}

      {unit.features.length ? (
        <section className="uqv__section" aria-labelledby="uqv-feats">
          <h3 id="uqv-feats">امکانات ثبت‌شده</h3>
          <ul className="uqv__feats">
            {unit.features.map((f) => (
              <li key={f.code} data-highlight={f.is_highlight || undefined}>
                <Icon name={featureIcon(f.code)} size={18} />
                <span>
                  {f.title}
                  {f.note ? <small>{f.note}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="uqv__section uqv__access" aria-labelledby="uqv-access">
        <h3 id="uqv-access">
          <Icon name="stairs" size={18} /> دسترسی {unit.floorTitle}
        </h3>
        <p>{unit.access || "یادداشت دسترسی این طبقه هنوز ثبت نشده است؛ پیش از سفر با پذیرش هماهنگ کنید."}</p>
      </section>

      <p className="uqv__privacy">
        <Icon name="shield-check" size={16} /> اقامت کاملاً رایگان است؛ نشانی دقیق و راهنمای ورود پس از ثبت رزرو در
        گواهی شما می‌آید.
      </p>

      <div className="uqv__actions">
        {booking ? (
          <BookingContinue
            className="btn btn-primary"
            href={booking}
            label="رزرو همین بازه"
            guestLabel="ورود و ادامهٔ رزرو"
            reason="برای رزرو این واحد، با شمارهٔ همراه وارد شوید."
          />
        ) : (
          <Link className="btn btn-primary" href={calendarHref}>
            انتخاب زمان در تقویم <Icon name="arrow-left" size={18} />
          </Link>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          aria-pressed={compared}
          disabled={!compared && compareFull}
          onClick={onCompare}
        >
          <Icon name={compared ? "check" : "compare"} size={18} />
          {compared ? "در فهرست مقایسه" : compareFull ? `مقایسه پر است (${faDigits(3)})` : "افزودن به مقایسه"}
        </button>
      </div>
    </div>
  );
}
