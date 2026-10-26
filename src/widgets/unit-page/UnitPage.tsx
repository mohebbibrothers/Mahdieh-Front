"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { buildTimeline, cellAt, type Period } from "@/entities/slot/timeline";
import { useEasyMode } from "@/features/easy-mode/easy-mode";
import { openAccount } from "@/features/session/account-store";
import { ApiError, retryAfter } from "@/shared/api/client";
import { readPolicies } from "@/shared/api/policies";
import {
  calendarRangeQuery,
  configQuery,
  fetchQuote,
  meQuery,
  occasionsQuery,
  propertyQuery,
  standingQuery,
  unitQuery,
  windowsQuery,
} from "@/shared/api/queries";
import type { CalendarCell, FreeWindow, UnitDetail } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import { addDays, faDigits, tehranToday } from "@/shared/lib/fa";
import { UNITS_TRIP_EVENT } from "@/shared/lib/page-events";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { useDebounced } from "@/shared/lib/use-debounced";
import { useOnline } from "@/shared/lib/use-online";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { WaitlistDialog, type WaitlistTarget } from "@/widgets/calendar-page/Dialogs";
import { occasionsByDay } from "@/widgets/calendar-page/model";
import { availCopy, calendarLink, windowLabel } from "@/widgets/units-page/copy";
import {
  availability,
  catalogue,
  rangeDays,
  startEligibility,
  suggestion,
  type CatalogUnit,
  type Clock,
  type Trip,
} from "@/widgets/units-page/model";
import { TripDialog } from "@/widgets/units-page/TripDialog";
import { AvailabilitySection } from "./Availability";
import { BookingPanel, MobileCta, type PanelProps } from "./Booking";
import { FeatureDialog, HandoffDialog, SwitchDialog } from "./Dialogs";
import { UnitMedia } from "./Media";
import {
  accountGate,
  mainAction,
  relatedUnits,
  selectionIndexes,
  shiftWeek,
  usablePhotos,
  weekDays,
  weekStart,
  WEEK,
} from "./model";
import { AccessCard, Facts, FeaturesSection, PoliciesSection, RelatedSection, SectionNav, TitleBand } from "./Sections";
import { goUnit, unitPageStore, useUnitPageState } from "./store";

/**
 * P-03 جزئیات واحد — معرفی کامل یک واحد با دادهٔ زندهٔ سرور، تقویم نیم‌روزهای همین واحد، پنل رزرو با
 * وضعیت حساب و بررسی شخصی، و تحویل به P-05 با همان شرایط سفر.
 *
 * پیش‌رندر ایستا (یک قالب برای همهٔ واحدها) فقط اسکلت می‌سازد؛ کد واحد و هر چیز وابسته به «اکنون»
 * پس از hydration خوانده می‌شود.
 */
export function UnitPage() {
  const state = useUnitPageState();
  const now = useHydratedNow(60_000);
  if (!state || now === null) return <UnitSkeleton />;
  if (!state.code) return <NotFound code={null} />;
  return <UnitLoader key={state.code} code={state.code} trip={state.trip} now={now} />;
}

function UnitLoader({ code, trip, now }: { code: string; trip: Trip; now: number }) {
  const unit = useQuery(unitQuery(code));
  const online = useOnline();
  if (unit.data) return <UnitBody unit={unit.data} trip={trip} now={now} />;
  if (unit.isPending) return <UnitSkeleton />;
  if (unit.error instanceof ApiError && unit.error.status === 404) return <NotFound code={code} />;
  const wait = retryAfter(unit.error);
  return (
    <PageState
      icon="cloud-off"
      title="اطلاعات این واحد دریافت نشد"
      body={
        wait
          ? `درخواست‌ها موقتاً زیاد شده است؛ حدود ${faDigits(Math.ceil(wait / 60))} دقیقهٔ دیگر دوباره امتحان کنید.`
          : online
            ? "ارتباط با سامانه برقرار نشد؛ چند لحظه بعد دوباره امتحان کنید."
            : "اتصال اینترنت قطع است؛ پس از وصل شدن، اطلاعات واحد دوباره دریافت می‌شود."
      }
    >
      <button type="button" className="btn btn-primary" onClick={() => void unit.refetch()}>
        <Icon name="refresh" size={18} /> تلاش دوباره
      </button>
      <a className="btn btn-secondary" href={destHref("units")}>
        همهٔ واحدها
      </a>
    </PageState>
  );
}

