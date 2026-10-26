"use client";
import type { Route } from "next";
import Link from "next/link";
import { featureIcon, floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import { bookingHref } from "@/features/booking-draft/store";
import { BookingContinue } from "@/features/session/BookingContinue";
import type { Quote, UnitDetail, UnitFeature } from "@/shared/api/schemas";
import { durationLabel, faDigits, formatMoment, guestsLabel } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { composition } from "@/widgets/units-page/UnitCard";
import type { Availability, CatalogUnit, Trip } from "@/widgets/units-page/model";
import { goUnit } from "./store";

/** «تغییر واحد»: همهٔ واحدهای فعال با تناسب ظرفیت برای همین تعداد؛ جابه‌جایی بی‌بارگذاری دوباره. */
export function SwitchDialog({
  open,
  onOpenChange,
  units,
  current,
  guests,
  onPrefetch,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  units: CatalogUnit[];
  current: string;
  guests: number;
  onPrefetch: (code: string) => void;
}) {
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="تغییر واحد"
      subtitle={`برای ${guestsLabel(guests)}؛ شرایط سفر شما با واحد تازه حفظ می‌شود.`}
      closeLabel="بستن فهرست واحدها"
      className="ud-switch-dialog"
    >
      <ul className="ud-switch__list">
        {units.map((u) => {
          const fits = u.capacity_total >= guests;
          const here = u.code === current;
          return (
            <li key={u.code}>
              <a
                href={`/units/${u.code}/`}
                aria-current={here ? "page" : undefined}
                data-fit={fits ? undefined : "no"}
                onPointerEnter={() => onPrefetch(u.code)}
                onFocus={() => onPrefetch(u.code)}
                onClick={(e) => {
                  if (here) {
                    e.preventDefault();
                    onOpenChange(false);
                    return;
                  }
                  goUnit(e, u.code);
                  if (e.defaultPrevented) onOpenChange(false);
                }}
              >
                <span className="ud-switch__icon" data-tone={u.code === "B2" || u.code === "B3" ? "cool" : undefined}>
                  <Icon name={unitTypeIcon(u.unit_type)} size={22} />
                </span>
                <span className="ud-switch__text">
                  <strong>
                    {u.title} <bdi className="latin">{u.code}</bdi>
                  </strong>
                  <small>
                    {floorLabel(u.floor_number)} · تا {faDigits(u.capacity_total)} نفر
                    {composition(u) ? ` (${composition(u)})` : ""}
                  </small>
                </span>
                <span className="ud-switch__state" data-state={here ? "here" : fits ? "fit" : "small"}>
                  {here ? "همین واحد" : fits ? "مناسب" : "ظرفیت کمتر"}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </AppDialog>
  );
}

/** توضیح یک امکان ثبت‌شده — صادقانه: فقط آنچه در داده هست، بی‌وعدهٔ اضافه. */
export function FeatureDialog({
  feature,
  unitTitle,
  access,
  onClose,
}: {
  feature: UnitFeature | null;
  unitTitle: string;
  access: string;
  onClose: () => void;
}) {
  return (
    <AppDialog
      isOpen={Boolean(feature)}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={feature?.title ?? ""}
      subtitle={`از امکانات ثبت‌شدهٔ ${unitTitle}`}
      closeLabel="بستن توضیح"
      className="ud-feature-dialog"
    >
      {feature ? (
        <div className="ud-explain">
          <span className="ud-explain__icon" aria-hidden="true">
            <Icon name={featureIcon(feature.code)} size={28} />
          </span>
          <p>این مورد در امکانات ثبت‌شدهٔ {unitTitle} آمده است.</p>
          {feature.note ? (
            <p className="ud-explain__note">
              <Icon name="info" size={16} />
              <span>{feature.note}</span>
            </p>
          ) : null}
          {feature.code === "kitchen" ? (
            <p>عنوان ثبت‌شده «آشپزخانهٔ مشترک» است؛ به معنی آشپزخانهٔ خصوصی داخل سوئیت یا سرو غذا نیست.</p>
          ) : null}
          {feature.code === "elevator" ? (
            <>
              <p>
                این داده را همراه یادداشت دسترسیِ طبقه بخوانید؛ دسترسی واقعی و شرایط استفاده باید پیش از سفر تأیید شود.
              </p>
              <p className="ud-explain__note">
                <Icon name="stairs" size={16} />
                <span>{access || "هنوز یادداشت دسترسی برای این طبقه ثبت نشده است."}</span>
              </p>
            </>
          ) : null}
          <p className="ud-explain__fine">
            از این داده، تعداد دستگاه، محل دقیق، ساعت خدمت یا کیفیت سرویس نتیجه‌گیری نمی‌شود.
          </p>
        </div>
      ) : null}
    </AppDialog>
  );
}

/**
 * پیش از رفتن به «تکمیل و صدور رزرو»: خلاصهٔ دقیق بازه (همان که سرور سنجیده) و آخرین پیام‌های قواعد
 * شخصی. هنوز رزروی ثبت نشده — صدور فقط در P-05 و با تأیید دوبارهٔ سرور.
 */
export function HandoffDialog({
  open,
  onOpenChange,
  unit,
  trip,
  availability,
  profileIncomplete,
  quote,
  calendarHref,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  unit: UnitDetail;
  trip: Trip;
  availability: Availability;
  profileIncomplete: boolean;
  quote: Quote | undefined;
  calendarHref: Route;
}) {
  const free = availability.kind === "free" ? availability : null;
  const href = bookingHref(unit.code, trip);
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="این بازه آزاد است"
      subtitle={
        <>
          {unit.title} · <bdi className="latin">{unit.code}</bdi>
        </>
      }
      badge={<span className="ud-free-badge">کاملاً رایگان</span>}
      closeLabel="بستن خلاصه"
      className="ud-handoff"
      actions={
        <>
          <Link className="btn btn-secondary" href={calendarHref}>
            <Icon name="calendar" size={18} /> مقایسه در تقویم کامل
          </Link>
          <BookingContinue
            className="btn btn-primary"
            href={href}
            label={profileIncomplete ? "ادامه و تکمیل پروفایل" : "ادامه و صدور رزرو"}
            guestLabel="ورود با شمارهٔ همراه و ادامه"
            reason="برای صدور رزرو این واحد، با شمارهٔ همراه وارد شوید."
          />
        </>
      }
    >
      <div className="ud-handoff__body">
        <span className="ud-explain__icon" aria-hidden="true">
          <Icon name="calendar-check" size={28} />
        </span>
        <dl className="ud-summary">
          <div>
            <dt>ورود</dt>
            <dd>{free ? formatMoment(free.start) : "—"}</dd>
          </div>
          <div>
            <dt>خروج</dt>
            <dd>{free ? formatMoment(free.end) : "—"}</dd>
          </div>
          <div>
            <dt>همسفران</dt>
            <dd>{guestsLabel(trip.guests)}</dd>
          </div>
          <div>
            <dt>مدت</dt>
            <dd>{durationLabel(trip.cells)}</dd>
          </div>
          <div>
            <dt>هزینه</dt>
            <dd>کاملاً رایگان</dd>
          </div>
        </dl>
        {quote?.notes.length || quote?.violations.length ? (
          <ul className="ud-handoff__notes">
            {quote.violations.map((v) => (
              <li key={v.code} data-tone="warn">
                <Icon name="info" size={16} />
                <span>{v.message}</span>
              </li>
            ))}
            {quote.notes.map((n) => (
              <li key={n}>
                <Icon name="info" size={16} />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="ud-explain__fine">
          {profileIncomplete
            ? "در گام بعد، اطلاعات هویتی پروفایل تکمیل و سپس رزرو با بررسی دوبارهٔ سرور صادر می‌شود."
            : "هنوز رزروی ثبت نشده است؛ صدور نهایی با بررسی دوبارهٔ سرور در گام بعد انجام می‌شود."}
        </p>
      </div>
    </AppDialog>
  );
}
