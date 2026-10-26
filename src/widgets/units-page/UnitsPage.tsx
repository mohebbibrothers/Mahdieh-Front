"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { buildTimeline, cellAt } from "@/entities/slot/timeline";
import { openAccount } from "@/features/session/account-store";
import { useEasyMode } from "@/features/easy-mode/easy-mode";
import { retryAfter } from "@/shared/api/client";
import { readPolicies } from "@/shared/api/policies";
import { calendarRangeQuery, configQuery, meQuery, propertyQuery, windowsQuery } from "@/shared/api/queries";
import type { Alternative } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import { faDigits, tehranToday } from "@/shared/lib/fa";
import { UNITS_TRIP_EVENT } from "@/shared/lib/page-events";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useOnline } from "@/shared/lib/use-online";
import { Icon } from "@/shared/ui/Icon";
import { SelectMenu } from "@/shared/ui/SelectMenu";
import { toast } from "@/shared/ui/toast";
import { WaitlistDialog, type WaitlistTarget } from "@/widgets/calendar-page/Dialogs";
import { CompareDialog, CompareTray, PresetsDialog } from "./Compare";
import { availCopy, calendarLink, windowLabel, type Action, type AvailCopy } from "./copy";
import { CLEARED, FilterAside, FilterSheet, type Facets } from "./Filters";
import { UnitsHero, UnitsTips } from "./Hero";
import {
  activeFilterCount,
  availability,
  catalogue,
  comparePresets,
  featureFacets,
  matches,
  MAX_COMPARE,
  rangeDays,
  sharedFeatures,
  sortUnits,
  startEligibility,
  toggleCompare,
  type Availability,
  type CatalogUnit,
  type Clock,
  type Filters,
  type Kind,
  type Sort,
  type Trip,
} from "./model";
import { QuickView } from "./QuickView";
import { TripDialog, TripRibbon } from "./TripDialog";
import { UnitCard } from "./UnitCard";
import { unitsStore, useUnitsState } from "./use-page-state";

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "floor", label: "ترتیب طبقات" },
  { value: "fit", label: "ظرفیت مناسب‌تر" },
  { value: "soon", label: "شروع آزاد زودتر" },
];

/**
 * P-02 واحدهای اقامتی — کاتالوگ زنده (‎/property‎)، آزادی هر واحد برای سفر زائر (‎/calendar/windows‎ و
 * ‎/calendar‎)، پالایش با شمارش وجهی، مقایسهٔ تا سه واحد و نگاه کوتاه با بررسی شخصی سرور.
 * پیش‌رندر ایستا فقط سرصفحه و اسکلت را می‌سازد؛ هر چیز وابسته به «اکنون» پس از hydration.
 */
export function UnitsPage() {
  const now = useHydratedNow(60_000);
  const property = useQuery(propertyQuery);
  const units = catalogue(property.data);
  if (now === null) {
    return (
      <>
        <UnitsHero units={units} avail={null} dated={false} loading onUnit={() => undefined} />
        <div className="page-shell up-shell" aria-busy="true">
          <div className="ut-ribbon ut-ribbon--skeleton skeleton" />
          <SkeletonGrid />
        </div>
      </>
    );
  }
  return <UnitsBody now={now} />;
}

function SkeletonGrid() {
  return (
    <ul className="up-grid up-grid--skeleton" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="uc uc--skeleton">
          <span className="skeleton uc__sk-visual" />
          <span className="skeleton uc__sk-line" />
          <span className="skeleton uc__sk-line uc__sk-line--short" />
          <span className="skeleton uc__sk-line" />
        </li>
      ))}
    </ul>
  );
}

