"use client";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { Button, Dialog, DialogTrigger, Heading, Popover } from "react-aria-components";
import { cellAt, type Period } from "@/entities/slot/timeline";
import { floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import { bookingHref, draftStore } from "@/features/booking-draft/store";
import { PICKABLE_DAYS, useAvailability, type UnitResult } from "@/features/booking-draft/use-availability";
import { propertyQuery } from "@/shared/api/queries";
import { cx } from "@/shared/lib/cx";
import {
  cellsLabel,
  durationLabel,
  faDigits,
  formatClock,
  formatDayLabel,
  formatDayNumber,
  formatMoment,
  formatMonth,
  formatWeekday,
  guestsLabel,
} from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

export function QuickSearch() {
  const id = useId();
  const { timeline, draft, results, policies, calendar } = useAvailability();
  const resultsRef = useRef<HTMLDivElement>(null);
  const maxGuests = timeline ? Math.max(...timeline.units.map((u) => u.capacity)) : 8;
  const maxCells = Math.min(policies.maxCells, timeline?.maxCells ?? policies.maxCells);

  const startCell = timeline?.units.map((u) => (draft.day ? cellAt(u, draft.day, draft.period) : undefined)).find(Boolean);
  const arrivalHelp = startCell
    ? `سانس ${draft.period === "day" ? "روز" : "شب"} · ساعت ${formatClock(startCell.start)}`
    : draft.period === "day"
      ? "سانس روز · ساعت ۰۸:۰۰"
      : "سانس شب · ساعت ۲۰:۰۰";

  return (
    <section className="container search-wrap" id="quick-search" aria-labelledby={`${id}-title`}>
      <div className="search-card">
        <div className="search-heading">
          <h2 id={`${id}-title`}>
            <Icon name="compass" size={20} /> شروع یک سفرِ آسوده
          </h2>
          <p>
            <Icon name="shield-check" size={16} /> برای دیدن زمان‌های آزاد، نیازی به ورود نیست
          </p>
        </div>

        <form
          className="search-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            draftStore.set({ searched: true });
            requestAnimationFrame(() => resultsRef.current?.focus({ preventScroll: true }));
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }}
        >
          <div className="form-field">
            <span className="field-label" id={`${id}-guests`}>
              چند نفر هستید؟
            </span>
            <Stepper
              value={Math.min(draft.guests, maxGuests)}
              min={1}
              max={maxGuests}
              onChange={(guests) => draftStore.set({ guests })}
              format={guestsLabel}
              labelId={`${id}-guests`}
              incLabel="افزایش تعداد نفرات"
              decLabel="کاهش تعداد نفرات"
            />
            <span className="field-help">تعداد کل همراهان، با کودکان</span>
          </div>

          <div className="form-field">
            <span className="field-label" id={`${id}-arrival`}>
              از چه زمانی؟
            </span>
            <DialogTrigger>
              <Button className="field-button" aria-labelledby={`${id}-arrival ${id}-arrival-value`}>
                <span className="field-value">
                  <span id={`${id}-arrival-value`}>{draft.day ? formatDayLabel(draft.day) : "در حال دریافت…"}</span>
                  <Icon name="chevron-down" size={18} />
                </span>
              </Button>
              <Popover placement="bottom" offset={8} className="popover popover--date">
                <Dialog className="popover__dialog" aria-label="انتخاب زمان ورود">
                  {({ close }) => <ArrivalPicker onDone={close} />}
                </Dialog>
              </Popover>
            </DialogTrigger>
            <span className="field-help">{arrivalHelp}</span>
          </div>

          <div className="form-field">
            <span className="field-label" id={`${id}-duration`}>
              چه مدت می‌مانید؟
            </span>
            <DialogTrigger>
              <Button className="field-button" aria-labelledby={`${id}-duration ${id}-duration-value`}>
                <span className="field-value">
                  <span id={`${id}-duration-value`}>{durationLabel(draft.cells)}</span>
                  <Icon name="chevron-down" size={18} />
                </span>
              </Button>
              <Popover placement="bottom" offset={8} className="popover popover--duration">
                <Dialog className="popover__dialog" aria-label="انتخاب مدت اقامت">
                  {({ close }) => (
                    <>
                      <Heading slot="title" className="popover__title">
                        مدت اقامتتان را انتخاب کنید
                      </Heading>
                      <div className="duration-options">
                        {Array.from({ length: maxCells - policies.minCells + 1 }, (_, i) => i + policies.minCells).map(
                          (n) => (
                            <button
                              key={n}
                              type="button"
                              className="chip-option"
                              aria-pressed={draft.cells === n}
                              onClick={() => {
                                draftStore.set({ cells: n });
                                close();
                              }}
                            >
                              <strong>{durationLabel(n)}</strong>
                              <small>{cellsLabel(n)}</small>
                            </button>
                          ),
                        )}
                      </div>
                      <p className="popover__note">
                        هر نیم‌روز ۱۲ ساعت است؛ کوتاه‌ترین اقامت {durationLabel(policies.minCells)} و بلندترین{" "}
                        {durationLabel(maxCells)}.
                      </p>
                    </>
                  )}
                </Dialog>
              </Popover>
            </DialogTrigger>
            <span className="field-help">
              {cellsLabel(draft.cells)} · تا {durationLabel(maxCells)}
            </span>
          </div>

          <div className="search-submit">
            <button type="submit" className="btn btn-primary btn-search" disabled={!timeline}>
              بررسی زمان‌های آزاد
              <Icon name="arrow-left" size={18} />
            </button>
          </div>
        </form>

        <p className="form-note">
          <Icon name="info" size={16} /> کوتاه‌ترین اقامت {durationLabel(policies.minCells)} و بلندترین{" "}
          {durationLabel(policies.maxCells)} است. ساعت دقیق ورود و خروج پیش از تأیید نمایش داده می‌شود.
        </p>

        <div ref={resultsRef} tabIndex={-1} className="search-results" aria-live="polite" aria-busy={calendar.isFetching}>
          <AnimatePresence initial={false}>
            {draft.searched && results.length ? <SearchResults key="results" results={results} /> : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ArrivalPicker({ onDone }: { onDone: () => void }) {
  const { timeline, draft } = useAvailability();
  const days = timeline?.days.slice(0, PICKABLE_DAYS) ?? [];
  const setDay = (day: string, period: Period = draft.period) => draftStore.set({ day, period });
  return (
    <>
      <Heading slot="title" className="popover__title">
        چه روزی به مشهد می‌رسید؟
      </Heading>
      <div className="date-options" role="group" aria-label="روز ورود">
        {days.map((d) => (
          <button
            key={d.day}
            type="button"
            className="date-option"
            aria-pressed={draft.day === d.day}
            data-demand={d.demand_level}
            onClick={() => setDay(d.day)}
            aria-label={`${formatDayLabel(d.day)}، ${faDigits(d.free_cells)} نیم‌روز آزاد از ${faDigits(d.total_cells)}`}
          >
            <small>{formatWeekday(d.day)}</small>
            <strong>{formatDayNumber(d.day)}</strong>
            <small>{formatMonth(d.day)}</small>
            <span className="date-option__meter" data-level={d.free_cells === 0 ? "none" : d.free_cells < d.total_cells / 2 ? "low" : "ok"} />
          </button>
        ))}
      </div>
      <div className="segment segment--wide" role="group" aria-label="نوبت ورود">
        <button type="button" aria-pressed={draft.period === "day"} onClick={() => draftStore.set({ period: "day" })}>
          <Icon name="sun" size={16} /> روز، از ۰۸:۰۰
        </button>
        <button type="button" aria-pressed={draft.period === "night"} onClick={() => draftStore.set({ period: "night" })}>
          <Icon name="moon" size={16} /> شب، از ۲۰:۰۰
        </button>
      </div>
      <p className="popover__note">
        نوار زیر هر روز، میزان آزادی آن روز را نشان می‌دهد. برای روزهای دورتر{" "}
        <a href="/calendar/" className="text-link">
          تقویم کامل
        </a>{" "}
        را ببینید.
      </p>
      <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
        تأیید زمان ورود <Icon name="check" size={18} />
      </button>
    </>
  );
}

function SearchResults({ results }: { results: UnitResult[] }) {
  const reduce = useReducedMotion();
  const { draft, timeline } = useAvailability();
  const property = useQuery(propertyQuery);
  const units = new Map(timeline?.units.map((u) => [u.code, u]));
  const ok = results.filter((r) => r.verdict.kind === "ok");
  const rest = results.filter((r) => r.verdict.kind !== "ok");
  const highlight = (code: string) =>
    property.data?.flatMap((f) => f.units).find((u) => u.code === code)?.features.filter((f) => f.is_highlight).slice(0, 2) ?? [];

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="results"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: reduce ? 0 : 0.32, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <p className="results__summary">
        {ok.length ? (
          <>
            <Icon name="check" size={18} />
            <strong>{faDigits(ok.length)} واحد</strong> برای {durationLabel(draft.cells)} از{" "}
            {draft.day ? formatDayLabel(draft.day) : ""} مناسب است.
          </>
        ) : (
          <>
            <Icon name="info" size={18} />
            برای این بازه واحد مناسبی نیست؛ نزدیک‌ترین زمان‌های آزاد را ببینید.
          </>
        )}
      </p>
      <motion.ul className="results__list" initial="hidden" animate="show" transition={{ staggerChildren: reduce ? 0 : 0.05 }}>
        {ok.map((r) => {
          const u = units.get(r.code);
          if (!u) return null;
          return (
            <motion.li key={r.code} variants={item} className="result-card" data-kind="ok">
              <span className="result-card__icon">
                <Icon name={unitTypeIcon(u.unitType)} size={22} />
              </span>
              <div className="result-card__body">
                <strong>{u.title}</strong>
                <small>
                  {floorLabel(u.floor)} · تا {faDigits(u.capacity)} نفر
                  {highlight(u.code).map((f) => ` · ${f.title}`)}
                </small>
              </div>
              <div className="result-card__actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => draftStore.set({ openUnit: u.code })}>
                  جزئیات
                </button>
                <a className="btn btn-primary btn-sm" href={bookingHref(u.code, draft)}>
                  ادامه با این واحد <Icon name="arrow-left" size={16} />
                </a>
              </div>
            </motion.li>
          );
        })}
        {rest.map((r) => {
          const u = units.get(r.code);
          if (!u) return null;
          const reason =
            r.verdict.kind === "capacity"
              ? `ظرفیت ${faDigits(r.verdict.capacity)} نفر است`
              : r.verdict.kind === "lead"
                ? "زمان ورود از مهلت رزرو گذشته است"
                : r.verdict.kind === "beyond"
                  ? "بازه از تقویم این صفحه بیرون است"
                  : "بخشی از بازه آزاد نیست";
          return (
            <motion.li key={r.code} variants={item} className="result-card" data-kind="no">
              <span className="result-card__icon">
                <Icon name={r.verdict.kind === "capacity" ? "users" : "lock"} size={20} />
              </span>
              <div className="result-card__body">
                <strong>{u.title}</strong>
                <small>{reason}</small>
              </div>
              <div className="result-card__actions">
                {r.nearest ? (
                  <button
                    type="button"
                    className={cx("btn btn-secondary btn-sm")}
                    onClick={() => {
                      if (!r.nearest) return;
                      draftStore.set({ day: r.nearest.day, period: r.nearest.period, openUnit: u.code });
                    }}
                  >
                    نزدیک‌ترین: {formatMoment(r.nearest.startIso)}
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => draftStore.set({ openUnit: u.code })}>
                    جزئیات
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}
