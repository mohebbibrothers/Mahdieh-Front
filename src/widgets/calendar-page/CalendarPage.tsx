"use client";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildTimeline, type UnitTimeline } from "@/entities/slot/timeline";
import { bookingHref } from "@/features/booking-draft/store";
import { openAccount } from "@/features/session/account-store";
import { ApiError, retryAfter } from "@/shared/api/client";
import { readPolicies, type Policies } from "@/shared/api/policies";
import {
  calendarRangeQuery,
  configQuery,
  fetchQuote,
  meQuery,
  occasionsQuery,
  propertyQuery,
  standingQuery,
  windowsQuery,
} from "@/shared/api/queries";
import type { Calendar, CalendarCell, CalendarWindows, Floor, Occasion } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { addDays, faDigits, formatClock, formatDayMonth, tehranToday } from "@/shared/lib/fa";
import { useClock, useHydratedNow } from "@/shared/lib/use-clock";
import { useDebounced } from "@/shared/lib/use-debounced";
import { Icon } from "@/shared/ui/Icon";
import { SHRINE_SVG } from "@/shared/ui/shrine.generated";
import { Discovery } from "./Discovery";
import { GuideDialog, OccasionDialog, WaitlistDialog, type WaitlistTarget } from "./Dialogs";
import { DayView } from "./DayView";
import { Legend, Matrix } from "./Matrix";
import {
  alternatives as altsOf,
  clampFrom,
  clickCell,
  evaluateSelection,
  occasionChips,
  occasionsByDay,
  rangeStats,
  shiftRange,
  slotState,
  spanDays,
  visibleUnits,
  type Chip,
  type Clock,
  type RangeStats,
  type Selection,
} from "./model";
import { SelectionDrawer } from "./SelectionDrawer";
import { Toolbar } from "./Toolbar";
import { pageStore, usePageState } from "./use-page-state";

/* ── ابزارهای کوچک ──────────────────────────────────────────────────────── */

/** ثانیه‌های انتظار پیشنهادی سرور: ۴۲۹ ⇒ ‎body.retry_after‎؛ ۵۰۳ ⇒ همان یا ۳۰ ثانیه. */

/** ادغام دو پاسخ تقویم (بازهٔ نمایش + بازهٔ انتخاب بیرون از آن) بی تکرار روز. */
function mergeCalendars(a: Calendar | undefined, b: Calendar | undefined): Calendar | undefined {
  if (!a || !b) return a ?? b;
  const seen = new Set(a.days.map((d) => d.day));
  const days = [...a.days, ...b.days.filter((d) => !seen.has(d.day))].sort((x, y) => x.day.localeCompare(y.day));
  return { ...a, days };
}

const scrollToId = (id: string) =>
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });

/* ── صفحه ───────────────────────────────────────────────────────────────── */

/**
 * P-04 تقویم موجودی و کشف زمان‌های آزاد — همهٔ داده‌ها زنده از ‎/calendar‎، ‎/calendar/windows‎ و ‎/occasions‎.
 *
 * پیش‌رندر ایستا فقط سرصفحهٔ بی‌تاریخ و اسکلت را می‌سازد؛ هر چیز وابسته به «امروز» (بازه، برچسب
 * تاریخ، وضعیت نیم‌روزها) پس از hydration با ساعت واقعی کاربر رندر می‌شود — نه با روز ساخت.
 */
export function CalendarPage() {
  const now = useHydratedNow(30_000);
  return now === null ? <CalendarShell /> : <CalendarBody now={now} />;
}

