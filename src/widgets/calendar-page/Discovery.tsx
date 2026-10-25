"use client";
import { useId } from "react";
import { floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import type { CalendarWindows } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import { durationLabel, faDigits, formatClock, formatDayMonth, formatWeekday, guestsLabel } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

type UnitWindow = CalendarWindows["units"][number];

/** گزینه‌های «کوتاه‌ترین اقامت»: نیم‌روز، یک، دو و سه شبانه‌روز (در سقف سیاست). */
export const STAY_OPTIONS = [1, 2, 4, 6] as const;

/**
 * «کشف سریع» طراح — نخستین بازهٔ پیوستهٔ آزاد هر واحد در کل افق رزرو، محاسبه‌شده در خود موتور
 * بک‌اند (‎/calendar/windows‎: مهلت پیش از ورود، افق، ظرفیت و سقف مدت). انتخاب هر کارت همان بازه را
 * در تقویم برمی‌گزیند و کشوی خلاصه را باز می‌کند.
 */
export function Discovery({
  data,
  loading,
  error,
  guests,
  stay,
  maxGuests,
  maxCells,
  selectedUnit,
  onGuests,
  onStay,
  onPick,
  onWaitlist,
  onRetry,
}: {
  data: CalendarWindows | undefined;
  loading: boolean;
  error: boolean;
  guests: number;
  stay: number;
  maxGuests: number;
  maxCells: number;
  selectedUnit: string | null;
  onGuests: (n: number) => void;
  onStay: (n: number) => void;
  onPick: (u: UnitWindow) => void;
  onWaitlist: (u: UnitWindow) => void;
  onRetry: () => void;
}) {
  const id = useId();
  const options = STAY_OPTIONS.filter((n) => n <= maxCells);
  const units = data?.units ?? [];
  return (
    <section className="cp-discovery" aria-labelledby={`${id}-t`} id="discovery">
      <header className="cp-discovery__head">
        <div>
          <h2 id={`${id}-t`}>
            <Icon name="target" size={22} />
            کشف سریع: نخستین زمان‌های آزاد هر واحد
          </h2>
          <p>
            بی‌نیاز از پیمودن روزها، نخستین بازهٔ پیوسته و بی‌تداخل هر واحد در کل افق رزرو را ببینید و مستقیم انتخاب
            کنید.
          </p>
        </div>
        <div className="cp-discovery__controls">
          <div className="cp-field">
            <span className="field-label" id={`${id}-g`}>
              همسفران
            </span>
            <Stepper
              value={guests}
              min={1}
              max={maxGuests}
              onChange={onGuests}
              format={guestsLabel}
              labelId={`${id}-g`}
              incLabel="افزودن یک همسفر"
              decLabel="کاستن یک همسفر"
            />
          </div>
          <div className="cp-field">
            <span className="field-label" id={`${id}-s`}>
              کوتاه‌ترین اقامت
            </span>
            <div className="cp-seg" role="radiogroup" aria-labelledby={`${id}-s`}>
              {options.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stay === n}
                  className="cp-seg__btn"
                  onClick={() => onStay(n)}
                >
                  {durationLabel(n)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {error && !data ? (
        <div className="cp-inline-state" role="alert">
          <Icon name="cloud-off" size={20} />
          <span>فهرست نخستین زمان‌های آزاد دریافت نشد.</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            <Icon name="refresh" size={16} /> تلاش دوباره
          </button>
        </div>
      ) : (
        <ul className={cx("cp-discovery__grid", loading && "is-loading")} aria-busy={loading || undefined}>
          {!data
            ? Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="cp-dcard cp-dcard--skeleton" aria-hidden="true" />
              ))
            : units.map((u) => (
                <Card
                  key={u.code}
                  u={u}
                  guests={guests}
                  stay={stay}
                  active={selectedUnit === u.code}
                  onPick={onPick}
                  onWaitlist={onWaitlist}
                />
              ))}
        </ul>
      )}
    </section>
  );
}

function Card({
  u,
  guests,
  stay,
  active,
  onPick,
  onWaitlist,
}: {
  u: UnitWindow;
  guests: number;
  stay: number;
  active: boolean;
  onPick: (u: UnitWindow) => void;
  onWaitlist: (u: UnitWindow) => void;
}) {
  const w = u.window;
  return (
    <li
      className="cp-dcard"
      data-state={!u.fits_guests ? "short" : w ? "free" : "none"}
      data-active={active || undefined}
    >
      <div className="cp-dcard__head">
        <span className="cp-unit__icon" aria-hidden="true">
          <Icon name={unitTypeIcon(u.unit_type)} size={18} />
        </span>
        <p className="cp-unit__title">
          <bdi className="latin cp-unit__code">{u.code}</bdi>
          <span className="cp-unit__name">{u.title}</span>
        </p>
      </div>
      <small className="cp-dcard__meta">
        {floorLabel(u.floor_number)} · ظرفیت {faDigits(u.capacity_total)} نفر
      </small>
      {!u.fits_guests ? (
        <p className="cp-dcard__note">
          <Icon name="users" size={16} />
          ظرفیت این واحد برای {guestsLabel(guests)} کافی نیست.
        </p>
      ) : w ? (
        <>
          <dl className="cp-dcard__facts">
            <div>
              <dt>نخستین ورود</dt>
              <dd>
                {formatWeekday(w.day)} {formatDayMonth(w.day)}
                <small>
                  {w.period === "day" ? "سانس روز" : "سانس شب"} · از ساعت <bdi>{formatClock(w.start)}</bdi>
                </small>
              </dd>
            </div>
            <div>
              <dt>بازهٔ پیوستهٔ آزاد</dt>
              <dd>{w.open_ended ? "تا پایان افق آزاد" : w.stay_label}</dd>
            </div>
          </dl>
          <button type="button" className="cp-dcard__pick" aria-pressed={active} onClick={() => onPick(u)}>
            {active ? <Icon name="check" size={18} /> : <Icon name="calendar-check" size={18} />}
            {active ? "انتخاب شد" : `انتخاب ${durationLabel(Math.min(stay, w.bookable_cells))}`}
          </button>
        </>
      ) : (
        <>
          <p className="cp-dcard__note">
            <Icon name="calendar-x" size={16} />
            در افق رزرو، بازهٔ آزاد {durationLabel(stay)} برای این واحد نمانده است.
          </p>
          <button type="button" className="cp-dcard__pick cp-dcard__pick--ghost" onClick={() => onWaitlist(u)}>
            <Icon name="bell" size={18} /> صف انتظار
          </button>
        </>
      )}
    </li>
  );
}
