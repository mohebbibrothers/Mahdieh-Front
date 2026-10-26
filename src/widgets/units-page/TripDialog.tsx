"use client";
import { useState } from "react";
import type { Period } from "@/entities/slot/timeline";
import { cx } from "@/shared/lib/cx";
import {
  addDays,
  durationLabel,
  faDigits,
  formatDayLabel,
  formatDayNumber,
  formatMonth,
  formatWeekday,
  guestsLabel,
} from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { JalaliDatePicker } from "@/shared/ui/JalaliDatePicker";
import { Stepper } from "@/shared/ui/Stepper";
import { tripSummary } from "./copy";
import { DURATION_PRESETS, MAX_GUESTS, quickDays, startEligibility, type Clock, type Trip } from "./model";

const TRIP_FORM_ID = "ut-trip-form";

/** نوار سفر بالای نتایج: «پیدا کردن فضای مناسب، از شرایط سفر شما شروع می‌شود». */
export function TripRibbon({ trip, onOpen, onClear }: { trip: Trip; onOpen: () => void; onClear: () => void }) {
  return (
    <section className="ut-ribbon" aria-labelledby="ut-ribbon-title">
      <span className="ut-ribbon__icon" aria-hidden="true">
        <Icon name={trip.day ? "calendar-check" : "calendar"} size={24} />
      </span>
      <div className="ut-ribbon__text">
        <small>پیدا کردن فضای مناسب، از شرایط سفر شما شروع می‌شود</small>
        <h2 id="ut-ribbon-title">
          {trip.day
            ? `از ${formatDayLabel(trip.day)}، ${trip.period === "day" ? "روز" : "شب"}`
            : "زمان سفرتان هنوز مشخص نیست؟"}
        </h2>
        <p className="ut-ribbon__facts">
          <span>
            <Icon name="users" size={14} /> {guestsLabel(trip.guests)}
          </span>
          <span>
            <Icon name="clock" size={14} /> {durationLabel(trip.cells)}
          </span>
          {trip.day ? null : <span className="ut-ribbon__hint">نزدیک‌ترین شروع آزاد هر واحد را نشان می‌دهیم.</span>}
        </p>
      </div>
      <div className="ut-ribbon__actions">
        {trip.day ? (
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            بدون تاریخ
          </button>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={onOpen} id="trip-open">
          <Icon name="sliders" size={18} /> {trip.day ? "تغییر سفر" : "تنظیم سفر"}
        </button>
      </div>
    </section>
  );
}

export function TripDialog({
  open,
  onOpenChange,
  trip,
  onApply,
  clock,
  today,
  minCells,
  maxCells,
  maxCapacity,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  trip: Trip;
  onApply: (t: Trip) => void;
  clock: Clock;
  today: string;
  minCells: number;
  maxCells: number;
  maxCapacity: number;
}) {
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      className="up-dlg up-dlg--trip"
      title="شرایط سفرتان را بگویید"
      subtitle="فقط برای پیدا کردن واحد مناسب؛ هنوز رزروی ثبت نمی‌شود."
      actions={
        <>
          {/* نوار پایینی ثابت پنجره بیرون از فرم است ⇒ پیوند با ‎form=‎ */}
          <button type="submit" form={TRIP_FORM_ID} className="btn btn-primary">
            نمایش واحدهای مناسب
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
            بازگشت
          </button>
        </>
      }
    >
      {open ? (
        <TripForm
          initial={trip}
          clock={clock}
          today={today}
          minCells={minCells}
          maxCells={maxCells}
          maxCapacity={maxCapacity}
          onApply={(t) => {
            onApply(t);
            onOpenChange(false);
          }}
        />
      ) : null}
    </AppDialog>
  );
}

const PERIODS: Array<{ id: Period; label: string; hint: string; icon: "sun" | "moon" }> = [
  { id: "day", label: "روز", hint: "از ۰۸:۰۰", icon: "sun" },
  { id: "night", label: "شب", hint: "از ۲۰:۰۰", icon: "moon" },
];

function TripForm({
  initial,
  clock,
  today,
  minCells,
  maxCells,
  maxCapacity,
  onApply,
}: {
  initial: Trip;
  clock: Clock;
  today: string;
  minCells: number;
  maxCells: number;
  maxCapacity: number;
  onApply: (t: Trip) => void;
}) {
  const [draft, setDraft] = useState<Trip>(initial);
  const [undated, setUndated] = useState(!initial.day);
  const [error, setError] = useState(false);
  const set = (p: Partial<Trip>) => {
    setError(false);
    setDraft((d) => ({ ...d, ...p }));
  };
  const lastDay = addDays(today, clock.horizonDays);
  const ok = (day: string, p: Period) => startEligibility(day, p, clock) === "ok";
  const dayOpen = (day: string) => ok(day, "day") || ok(day, "night");
  const days = quickDays(today, 8);

  const pickDay = (day: string | null) => {
    if (!day) return set({ day: null });
    // اگر نیم‌روز فعلی آن روز مجاز نیست (مثلاً «روزِ» امروز پس از مهلت)، نیم‌روز مجاز دیگر انتخاب می‌شود.
    const period = ok(day, draft.period) ? draft.period : ok(day, "night") ? "night" : "day";
    set({ day, period });
  };

  const submit = () => {
    if (!undated && !draft.day) {
      setError(true);
      return;
    }
    onApply({ ...draft, day: undated ? null : draft.day });
  };

  const result: Trip = { ...draft, day: undated ? null : draft.day };
  return (
    <form
      id={TRIP_FORM_ID}
      className="ut-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <section className="ut-form__block">
        <h3 id="ut-guests">چند نفر همسفر هستید؟</h3>
        <div className="ut-form__row">
          <p className="ut-form__help">بزرگسال و کودک، با هم.</p>
          <Stepper
            value={draft.guests}
            min={1}
            max={MAX_GUESTS}
            onChange={(guests) => set({ guests })}
            format={(n) => guestsLabel(n)}
            labelId="ut-guests"
            incLabel="یک نفر بیشتر"
            decLabel="یک نفر کمتر"
          />
        </div>
        {draft.guests > maxCapacity ? (
          <p className="ut-form__warn" role="status">
            <Icon name="info" size={16} /> بزرگ‌ترین ظرفیت ثبت‌شدهٔ یک واحد {guestsLabel(maxCapacity)} است؛ برای گروه
            بزرگ‌تر، چند رزرو جداگانه لازم است.
          </p>
        ) : null}
      </section>

      <section className="ut-form__block">
        <h3>از چه روزی؟</h3>
        <label className="ut-form__toggle">
          <input
            type="checkbox"
            checked={undated}
            onChange={(e) => {
              setError(false);
              setUndated(e.target.checked);
            }}
          />
          <span>تاریخم قطعی نیست؛ نزدیک‌ترین زمان‌ها را ببینیم.</span>
        </label>
        {undated ? null : (
          <>
            <div className="ut-days" role="group" aria-label="روزهای پیش رو">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="ut-day"
                  aria-pressed={draft.day === d}
                  disabled={!dayOpen(d)}
                  onClick={() => pickDay(d)}
                >
                  <small>{d === today ? "امروز" : formatWeekday(d)}</small>
                  <strong>{formatDayNumber(d)}</strong>
                  <small>{formatMonth(d)}</small>
                </button>
              ))}
            </div>
            <div className={cx("ut-form__picker", error && "is-invalid")}>
              <JalaliDatePicker
                anchor="trip-arrival"
                label="روز ورود"
                value={draft.day}
                onChange={pickDay}
                min={today}
                max={lastDay}
                invalid={error}
                placeholder="یا روز دیگری را انتخاب کنید"
              />
            </div>
            {error ? (
              <p className="ut-form__error" role="alert">
                <Icon name="alert" size={16} /> روز ورود را انتخاب کنید، یا «تاریخم قطعی نیست» را بزنید.
              </p>
            ) : null}
            <div className="ut-periods" role="radiogroup" aria-label="نیم‌روز ورود">
              {PERIODS.map((p) => {
                const allowed = draft.day ? ok(draft.day, p.id) : true;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.period === p.id}
                    className="ut-period"
                    disabled={!allowed}
                    onClick={() => set({ period: p.id })}
                  >
                    <Icon name={p.icon} size={18} />
                    <span>
                      <strong>{p.label}</strong>
                      <small>{allowed ? p.hint : "مهلت ثبت گذشته"}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="ut-form__help">
              ثبت رزرو دست‌کم {faDigits(clock.minLeadHours)} ساعت پیش از ورود و تا {faDigits(clock.horizonDays)} روز
              آینده ممکن است.
            </p>
          </>
        )}
      </section>

      <section className="ut-form__block">
        <h3 id="ut-stay">چه مدت می‌مانید؟</h3>
        <div className="ut-form__row">
          <p className="ut-form__help">از نیم‌روز تا {durationLabel(maxCells)}.</p>
          <Stepper
            value={draft.cells}
            min={minCells}
            max={maxCells}
            onChange={(cells) => set({ cells })}
            format={durationLabel}
            labelId="ut-stay"
            incLabel="نیم‌روز بیشتر"
            decLabel="نیم‌روز کمتر"
          />
        </div>
        <div className="ut-presets" role="group" aria-label="مدت‌های پرکاربرد">
          {DURATION_PRESETS.filter((n) => n >= minCells && n <= maxCells).map((n) => (
            <button key={n} type="button" aria-pressed={draft.cells === n} onClick={() => set({ cells: n })}>
              {durationLabel(n)}
            </button>
          ))}
        </div>
      </section>

      <p className="ut-form__summary" aria-live="polite">
        <Icon name="check" size={16} />
        <span>{tripSummary(result)}</span>
      </p>
    </form>
  );
}