function UnitsBody({ now }: { now: number }) {
  const s = useUnitsState();
  const set = unitsStore.set;
  const easy = useEasyMode();
  const online = useOnline();
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const property = useQuery(propertyQuery);
  const me = useQuery(meQuery);
  const profile = me.data ?? null;
  const units = catalogue(property.data);
  const today = tehranToday(new Date(now));

  const minCells = Math.max(1, policies.minCells);
  const maxCells = Math.max(minCells, policies.maxCells);
  const trip: Trip = { ...s.trip, cells: Math.min(maxCells, Math.max(minCells, s.trip.cells)) };
  const lattice = config.data?.lattice;
  const clock: Clock = {
    now,
    minLeadHours: policies.minLeadHours,
    horizonDays: policies.horizonDays,
    gridStartHour: typeof lattice?.grid_start_hour === "number" ? lattice.grid_start_hour : 8,
    cellHours: typeof lattice?.cell_hours === "number" ? lattice.cell_hours : 12,
  };
  const dated = Boolean(trip.day);
  const gate = trip.day ? startEligibility(trip.day, trip.period, clock) : null;

  // ── داده‌های آزادی (کلیک‌های پیاپی روی شمارنده‌ها ⇒ یک درخواست)
  const q = useDebounced({ guests: trip.guests, cells: trip.cells, day: trip.day, period: trip.period }, 260);
  const windows = useQuery(
    windowsQuery(q.guests, q.cells, q.day && gate === "ok" ? { from: q.day, period: q.period } : undefined),
  );
  const cal = useQuery({
    ...calendarRangeQuery(q.day ?? today, rangeDays(q)),
    enabled: Boolean(q.day) && gate === "ok",
  });
  const timeline = cal.data ? buildTimeline(cal.data) : null;
  const settling =
    JSON.stringify(q) !==
    JSON.stringify({ guests: trip.guests, cells: trip.cells, day: trip.day, period: trip.period });

  const avail = new Map<string, Availability>();
  const copies = new Map<string, AvailCopy>();
  for (const u of units) {
    const a = availability(u, {
      trip,
      clock,
      row: timeline?.units.find((r) => r.code === u.code),
      window: windows.data?.units.find((r) => r.code === u.code),
      calendarState: !dated ? "idle" : settling || cal.isPending ? "loading" : cal.isError ? "error" : "ready",
      windowsState: settling || windows.isPending ? "loading" : windows.isError ? "error" : "ready",
      offline: !online,
    });
    avail.set(u.code, a);
    copies.set(u.code, availCopy(a, trip, policies));
  }

  // ── پالایش با شمارش وجهی (هر شمارنده پالایه‌های دیگر را اعمال می‌کند، نه خودش را)
  const filters: Filters = { kind: s.kind, floor: s.floor, feats: s.feats, freeOnly: s.freeOnly };
  const facetsFor = (f: Filters): Facets => {
    const of = (skip: keyof Filters) => units.filter((u) => matches(u, f, avail.get(u.code), dated, skip));
    const byKind = of("kind");
    const byFloor = of("floor");
    const byFeat = of("feats");
    return {
      kinds: {
        all: byKind.length,
        suite: byKind.filter((u) => u.unit_type === "suite").length,
        large_room: byKind.filter((u) => u.unit_type === "large_room").length,
      } satisfies Record<Kind, number>,
      floors: [...new Set(units.map((u) => u.floor_number))]
        .sort((a, b) => a - b)
        .map((n) => ({ number: n, count: byFloor.filter((u) => u.floor_number === n).length })),
      feats: featureFacets(units).map((ff) => ({
        ...ff,
        count: byFeat.filter(
          (u) =>
            u.features.some((x) => x.code === ff.code) &&
            f.feats.every((c) => c === ff.code || u.features.some((x) => x.code === c)),
        ).length,
      })),
      shared: sharedFeatures(units)
        .map((code) => units[0]?.features.find((x) => x.code === code)?.title ?? "")
        .filter(Boolean),
      dated,
    };
  };
  const countFor = (f: Filters) => units.filter((u) => matches(u, f, avail.get(u.code), dated)).length;
  const facets = facetsFor(filters);
  const visible = sortUnits(
    units.filter((u) => matches(u, filters, avail.get(u.code), dated)),
    s.sort,
    trip.guests,
    avail,
  );
  const activeCount = activeFilterCount(filters, dated);
  const compared = s.compare.map((c) => units.find((u) => u.code === c)).filter((u): u is CatalogUnit => Boolean(u));
  const maxCapacity = Math.max(1, ...units.map((u) => u.capacity_total));

  // ── پنجره‌ها
  const [tripOpen, setTripOpen] = useState(false);
  // «زمان سفر» نوار پایینی گوشی (پوستهٔ مشترک) همین پنجره را باز می‌کند.
  useEffect(() => {
    const open = () => setTripOpen(true);
    window.addEventListener(UNITS_TRIP_EVENT, open);
    return () => window.removeEventListener(UNITS_TRIP_EVENT, open);
  }, []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [waitTarget, setWaitTarget] = useState<WaitlistTarget | null>(null);
  const [pendingWait, setPendingWait] = useState<WaitlistTarget | null>(null);
  const activeWait = waitTarget ?? (profile ? pendingWait : null);
  const quickUnit = quick ? (units.find((u) => u.code === quick) ?? null) : null;

  const setFilters = (patch: Partial<Filters>) => set(patch);
  const setTrip = (t: Trip) => set({ trip: t });

  const onCompare = (code: string) => {
    const r = toggleCompare(s.compare, code);
    if (r.full) {
      toast(`حداکثر ${faDigits(MAX_COMPARE)} واحد را می‌توان کنار هم دید؛ یکی را از سینی مقایسه بردارید.`, "warn");
      return;
    }
    set({ compare: r.list });
  };

  const onAction = (a: Action) => {
    if (a.kind === "pick") {
      setTrip({ ...trip, day: a.window.day, period: a.window.period });
      toast(`زمان سفر روی ${windowLabel(a.window)} تنظیم شد.`, "success");
      setQuick(null);
      setCompareOpen(false);
    } else if (a.kind === "trip") {
      setQuick(null);
      setTripOpen(true);
    }
  };

  const onAlternative = (alt: Alternative) => {
    setTrip({ ...trip, day: alt.start.slice(0, 10), period: alt.start.slice(11, 13) === "20" ? "night" : "day" });
    setQuick(alt.unit_code);
  };

  const waitlistFor = (u: CatalogUnit): (() => void) | null => {
    const a = avail.get(u.code);
    if (!policies.waitlistEnabled || !trip.day || a?.kind !== "busy") return null;
    const row = timeline?.units.find((r) => r.code === u.code);
    const first = row ? cellAt(row, trip.day, trip.period) : undefined;
    const last = row && first ? row.byIndex.get(first.index + trip.cells - 1) : undefined;
    if (!first || !last) return null;
    const target = { unit: u.code, start: first.start, end: last.end, cells: trip.cells };
    return () => {
      setQuick(null);
      if (profile) setWaitTarget(target);
      else {
        setPendingWait(target);
        openAccount({
          reason: "برای ثبت در صف انتظار، با شمارهٔ همراه وارد شوید؛ پیشنهاد سانس به همین شماره پیامک می‌شود.",
        });
      }
    };
  };

  const chooseLabel = (u: CatalogUnit) => {
    const a = avail.get(u.code);
    return a?.kind === "free"
      ? "رزرو همین بازه"
      : a?.kind === "next" || (a?.kind === "busy" && a.nearest)
        ? "انتخاب شروع پیشنهادی"
        : "انتخاب زمان";
  };
  const onChoose = (u: CatalogUnit) => {
    const c = copies.get(u.code);
    setCompareOpen(false);
    if (c?.action.kind === "pick") onAction(c.action);
    else setQuick(u.code);
  };

  const failure = property.error ?? windows.error ?? cal.error;
  const wait = retryAfter(failure);
  const view = easy ? "list" : s.view;

  return (
    <>
      <UnitsHero units={units} avail={avail} dated={dated} loading={property.isPending} onUnit={setQuick} />

      <div className="page-shell up-shell">
        <TripRibbon trip={trip} onOpen={() => setTripOpen(true)} onClear={() => setTrip({ ...trip, day: null })} />

        {wait ? (
          <p className="status-banner up-limit" role="status">
            <Icon name="hourglass" size={18} /> درخواست‌ها موقتاً زیاد شده است؛ زمان‌ها حدود{" "}
            {faDigits(Math.ceil(wait / 60))} دقیقهٔ دیگر دوباره بررسی می‌شوند.
          </p>
        ) : null}

        <div className={cx("up-content", easy && "up-content--easy")}>
          <FilterAside value={filters} onChange={setFilters} facets={facets} activeCount={activeCount} />

          <section
            id="unit-results"
            className="up-results"
            aria-labelledby="up-title"
            aria-busy={property.isPending || settling}
          >
            <header className="up-results__head">
              <div className="up-results__titles">
                <p className="up-kicker">یک انتخاب آرام و آگاهانه</p>
                <h2 id="up-title">
                  واحدهای اقامتی
                  <span className="up-count" aria-live="polite">
                    {property.isPending ? "…" : `${faDigits(visible.length)} واحد`}
                  </span>
                </h2>
              </div>
              {easy ? null : (
                <div className="up-view" role="radiogroup" aria-label="نحوهٔ نمایش">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={s.view === "grid"}
                    onClick={() => set({ view: "grid" })}
                    id="view-grid"
                  >
                    <Icon name="grid" size={18} />
                    <span className="sr-only">نمای کارتی</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={s.view === "list"}
                    onClick={() => set({ view: "list" })}
                    id="view-list"
                  >
                    <Icon name="list" size={18} />
                    <span className="sr-only">نمای فهرستی</span>
                  </button>
                </div>
              )}
            </header>
            <div className="up-tools">
              <button
                type="button"
                className="btn btn-secondary up-filter-btn"
                onClick={() => setSheetOpen(true)}
                id="mobile-filter-open"
              >
                <Icon name="filter" size={18} /> فیلترها
                {activeCount ? <span className="up-badge">{faDigits(activeCount)}</span> : null}
              </button>
              <p className="up-hint">برای مقایسه، دو یا سه واحد را نشانه بزنید.</p>
              <SelectMenu
                label="مرتب‌سازی واحدها"
                layout="inline"
                className="up-sort"
                sheetTitle="ترتیب نمایش واحدها"
                minWidth={220}
                options={SORTS.map((o) => ({ value: o.value, label: o.label }))}
                value={s.sort}
                onChange={(v) => set({ sort: v as Sort })}
              />
            </div>

            {activeCount ? (
              <ul className="up-chips" aria-label="فیلترهای فعال">
                {s.kind !== "all" ? (
                  <Chip onClear={() => set({ kind: "all" })}>{s.kind === "suite" ? "سوئیت" : "اتاق بزرگ"}</Chip>
                ) : null}
                {s.floor ? <Chip onClear={() => set({ floor: 0 })}>طبقهٔ {faDigits(s.floor)}</Chip> : null}
                {s.feats.map((c) => (
                  <Chip key={c} onClear={() => set({ feats: s.feats.filter((x) => x !== c) })}>
                    {facets.feats.find((f) => f.code === c)?.title ?? c}
                  </Chip>
                ))}
                {s.freeOnly && dated ? <Chip onClear={() => set({ freeOnly: false })}>فقط آزادهای بازه</Chip> : null}
                <li>
                  <button type="button" className="up-chips__clear" onClick={() => set(CLEARED)}>
                    پاک کردن همه
                  </button>
                </li>
              </ul>
            ) : null}

            {settling || (windows.isFetching && !windows.isPending) ? (
              <p className="up-refresh" role="status">
                <Icon name="refresh" size={14} /> در حال تازه‌سازی زمان‌ها؛ اطلاعات قبلی هنوز دیده می‌شوند.
              </p>
            ) : null}

            {property.isPending ? (
              <SkeletonGrid />
            ) : property.isError && !units.length ? (
              <div className="up-state" role="alert">
                <Icon name="cloud-off" size={28} />
                <h3>فهرست واحدها دریافت نشد</h3>
                <p>
                  {online ? "ارتباط با سامانه برقرار نشد؛ چند لحظه بعد دوباره امتحان کنید." : "اتصال اینترنت قطع است."}
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => void property.refetch()}>
                  <Icon name="refresh" size={18} /> تلاش دوباره
                </button>
              </div>
            ) : visible.length ? (
              <ul className={cx("up-grid", view === "list" && "up-grid--list")} aria-label="فهرست واحدها">
                {visible.map((u) => (
                  <UnitCard
                    key={u.code}
                    unit={u}
                    copy={copies.get(u.code) ?? availCopy({ kind: "loading" }, trip, policies)}
                    trip={trip}
                    compared={s.compare.includes(u.code)}
                    onCompare={() => onCompare(u.code)}
                    onOpen={() => setQuick(u.code)}
                    onAction={onAction}
                    calendarHref={calendarLink(u.code, trip)}
                  />
                ))}
              </ul>
            ) : (
              <div className="up-state">
                <Icon name="search" size={28} />
                <h3>واحدی با این شرایط پیدا نشد</h3>
                <p>
                  {s.freeOnly && dated
                    ? "در بازهٔ سفر شما واحد آزادی با این فیلترها نیست؛ فیلتر «فقط آزادها» را بردارید تا نزدیک‌ترین شروع هر واحد را ببینید."
                    : "یکی از فیلترها را بردارید تا گزینه‌های بیشتری ببینید."}
                </p>
                <div className="up-state__actions">
                  <button type="button" className="btn btn-secondary" onClick={() => set(CLEARED)}>
                    پاک کردن فیلترها
                  </button>
                  <Link className="btn btn-ghost" href={calendarLink(null, trip)}>
                    <Icon name="calendar" size={18} /> تقویم کامل
                  </Link>
                </div>
              </div>
            )}

            <p className="up-note">
              <Icon name="shield-check" size={16} /> زمان‌های آزاد، تضمین ثبت رزرو نیستند؛ شرایط نهایی پس از ورود بررسی
              می‌شود.
            </p>
          </section>
        </div>
      </div>

      <UnitsTips
        onHelp={() => {
          setPresetsOpen(true);
        }}
      />

      <CompareTray
        units={compared}
        onRemove={(c) => set({ compare: s.compare.filter((x) => x !== c) })}
        onClear={() => set({ compare: [] })}
        onOpen={() => setCompareOpen(true)}
      />

      <TripDialog
        open={tripOpen}
        onOpenChange={setTripOpen}
        trip={trip}
        onApply={setTrip}
        clock={clock}
        today={today}
        minCells={minCells}
        maxCells={maxCells}
        maxCapacity={maxCapacity}
      />
      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        value={filters}
        onApply={(f) => set(f)}
        facetsFor={facetsFor}
        countFor={countFor}
      />
      <QuickView
        unit={quickUnit}
        onClose={() => setQuick(null)}
        trip={trip}
        availability={quickUnit ? avail.get(quickUnit.code) : undefined}
        copy={quickUnit ? copies.get(quickUnit.code) : undefined}
        compared={quickUnit ? s.compare.includes(quickUnit.code) : false}
        compareFull={s.compare.length >= MAX_COMPARE}
        onCompare={() => (quickUnit ? onCompare(quickUnit.code) : undefined)}
        onAction={onAction}
        onAlternative={onAlternative}
        calendarHref={calendarLink(quickUnit?.code ?? null, trip)}
        onWaitlist={quickUnit ? waitlistFor(quickUnit) : null}
      />
      <CompareDialog
        open={compareOpen && compared.length >= 2}
        onOpenChange={setCompareOpen}
        units={compared}
        copies={copies}
        onRemove={(c) => set({ compare: s.compare.filter((x) => x !== c) })}
        onChoose={onChoose}
        chooseLabel={chooseLabel}
      />
      <PresetsDialog
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        presets={comparePresets(units)}
        selected={compared}
        onPick={(codes) => {
          set({ compare: codes });
          setCompareOpen(true);
        }}
        onOpenCurrent={() => setCompareOpen(true)}
      />
      <WaitlistDialog
        target={activeWait}
        onClose={() => {
          setWaitTarget(null);
          setPendingWait(null);
        }}
        units={timeline?.units ?? []}
        guests={trip.guests}
        phone={profile?.phone_masked ?? ""}
        policies={policies}
        onSlotFree={() => void cal.refetch()}
      />
    </>
  );
}

function Chip({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <li className="up-chip">
      <span>{children}</span>
      <button type="button" onClick={onClear}>
        <Icon name="x" size={12} />
        <span className="sr-only">برداشتن فیلتر {children}</span>
      </button>
    </li>
  );
}