/* ── حالت‌های صفحه ───────────────────────────────────────────────────── */

function UnitSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال دریافت اطلاعات واحد">
      <section className="ud-band ud-band--skeleton">
        <div className="page-shell">
          <span className="skeleton ud-sk ud-sk--crumb" />
          <span className="skeleton ud-sk ud-sk--eyebrow" />
          <span className="skeleton ud-sk ud-sk--title" />
          <span className="skeleton ud-sk ud-sk--meta" />
        </div>
      </section>
      <div className="page-shell ud-layout">
        <div className="ud-content">
          <span className="skeleton ud-sk ud-sk--media" />
          <span className="skeleton ud-sk ud-sk--facts" />
          <span className="skeleton ud-sk ud-sk--line" />
          <span className="skeleton ud-sk ud-sk--line ud-sk--short" />
        </div>
        <aside className="ud-panel ud-panel--skeleton" aria-hidden="true">
          <span className="skeleton ud-sk ud-sk--line" />
          <span className="skeleton ud-sk ud-sk--trip" />
          <span className="skeleton ud-sk ud-sk--trip" />
          <span className="skeleton ud-sk ud-sk--cta" />
        </aside>
      </div>
    </div>
  );
}

function PageState({
  icon,
  title,
  body,
  children,
}: {
  icon: "search" | "cloud-off";
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-shell ud-state" role={icon === "cloud-off" ? "alert" : undefined}>
      <span className="ud-state__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <h1>{title}</h1>
      <p>{body}</p>
      <div className="ud-state__actions">{children}</div>
    </section>
  );
}