/** پیش از شناختن «اکنون»: همان سرصفحه + اسکلت هم‌اندازهٔ آمار و تخته (بی‌پرش چیدمان). */
function CalendarShell() {
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const property = useQuery(propertyQuery);
  return (
    <>
      <CalendarHero policies={policies} property={property.data} />
      <div className="page-shell cp-shell" aria-busy="true">
        <section className="cp-kpis" aria-label="آمار کلیدی بازهٔ جاری">
          {Array.from({ length: 4 }, (_, i) => (
            <article key={i} className="cp-kpi">
              <span className="cp-kpi__value cp-kpi__value--skeleton" aria-hidden="true" />
            </article>
          ))}
        </section>
        <section className="cp-board" aria-label="در حال آماده‌سازی تقویم">
          <div className="cp-skeleton" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function CalendarBody({ now }: { now: number }) {
  const s = usePageState();
  const set = pageStore.set;
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const property = useQuery(propertyQuery);
  const me = useQuery(meQuery);
  const profile = me.data ?? null;
  const standing = useQuery({ ...standingQuery, enabled: Boolean(profile) });

  const today = tehranToday(new Date(now));
  const from = clampFrom(s.from, today, policies.horizonDays, s.days);
  const lastFrom = clampFrom("9999-12-31", today, policies.horizonDays, s.days);
  const horizonLast = addDays(today, policies.horizonDays);
  const to = addDays(from, s.days - 1);
  const leadHours = policies.minLeadHours;
  const horizonDays = policies.horizonDays;
  const clock: Clock = { now, minLeadHours: leadHours, horizonDays };

  // ── داده‌ها
  const cal = useQuery(calendarRangeQuery(from, s.days));
  const sel = s.selection;
  const selSpan = sel ? spanDays(sel.cells) : 0;
  const selInside = Boolean(sel && sel.day >= from && addDays(sel.day, selSpan - 1) <= to);
  const selCal = useQuery({
    ...calendarRangeQuery(sel?.day ?? from, Math.min(62, Math.max(1, selSpan))),
    enabled: Boolean(sel) && !selInside,
  });
  const occasions = useQuery(occasionsQuery(from, to));
  // شمارنده‌های «کشف سریع» با چند کلیک پیاپی فقط یک درخواست می‌فرستند (نه یکی به ازای هر کلیک).
  const windowsKey = useDebounced({ guests: s.guests, stay: Math.min(s.stay, policies.maxCells) }, 280);
  const windows = useQuery(windowsQuery(windowsKey.guests, windowsKey.stay));

  const timeline = cal.data ? buildTimeline(cal.data) : null;
  const merged = mergeCalendars(cal.data, selInside ? undefined : selCal.data);
  const full = merged ? buildTimeline(merged) : null;
  const units = timeline ? visibleUnits(timeline, { unit: s.unit, floor: s.floor }) : [];
  const days = timeline?.days.filter((d) => d.day >= from && d.day <= to) ?? [];
  const stats: RangeStats | null = timeline ? rangeStats(units, days, clock) : null;
  const occ = occasions.data ?? [];
  const chips = occasionChips(days, occ);
  const occDays = occasionsByDay(occ);
  const startHour = cal.data?.lattice.grid_start_hour ?? 8;
  const cellHours = cal.data?.lattice.cell_hours ?? 12;
  const maxGuests = Math.max(1, ...(timeline?.units.map((u) => u.capacity) ?? [8]));
  const maxCells = cal.data?.max_cells ?? policies.maxCells;
  const minCells = cal.data?.min_cells ?? policies.minCells;
  const view = s.view ?? "matrix";

  // ── انتخاب
  const selUnit = sel ? full?.units.find((u) => u.code === sel.unit) : undefined;
  const evaluation = sel ? evaluateSelection(selUnit, sel, s.guests, clock) : null;
  const alts =
    sel && full && evaluation && evaluation.verdict.kind !== "ok" && evaluation.verdict.kind !== "loading"
      ? altsOf(full, sel, s.guests, clock)
      : [];
  const quoteBody = useDebounced(
    profile && evaluation?.verdict.kind === "ok" && evaluation.start && evaluation.end && sel
      ? { unit_code: sel.unit, start: evaluation.start.start, end: evaluation.end.end, guests_count: s.guests }
      : null,
    350,
  );
  const quote = useQuery({
    queryKey: ["me", "quote", quoteBody],
    queryFn: () => fetchQuote(quoteBody ?? { unit_code: "", start: "", end: "", guests_count: 1 }),
    enabled: Boolean(quoteBody),
    staleTime: 15_000,
    retry: false,
  });

  // ── پیمایش و فوکوس روز
  const [focusDay, setFocusDay] = useState<{ day: string; nonce: number } | null>(null);
  const [activeDayRaw, setActiveDay] = useState<string | null>(null);
  const activeDay =
    activeDayRaw && activeDayRaw >= from && activeDayRaw <= to ? activeDayRaw : from >= today ? from : today;

  const showDay = (day: string) => {
    if (day < from || day > to) set({ from: clampFrom(day, today, policies.horizonDays, s.days) });
    setActiveDay(day);
    setFocusDay((prev) => ({ day, nonce: (prev?.nonce ?? 0) + 1 }));
    scrollToId("cp-board");
  };

  const onCell = (unit: UnitTimeline, cell: CalendarCell) => {
    set({ selection: clickCell(sel, unit, cell, Math.max(s.stay, minCells), maxCells) });
  };

  const pickSelection = (next: Selection) => {
    set({ selection: next });
    showDay(next.day);
  };

  // ── دیالوگ‌ها
  const [guide, setGuide] = useState(false);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [waitTarget, setWaitTarget] = useState<WaitlistTarget | null>(null);
  const [pendingWait, setPendingWait] = useState<WaitlistTarget | null>(null);

  const askWaitlist = (target: WaitlistTarget) => {
    if (profile) setWaitTarget(target);
    else {
      setPendingWait(target);
      openAccount({
        reason: "برای ثبت در صف انتظار، با شمارهٔ همراه وارد شوید؛ پیشنهاد سانس به همین شماره پیامک می‌شود.",
      });
    }
  };
  // پس از ورود موفق، همان درخواست صف انتظار خودکار باز می‌شود (حالت مشتق، نه اثر جانبی)
  const activeWait = waitTarget ?? (profile ? pendingWait : null);

  const onChip = (c: Chip) => {
    if (c.kind === "occasion") setOccasion(c.occasion);
    else showDay(c.days[0] ?? from);
  };

  const pickWindow = (u: CalendarWindows["units"][number]) => {
    const w = u.window;
    if (!w) return;
    pickSelection({
      unit: u.code,
      day: w.day,
      period: w.period,
      cells: Math.max(minCells, Math.min(s.stay, w.bookable_cells)),
    });
  };
  const waitWindow = (u: CalendarWindows["units"][number]) => {
    // نخستین نیم‌روز قابل‌انتخاب همین واحد در بازهٔ جاری ⇒ کشو با تعارض و مسیر صف انتظار
    const row = timeline?.units.find((x) => x.code === u.code);
    const cell = row?.cells.find((c) => {
      const st = slotState(c, clock);
      return st !== "past" && st !== "soon" && c.start.slice(0, 10) >= from;
    });
    if (cell)
      pickSelection({
        unit: u.code,
        day: cell.start.slice(0, 10),
        period: cell.kind,
        cells: Math.min(s.stay, maxCells),
      });
  };

  // ── وضعیت خطا/محدودیت با شمارش معکوس
  const wait = retryAfter(cal.error);
  const tick = useClock(wait !== null);
  const remaining = wait !== null ? Math.max(0, Math.ceil((cal.errorUpdatedAt + wait * 1000 - tick) / 1000)) : 0;
  const { refetch } = cal;
  useEffect(() => {
    if (wait !== null && remaining === 0 && tick > 0) void refetch();
  }, [wait, remaining, tick, refetch]);

  const refreshing = cal.isFetching && Boolean(cal.data);
  const updatedAt = cal.dataUpdatedAt ? formatClock(new Date(cal.dataUpdatedAt).toISOString()) : null;
  const blockers = profile && standing.data && !standing.data.can_book ? standing.data.blockers : [];
  const portal = destHref("portal");

  return (
    <>
      <CalendarHero
        policies={policies}
        property={property.data}
        unitsLive={timeline?.units.length}
        startHour={startHour}
        cellHours={cellHours}
      />

      <div className="page-shell cp-shell">
        {/* ── اعلان‌های وضعیت ── */}
        {wait !== null ? (
          <div className="cp-alert" data-tone="warn" role="status">
            <Icon name="hourglass" size={20} />
            <p>
              {cal.error instanceof ApiError && cal.error.status === 429
                ? "درخواست‌های پیاپی زیاد بود؛ برای حفظ پایداری سامانه کمی صبر کنید."
                : "سامانه موقتاً در دسترس نیست (به‌روزرسانی یا بار زیاد)."}{" "}
              تلاش خودکار تا <bdi>{faDigits(remaining)}</bdi> ثانیهٔ دیگر.
              {cal.data ? " تا آن زمان آخرین وضعیت دریافت‌شده نمایش داده می‌شود." : ""}
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => void refetch()}
              disabled={remaining > 0}
            >
              <Icon name="refresh" size={16} /> تلاش دوباره
            </button>
          </div>
        ) : cal.isError && !cal.data ? (
          <div className="cp-alert" data-tone="danger" role="alert">
            <Icon name="cloud-off" size={20} />
            <p>تقویم دریافت نشد. اتصال اینترنت را بررسی کنید و دوباره بکوشید.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void refetch()}>
              <Icon name="refresh" size={16} /> تلاش دوباره
            </button>
          </div>
        ) : null}
        {blockers.length ? (
          <div className="cp-alert" data-tone="info" role="status">
            <Icon name="info" size={20} />
            <p>{blockers[0]?.message} تقویم را می‌توانید ببینید و در صف انتظار بمانید.</p>
            {portal ? (
              <Link className="btn btn-outline btn-sm" href={portal as Route}>
                رزروهای من
              </Link>
            ) : null}
          </div>
        ) : null}

        {/* ── شاخص‌ها ── */}
        <section className="cp-kpis" aria-label="آمار کلیدی بازهٔ جاری" aria-busy={!stats || undefined}>
          <Kpi
            label="نیم‌روزهای آزاد"
            icon="calendar-check"
            tone="brand"
            value={stats ? faDigits(stats.free) : null}
            hint={stats ? `از ${faDigits(stats.considered)} نیم‌روز پیش‌روی این بازه، آمادهٔ رزرو` : ""}
          />
          <Kpi
            label="نرخ اشغال بازه"
            icon="users"
            value={stats ? `${faDigits(Math.round(stats.occupancy * 100))}٪` : null}
            hint={stats ? `میانگین ${faDigits(stats.units)} واحد در نمایش` : ""}
            meter={stats?.occupancy}
          />
          <Kpi
            label="روزهای کاملاً آزاد"
            icon="sun"
            value={stats ? faDigits(stats.fullyFreeDays) : null}
            hint="روزهایی که همهٔ واحدهای نمایش در هر دو سانس آزادند"
          />
          <Kpi
            label="واحدهای در نمایش"
            icon="building"
            value={stats ? faDigits(stats.units) : null}
            hint={
              stats
                ? [
                    stats.suites ? `${faDigits(stats.suites)} سوئیت` : "",
                    stats.rooms ? `${faDigits(stats.rooms)} اتاق بزرگ` : "",
                  ]
                    .filter(Boolean)
                    .join(" و ")
                : ""
            }
          />
        </section>

        <Toolbar
          from={from}
          today={today}
          lastFrom={lastFrom}
          horizonLast={horizonLast}
          days={s.days}
          unit={s.unit}
          floor={s.floor}
          view={view}
          units={timeline?.units ?? []}
          chips={chips}
          onPrev={() => set({ from: shiftRange(from, -s.days, today, policies.horizonDays, s.days) })}
          onToday={() => {
            set({ from: null });
            setActiveDay(null);
          }}
          onNext={() => set({ from: shiftRange(from, s.days, today, policies.horizonDays, s.days) })}
          onDays={(d) => set({ days: d })}
          onUnit={(u) => set({ unit: u, floor: 0 })}
          onFloor={(f) => set({ floor: f, unit: "" })}
          onView={(v) => set({ view: v })}
          day={activeDay}
          onJump={(d) => showDay(d)}
          onChip={onChip}
        />

        <section className="cp-board" id="cp-board" aria-labelledby="cp-board-title" data-view={view}>
          <header className="cp-board__head">
            <h2 id="cp-board-title">
              {formatDayMonth(from)} تا {formatDayMonth(to)}
            </h2>
            <p className="cp-board__live" data-stale={cal.isError || undefined}>
              <span className="cp-live-dot" aria-hidden="true" />
              {refreshing ? "در حال به‌روزرسانی…" : updatedAt ? `به‌روز شده ساعت ${updatedAt}` : "در حال دریافت…"}
              <span className="cp-board__auto"> · بازبینی خودکار هر دقیقه</span>
            </p>
          </header>
          {!timeline ? (
            cal.isError ? null : (
              <div className="cp-skeleton" aria-busy="true" aria-label="در حال دریافت تقویم">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
            )
          ) : units.length === 0 ? (
            <div className="cp-empty">
              <Icon name="search" size={24} />
              <p>هیچ واحدی با این فیلتر نیست.</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ unit: "", floor: 0 })}>
                نمایش همهٔ واحدها
              </button>
            </div>
          ) : (
            <>
              {stats && stats.free === 0 ? (
                <div className="cp-alert cp-alert--inline" data-tone="info" role="status">
                  <Icon name="calendar-x" size={20} />
                  <p>
                    در این بازه هیچ نیم‌روز آزادی برای رزرو نمانده است. بازهٔ بعد یا «کشف سریع» را ببینید، یا روی
                    خانه‌ای رزروشده بزنید و در صف انتظار بمانید.
                  </p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => scrollToId("discovery")}>
                    نخستین زمان آزاد
                  </button>
                </div>
              ) : null}
              {view === "matrix" ? (
                <Matrix
                  days={days}
                  units={units}
                  clock={clock}
                  selection={sel}
                  guests={s.guests}
                  occDays={occDays}
                  today={today}
                  startHour={startHour}
                  cellHours={cellHours}
                  refreshing={refreshing}
                  focusDay={focusDay}
                  onCell={onCell}
                />
              ) : (
                <DayView
                  days={days}
                  units={units}
                  allUnits={timeline.units}
                  filter={{ unit: s.unit, floor: s.floor }}
                  onShowAll={() => set({ unit: "", floor: 0 })}
                  clock={clock}
                  selection={sel}
                  guests={s.guests}
                  occDays={occDays}
                  today={today}
                  startHour={startHour}
                  cellHours={cellHours}
                  activeDay={activeDay}
                  onDay={setActiveDay}
                  onCell={onCell}
                />
              )}
            </>
          )}
          <Legend onGuide={() => setGuide(true)} />
        </section>

        <Discovery
          data={windows.data}
          loading={windows.isFetching}
          error={windows.isError}
          guests={s.guests}
          stay={s.stay}
          maxGuests={maxGuests}
          maxCells={maxCells}
          minCells={minCells}
          selectedUnit={sel?.unit ?? null}
          onGuests={(g) => set({ guests: g })}
          onStay={(n) => set({ stay: n })}
          onPick={pickWindow}
          onWaitlist={waitWindow}
          onRetry={() => void windows.refetch()}
        />
      </div>

      {sel && evaluation ? (
        <SelectionDrawer
          selection={sel}
          unit={selUnit}
          evaluation={evaluation}
          guests={s.guests}
          maxGuests={maxGuests}
          maxCells={maxCells}
          minCells={minCells}
          quote={quoteBody ? quote.data : undefined}
          quoteLoading={quote.isFetching}
          alternatives={alts}
          bookingHref={bookingHref(sel.unit, { day: sel.day, period: sel.period, cells: sel.cells, guests: s.guests })}
          waitlistEnabled={policies.waitlistEnabled}
          onCells={(n) => set({ selection: { ...sel, cells: n } })}
          onGuests={(g) => set({ guests: g })}
          onAlternative={pickSelection}
          onWaitlist={() =>
            evaluation.start && evaluation.end
              ? askWaitlist({
                  unit: sel.unit,
                  start: evaluation.start.start,
                  end: evaluation.end.end,
                  cells: sel.cells,
                })
              : undefined
          }
          onCancel={() => set({ selection: null })}
        />
      ) : null}

      <WaitlistDialog
        target={activeWait}
        onClose={() => {
          setWaitTarget(null);
          setPendingWait(null);
        }}
        units={timeline?.units ?? []}
        guests={s.guests}
        phone={profile?.phone_masked ?? ""}
        policies={policies}
        onSlotFree={() => void cal.refetch()}
      />
      <OccasionDialog occasion={occasion} policies={policies} onClose={() => setOccasion(null)} onShow={showDay} />
      <GuideDialog
        open={guide}
        onClose={() => setGuide(false)}
        policies={policies}
        startHour={startHour}
        cellHours={cellHours}
      />
    </>
  );
}

