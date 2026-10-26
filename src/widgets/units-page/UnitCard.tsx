"use client";
import type { Route } from "next";
import Link from "next/link";
import { featureIcon, floorLabel, unitPlan, unitTypeIcon } from "@/entities/unit/unit";
import { BookingContinue } from "@/features/session/BookingContinue";
import { bookingHref } from "@/features/booking-draft/store";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import type { Action, AvailCopy } from "./copy";
import { cardFeatures, type CatalogUnit, type Trip } from "./model";

/** پس‌زمینهٔ پلان طراح برای هر واحد (فرش سبز/آبی ⇒ زمینهٔ خنک)؛ واحد تازه ⇒ زمینهٔ گرم. */
const COOL = new Set(["B2", "B3"]);

/** ترکیب ثبت‌شدهٔ ظرفیت: «۴ بزرگسال + ۲ کودک» (اگر سرور داده باشد). */
export function composition(u: Pick<CatalogUnit, "capacity_adults" | "capacity_children">): string | null {
  if (u.capacity_adults === undefined) return null;
  return u.capacity_children
    ? `${faDigits(u.capacity_adults)} بزرگسال + ${faDigits(u.capacity_children)} کودک`
    : `${faDigits(u.capacity_adults)} بزرگسال`;
}

export function UnitCard({
  unit,
  copy,
  trip,
  compared,
  onCompare,
  onOpen,
  onAction,
  calendarHref,
}: {
  unit: CatalogUnit;
  copy: AvailCopy;
  trip: Trip;
  compared: boolean;
  onCompare: () => void;
  onOpen: () => void;
  onAction: (a: Action) => void;
  calendarHref: Route;
}) {
  const titleId = `uc-${unit.code}`;
  const feats = cardFeatures(unit);
  const booking = copy.action.kind === "book" && trip.day ? bookingHref(unit.code, { ...trip, day: trip.day }) : null;
  return (
    <li className="uc" data-compared={compared || undefined} data-tone={COOL.has(unit.code) ? "cool" : undefined}>
      <article className="uc__inner" aria-labelledby={titleId}>
        <div className="uc__visual">
          {unit.cover ? (
            <img src={unit.cover.url} alt={unit.cover.alt_text || unit.title} loading="lazy" decoding="async" />
          ) : (
            <>
              <img
                src={unitPlan(unit.unit_type, unit.code)}
                alt=""
                loading="lazy"
                decoding="async"
                width={430}
                height={300}
              />
              <span className="uc__plan-note">
                <Icon name="image" size={12} /> پلان مفهومی
              </span>
            </>
          )}
          <span className="uc__type">
            <Icon name={unitTypeIcon(unit.unit_type)} size={14} />
            {unit.type_label} · {faDigits(unit.capacity_total)} نفر
          </span>
          <span className="uc__code" aria-hidden="true">
            <bdi className="latin">{unit.code}</bdi>
          </span>
        </div>

        <button
          type="button"
          className="uc__compare"
          aria-pressed={compared}
          onClick={onCompare}
          id={`compare-card-${unit.code}`}
        >
          <Icon name={compared ? "check" : "plus"} size={14} />
          <span>{compared ? "در مقایسه" : "مقایسه"}</span>
          <span className="sr-only"> {unit.title}</span>
        </button>

        <div className="uc__body">
          <header className="uc__head">
            <h3 id={titleId}>
              <button type="button" className="uc__title" onClick={onOpen}>
                {unit.title}
                <span className="sr-only">
                  {" "}
                  — کد <bdi className="latin">{unit.code}</bdi>، نگاه کوتاه
                </span>
              </button>
            </h3>
            <small className="uc__floor">{unit.floorTitle || floorLabel(unit.floor_number)}</small>
          </header>

          <p className="uc__cap">
            <Icon name="users" size={16} />
            <strong>تا {faDigits(unit.capacity_total)} نفر</strong>
            {composition(unit) ? <span>{composition(unit)}</span> : null}
          </p>

          {feats.length ? (
            <ul className="uc__feats" aria-label={`امکانات شاخص ${unit.title}`}>
              {feats.map((f) => (
                <li key={f.code}>
                  <Icon name={featureIcon(f.code)} size={14} />
                  {f.title}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="uc__avail" data-tone={copy.tone} aria-live="polite">
            <span className="uc__avail-icon" aria-hidden="true">
              <Icon
                name={
                  copy.tone === "free"
                    ? "calendar-check"
                    : copy.tone === "warn"
                      ? "info"
                      : copy.tone === "busy"
                        ? "calendar-x"
                        : "hourglass"
                }
                size={16}
              />
            </span>
            <span className="uc__avail-text">
              <strong>{copy.title}</strong>
              <small>{copy.sub}</small>
            </span>
            <AvailAction action={copy.action} onAction={onAction} calendarHref={calendarHref} unit={unit.title} />
          </div>

          <footer className="uc__foot">
            <span className="uc__free">
              <Icon name="heart-hand" size={16} /> اقامت رایگان
            </span>
            {booking ? (
              <BookingContinue
                className="btn btn-primary uc__cta"
                href={booking}
                label="رزرو همین بازه"
                guestLabel="ورود و رزرو"
                reason="برای رزرو این واحد، با شمارهٔ همراه وارد شوید."
                iconSize={16}
              />
            ) : (
              <button
                type="button"
                className={cx("btn btn-primary uc__cta")}
                onClick={onOpen}
                id={`unit-open-${unit.code}`}
              >
                دیدن واحد <Icon name="arrow-left" size={16} />
              </button>
            )}
          </footer>
        </div>
      </article>
    </li>
  );
}

function AvailAction({
  action,
  onAction,
  calendarHref,
  unit,
}: {
  action: Action;
  onAction: (a: Action) => void;
  calendarHref: Route;
  unit: string;
}) {
  if (action.kind === "pick") {
    return (
      <button type="button" className="icon-button uc__avail-go" onClick={() => onAction(action)}>
        <Icon name="arrow-left" size={18} />
        <span className="sr-only">انتخاب همین شروع برای {unit}</span>
      </button>
    );
  }
  if (action.kind === "trip") {
    return (
      <button type="button" className="icon-button uc__avail-go" onClick={() => onAction(action)}>
        <Icon name="sliders" size={18} />
        <span className="sr-only">تغییر شرایط سفر</span>
      </button>
    );
  }
  if (action.kind === "calendar") {
    return (
      <Link className="icon-button uc__avail-go" href={calendarHref}>
        <Icon name="calendar" size={18} />
        <span className="sr-only">دیدن {unit} در تقویم کامل</span>
      </Link>
    );
  }
  return null;
}