function NotFound({ code }: { code: string | null }) {
  const property = useQuery(propertyQuery);
  const units = catalogue(property.data);
  useEffect(() => {
    document.title = "واحد پیدا نشد · مهدیه";
  }, []);
  return (
    <PageState
      icon="search"
      title="این واحد پیدا نشد"
      body={
        code
          ? `واحدی با کد ${code} در فهرست عمومی نیست یا فعلاً برای انتخاب در دسترس نیست. واحدهای فعال زائرسرا را ببینید.`
          : "نشانی این صفحه کامل نیست. واحدهای فعال زائرسرا را ببینید."
      }
    >
      <a className="btn btn-primary" href={destHref("units")}>
        همهٔ واحدها <Icon name="arrow-left" size={18} />
      </a>
      <a className="btn btn-secondary" href={destHref("calendar")}>
        <Icon name="calendar" size={18} /> تقویم زمان‌های آزاد
      </a>
      {units.length ? (
        <ul className="ud-state__units" aria-label="واحدهای فعال">
          {units.map((u) => (
            <li key={u.code}>
              <a href={`/units/${u.code}/`} onClick={(e) => goUnit(e, u.code)}>
                <bdi className="latin">{u.code}</bdi>
                <span>{u.title}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </PageState>
  );
}

/* ── بدنهٔ صفحه ───────────────────────────────────────────────────────── */

function UnitBody({ unit, trip: rawTrip, now }: { unit: UnitDetail; trip: Trip; now: number }) {
  const qc = useQueryClient();
  const easy = useEasyMode();
  const online = useOnline();
  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const property = useQuery(propertyQuery);
  const me = useQuery(meQuery);
  const profile = me.data ?? null;
  const standing = useQuery({ ...standingQuery, enabled: Boolean(profile) });
  const units = catalogue(property.data);
  const self: CatalogUnit | undefined = units.find((u) => u.code === unit.code);
  const floorTitle = self?.floorTitle || property.data?.find((f) => f.number === unit.floor_number)?.title || "";
  const access = self?.access ?? "";
  const today = tehranToday(new Date(now));

  useEffect(() => {
    document.title = `${unit.title} (${unit.code}) · مهدیه`;
  }, [unit.title, unit.code]);

  // ── سفر و ساعت شبکهٔ سرور
  const minCells = Math.max(1, policies.minCells);
  const maxCells = Math.max(minCells, policies.maxCells);
  const trip: Trip = { ...rawTrip, cells: Math.min(maxCells, Math.max(minCells, rawTrip.cells)) };
  const setTrip = (t: Trip) => unitPageStore.setTrip(t);
  const lattice = config.data?.lattice;
  const clock: Clock = {
    now,
    minLeadHours: policies.minLeadHours,
    horizonDays: policies.horizonDays,
    gridStartHour: typeof lattice?.grid_start_hour === "number" ? lattice.grid_start_hour : 8,
    cellHours: typeof lattice?.cell_hours === "number" ? lattice.cell_hours : 12,
  };
  const gate = trip.day ? startEligibility(trip.day, trip.period, clock) : null;
  const maxCapacity = Math.max(unit.capacity_total, ...units.map((u) => u.capacity_total));

  // ── زمان‌ها: بازهٔ سفر (حکم آزادی)، نخستین شروع آزاد، و هفتهٔ نمایش
  const q = useDebounced({ guests: trip.guests, cells: trip.cells, day: trip.day, period: trip.period }, 260);
  const settling =
    JSON.stringify(q) !==
    JSON.stringify({ guests: trip.guests, cells: trip.cells, day: trip.day, period: trip.period });
  const windows = useQuery(
    windowsQuery(q.guests, q.cells, q.day && gate === "ok" ? { from: q.day, period: q.period } : undefined),
  );
  const tripCal = useQuery({
    ...calendarRangeQuery(q.day ?? today, rangeDays(q)),
    enabled: Boolean(q.day) && gate === "ok",
  });
  const tripRow = tripCal.data ? buildTimeline(tripCal.data).units.find((r) => r.code === unit.code) : undefined;

  const [weekPick, setWeekPick] = useState<string | null>(null);
  const weekFrom = weekStart(weekPick ?? trip.day, today, policies.horizonDays);
  const week = useQuery(calendarRangeQuery(weekFrom, WEEK));
  const weekRow = week.data ? buildTimeline(week.data).units.find((r) => r.code === unit.code) : undefined;
  const occasions = useQuery(occasionsQuery(weekFrom, addDays(weekFrom, WEEK - 1)));
  const occByDay = occasionsByDay(occasions.data ?? []);

  const dated = Boolean(trip.day);
  const avail = availability(unit, {
    trip,
    clock,
    row: tripRow,
    window: windows.data?.units.find((r) => r.code === unit.code),
    calendarState: !dated ? "idle" : settling || tripCal.isPending ? "loading" : tripCal.isError ? "error" : "ready",
    windowsState: settling || windows.isPending ? "loading" : windows.isError ? "error" : "ready",
    offline: !online,
  });
  const copy = availCopy(avail, trip, policies);
  const nearest: FreeWindow | null = suggestion(avail);
  const selected = selectionIndexes(weekRow ?? tripRow, trip);
  const startCellIdx = weekRow && trip.day ? (cellAt(weekRow, trip.day, trip.period)?.index ?? null) : null;

  // ── حساب و بررسی شخصی سرور
  const account = accountGate(Boolean(profile), standing.data, now);
  const free = avail.kind === "free" ? avail : null;
  const quote = useQuery({
    queryKey: ["quote", unit.code, free?.start, free?.end, trip.guests],
    queryFn: () =>
      fetchQuote({ unit_code: unit.code, start: free?.start ?? "", end: free?.end ?? "", guests_count: trip.guests }),
    enabled: Boolean(profile && free),
    staleTime: 15_000,
    retry: false,
  });
  const action = mainAction({
    capacity: unit.capacity_total,
    maxCapacity,
    trip,
    availability: avail,
    online,
    timesReady: !settling && (!dated || tripCal.isSuccess || gate !== "ok"),
    gate: account,
    quoteAllowed: quote.data ? quote.data.allowed : null,
  });

  // ── پنجره‌ها
  const [tripOpen, setTripOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [feature, setFeature] = useState<string | null>(null);
  const [waitTarget, setWaitTarget] = useState<WaitlistTarget | null>(null);
  const [pendingWait, setPendingWait] = useState<WaitlistTarget | null>(null);
  const activeWait = waitTarget ?? (profile ? pendingWait : null);
  useEffect(() => {
    const open = () => setTripOpen(true);
    window.addEventListener(UNITS_TRIP_EVENT, open);
    return () => window.removeEventListener(UNITS_TRIP_EVENT, open);
  }, []);

  const pickWindow = (w: FreeWindow) => {
    setTrip({ ...trip, day: w.day, period: w.period });
    setWeekPick(null);
    toast(`زمان ورود روی ${windowLabel(w)} تنظیم شد.`, "success");
  };
  const pickCell = (cell: CalendarCell) => {
    const day = cell.start.slice(0, 10);
    const period: Period = cell.kind;
    // انتخاب از همین هفته نباید جدول را زیر نشانگر جابه‌جا کند ⇒ هفتهٔ فعلی ثابت می‌ماند
    setWeekPick(weekFrom);
    setTrip({
      ...trip,
      day: cell.kind === "night" && cell.start.slice(11, 13) < "12" ? addDays(day, -1) : day,
      period,
    });
  };
  const onMain = () => {
    if (action.disabled) return;
    if (action.kind === "continue") setHandoffOpen(true);
    else if (action.kind === "switch") setSwitchOpen(true);
    else if (action.kind === "time") setTripOpen(true);
  };

  const waitlist = (() => {
    if (!policies.waitlistEnabled || !trip.day || avail.kind !== "busy" || !tripRow) return null;
    const first = cellAt(tripRow, trip.day, trip.period);
    const last = first ? tripRow.byIndex.get(first.index + trip.cells - 1) : undefined;
    if (!first || !last) return null;
    const target = { unit: unit.code, start: first.start, end: last.end, cells: trip.cells };
    return () => {
      if (profile) setWaitTarget(target);
      else {
        setPendingWait(target);
        openAccount({
          reason: "برای ثبت در صف انتظار، با شمارهٔ همراه وارد شوید؛ پیشنهاد سانس به همین شماره پیامک می‌شود.",
        });
      }
    };
  })();

  const prefetch = (code: string) => void qc.prefetchQuery(unitQuery(code));
  const photos = usablePhotos(unit.photos, typeof window === "undefined" ? "http://local" : window.location.href);
  const related = relatedUnits(units, unit, trip.guests);
  const calendarHref = calendarLink(unit.code, trip);
  const failure = windows.error ?? tripCal.error ?? week.error;
  const wait = retryAfter(failure);

  const panel: PanelProps = {
    unit,
    trip,
    clock,
    copy,
    action,
    account,
    standing: standing.data,
    quote: quote.data,
    quoteChecking: quote.isFetching,
    nearest: action.disabled || avail.kind === "free" ? null : nearest,
    settling: settling || (tripCal.isFetching && !tripCal.isPending),
    signedIn: Boolean(profile),
    firstName: profile?.first_name ?? "",
    onTrip: () => setTripOpen(true),
    onMain,
    onNearest: pickWindow,
    onWaitlist: waitlist,
    calendarHref,
    policies,
  };

  return (
    <div className={cx("ud", easy && "ud--easy")}>
      {!online ? (
        <p className="ud-notice" role="status">
          <Icon name="wifi-off" size={18} />
          <span>اتصال قطع است؛ اطلاعات آخرین دریافت دیده می‌شود و ادامهٔ رزرو پس از وصل شدن ممکن است.</span>
        </p>
      ) : wait ? (
        <p className="ud-notice" role="status">
          <Icon name="hourglass" size={18} />
          <span>
            درخواست‌ها موقتاً زیاد شده است؛ زمان‌ها حدود {faDigits(Math.ceil(wait / 60))} دقیقهٔ دیگر دوباره بررسی
            می‌شوند.
          </span>
        </p>
      ) : null}

      <TitleBand unit={unit} floorTitle={floorTitle} onSwitch={() => setSwitchOpen(true)} />

      <div className="page-shell ud-layout">
        <div className="ud-content">
          {easy ? null : <UnitMedia unit={unit} photos={photos} onFeature={setFeature} />}
          <Facts unit={unit} floorTitle={floorTitle} />
          <SectionNav />
          <FeaturesSection unit={unit} onInfo={setFeature} />
          <AccessCard
            floorTitle={floorTitle}
            access={access}
            hasElevator={unit.features.some((f) => f.code === "elevator")}
            supportPhone={config.data?.site.support_phone ?? ""}
          />
          <AvailabilitySection
            code={unit.code}
            clock={clock}
            today={today}
            trip={trip}
            weekFrom={weekFrom}
            days={weekDays(weekFrom)}
            calendarDays={week.data?.days ?? []}
            row={weekRow}
            selected={selected}
            startIndex={startCellIdx}
            occasions={occByDay}
            state={week.isPending ? "loading" : week.isError && !week.data ? "error" : "ready"}
            refreshing={week.isFetching && !week.isPending}
            canPrev={weekFrom > today}
            canNext={addDays(weekFrom, WEEK) <= addDays(today, policies.horizonDays)}
            onPrev={() => setWeekPick(shiftWeek(weekFrom, -1, today, policies.horizonDays))}
            onNext={() => setWeekPick(shiftWeek(weekFrom, 1, today, policies.horizonDays))}
            onRetry={() => void week.refetch()}
            onPick={pickCell}
            onTrip={() => setTripOpen(true)}
            copy={copy}
            nearest={nearest}
            onNearest={pickWindow}
            onWaitlist={waitlist}
            calendarHref={calendarHref}
            easy={easy}
          />
          <PoliciesSection policies={policies} hasPhotos={photos.length > 0} />
          <RelatedSection units={related} guests={trip.guests} onPrefetch={prefetch} />
        </div>
        <BookingPanel {...panel} />
      </div>

      <MobileCta {...panel} />

      <TripDialog
        open={tripOpen}
        onOpenChange={setTripOpen}
        trip={trip}
        onApply={(t) => {
          setTrip(t);
          setWeekPick(null);
        }}
        clock={clock}
        today={today}
        minCells={minCells}
        maxCells={maxCells}
        maxCapacity={maxCapacity}
      />
      <SwitchDialog
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        units={units}
        current={unit.code}
        guests={trip.guests}
        onPrefetch={prefetch}
      />
      <FeatureDialog
        feature={unit.features.find((f) => f.code === feature) ?? null}
        unitTitle={unit.title}
        access={access}
        onClose={() => setFeature(null)}
      />
      <HandoffDialog
        open={handoffOpen && avail.kind === "free"}
        onOpenChange={setHandoffOpen}
        unit={unit}
        trip={trip}
        availability={avail}
        profileIncomplete={account.kind === "profile"}
        quote={quote.data}
        calendarHref={calendarHref}
      />
      <WaitlistDialog
        target={activeWait}
        onClose={() => {
          setWaitTarget(null);
          setPendingWait(null);
        }}
        units={tripCal.data ? buildTimeline(tripCal.data).units : []}
        guests={trip.guests}
        phone={profile?.phone_masked ?? ""}
        policies={policies}
        onSlotFree={() => void tripCal.refetch()}
      />
    </div>
  );
}