/** سرصفحهٔ بی‌تاریخ (پیش‌رندر می‌شود): شمار واحد/طبقه از ‎/property‎ و شبکهٔ نیم‌روز از ‎/calendar‎. */
function CalendarHero({
  policies,
  property,
  unitsLive,
  startHour = 8,
  cellHours = 12,
}: {
  policies: Policies;
  property: Floor[] | undefined;
  unitsLive?: number | undefined;
  startHour?: number;
  cellHours?: number;
}) {
  const allUnits = (property ?? []).flatMap((f) => f.units);
  const totalCapacity = allUnits.reduce((n, u) => n + u.capacity_total, 0);
  const floorsCount = property?.length ?? 0;
  const unitsCount = unitsLive ?? allUnits.length;
  return (
    <section className="booking-hero cp-hero" aria-labelledby="cp-title">
      <div className="booking-hero__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHRINE_SVG }} />
      <div className="page-shell booking-hero__inner">
        <nav className="crumbs" aria-label="مسیر صفحه">
          <ol>
            <li>
              <Link href="/">صفحهٔ نخست</Link>
            </li>
            <li>
              <Link href={destHref("units") as Route}>واحدهای اقامتی</Link>
            </li>
            <li aria-current="page">تقویم موجودی و کشف زمان‌های آزاد</li>
          </ol>
        </nav>
        <p className="eyebrow">
          <span className="eyebrow__rule" aria-hidden="true" />
          شفافیت و عدالت در میزبانی
        </p>
        <h1 id="cp-title" className="booking-hero__title">
          تقویم موجودی و <em>کشف زمان‌های آزاد</em>
        </h1>
        <p className="booking-hero__lead">
          یک نگاه پیوسته به وضعیت {unitsCount ? faDigits(unitsCount) : "همهٔ"} واحد اقامتی در افق{" "}
          {faDigits(policies.horizonDays)} روزه. هر شبانه‌روز دو سانس {faDigits(cellHours)} ساعته دارد (روزانه از{" "}
          <bdi>{faDigits(String(startHour).padStart(2, "0"))}:۰۰</bdi> و شبانه از{" "}
          <bdi>{faDigits(String((startHour + cellHours) % 24).padStart(2, "0"))}:۰۰</bdi>). همهٔ خدمات و اقامت در مهدیه
          رایگان است.
        </p>
        <ul className="trust-pills" aria-label="ویژگی‌های رزرو">
          <li>
            <Icon name="heart-hand" size={16} />
            اقامت ۱۰۰٪ رایگان و عام‌المنفعه
          </li>
          <li>
            <Icon name="clock" size={16} />
            شبکهٔ نیم‌روز {faDigits(cellHours)} ساعته
          </li>
          <li>
            <Icon name="calendar-check" size={16} />
            افق رزرو تا {faDigits(policies.horizonDays)} روز آینده
          </li>
          {floorsCount ? (
            <li>
              <Icon name="building" size={16} />
              {faDigits(floorsCount)} طبقه · {faDigits(unitsCount)} واحد · ظرفیت {faDigits(totalCapacity)} زائر
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function Kpi({
  label,
  icon,
  value,
  hint,
  tone,
  meter,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  value: string | null;
  hint: string;
  tone?: "brand";
  meter?: number | undefined;
}) {
  return (
    <article className="cp-kpi" data-tone={tone}>
      <div className="cp-kpi__top">
        <span className="cp-kpi__label">{label}</span>
        <span className="cp-kpi__icon" aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
      </div>
      {value === null ? (
        <span className="cp-kpi__value cp-kpi__value--skeleton" aria-hidden="true" />
      ) : (
        <strong className="cp-kpi__value">{value}</strong>
      )}
      {meter !== undefined ? (
        <progress
          className="cp-kpi__meter"
          max={100}
          value={Math.round(meter * 100)}
          aria-label={`نرخ اشغال ${faDigits(Math.round(meter * 100))} درصد`}
        />
      ) : null}
      <span className="cp-kpi__hint">{hint}</span>
    </article>
  );
}
