"use client";
import type { Desk, DeskRow, DeskUnit } from "@/shared/api/desk";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { Popover } from "@/shared/ui/Popover";
import { KPI_CARDS, STATE_TONE, kpiSub, liveProgress, minutesLabel, visibleUnits, type BoardFilter } from "./model";
import { Info, LanePill, Pill, SectionHead, UnitBadge } from "./parts";
import type { OpenDialog } from "./types";

/** ۴ کاشی شاخص — کلیک ⇒ فیلتر تابلو (دوباره ⇒ برداشتن فیلتر). */
export function KpiStrip({
  desk,
  filter,
  onFilter,
}: {
  desk: Desk;
  filter: BoardFilter;
  onFilter: (f: BoardFilter) => void;
}) {
  return (
    <section className="rc-kpis" aria-label="شاخص‌های وضعیت واحدها">
      {KPI_CARDS.map((k) => {
        const value = desk.kpis[k.state];
        const active = filter === k.state;
        return (
          <button
            key={k.state}
            type="button"
            className="rc-kpi"
            data-state={k.state}
            aria-pressed={active}
            onClick={() => onFilter(active ? null : k.state)}
          >
            <span className="rc-kpi__icon" aria-hidden="true">
              <Icon name={k.icon as IconName} size={22} />
            </span>
            <span className="rc-kpi__body">
              <span className="rc-kpi__label">{k.label}</span>
              <span className="rc-kpi__val">{faDigits(value)}</span>
              <span className="rc-kpi__sub">{kpiSub(desk, k.state)}</span>
            </span>
            <span className="sr-only">{active ? "(فیلتر فعال؛ برای برداشتن دوباره بزنید)" : "(فیلتر تابلو)"}</span>
          </button>
        );
      })}
    </section>
  );
}

type BoardProps = {
  desk: Desk;
  filter: BoardFilter;
  onClearFilter: () => void;
  open: OpenDialog;
  onCheckIn: (row: DeskRow) => void;
  onFocusScanner: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  updatedLabel: string;
  highlight: string | null;
};

export function UnitBoard(props: BoardProps) {
  const { desk, filter, onClearFilter, onRefresh, refreshing, updatedLabel } = props;
  const units = visibleUnits(desk.units, filter);
  return (
    <section className="rc-section" aria-labelledby="rc-board-title">
      <SectionHead
        eyebrow="مدیریت واحدهای اقامتی مهدیه"
        id="rc-board-title"
        title={<>تابلوی زندهٔ وضعیت {faDigits(desk.units.length)} واحد</>}
        aside={
          <>
            <span className="rc-live" data-busy={refreshing || undefined}>
              <span className="rc-live__dot" aria-hidden="true" /> اتصال زنده · {updatedLabel}
            </span>
            <button
              type="button"
              className="icon-button rc-refresh"
              onClick={onRefresh}
              aria-label="به‌روزرسانی فوری تابلو"
              disabled={refreshing}
            >
              <Icon name="refresh" size={18} />
            </button>
          </>
        }
      />
      {filter ? (
        <div className="rc-filterbar" role="status">
          <span>
            فیلتر: <strong>{KPI_CARDS.find((k) => k.state === filter)?.label}</strong> · {faDigits(units.length)} واحد
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClearFilter}>
            <Icon name="x" size={16} /> نمایش همهٔ واحدها
          </button>
        </div>
      ) : null}
      <div className="rc-board">
        {units.map((u) => (
          <UnitCard key={u.code} unit={u} {...props} />
        ))}
        {units.length === 0 ? (
          <p className="rc-empty">
            <Icon name="filter" size={18} /> هیچ واحدی در این وضعیت نیست.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function UnitCard({ unit, open, onCheckIn, onFocusScanner, highlight }: BoardProps & { unit: DeskUnit }) {
  const now = useClock(unit.state === "buffer");
  const row = unit.current ?? unit.arrival;
  const task = unit.housekeeping;
  const progress =
    task && now
      ? liveProgress(task, now)
      : task
        ? { percent: task.percent, remaining: task.remaining_minutes, overdue: task.overdue }
        : null;

  return (
    <article
      className={cx("rc-unit", highlight === unit.code && "rc-unit--flash")}
      data-state={unit.state}
      id={`rc-unit-${unit.code}`}
      aria-labelledby={`rc-unit-${unit.code}-t`}
    >
      <header className="rc-unit__head">
        <UnitBadge code={unit.code} size="lg" />
        <div className="rc-unit__titles">
          <h3 id={`rc-unit-${unit.code}-t`}>{unit.title}</h3>
          <span>
            {unit.type_label} · {unit.floor_title}
          </span>
        </div>
        <UnitMenu unit={unit} open={open} />
      </header>

      <Pill tone={STATE_TONE[unit.state]}>
        {unit.current?.desk.is_overstay ? "گذشته از زمان تخلیه" : unit.state_label}
      </Pill>

      <dl className="rc-unit__facts">
        <Info label="ظرفیت">
          {faDigits(unit.capacity_adults)} نفر اصلی
          {unit.capacity_children ? <> + {faDigits(unit.capacity_children)} نفر مازاد</> : null}
        </Info>
        <Info label="کلید">{unit.key_label}</Info>
      </dl>

      <div className="rc-unit__box">
        {unit.state === "maintenance" && unit.block ? (
          <dl>
            <Info label="علت" wide>
              <strong className="rc-danger-ink">{unit.block.reason}</strong>
            </Info>
            <Info label="نوع">{unit.block.kind_label}</Info>
            <Info label="رفع مسدودی">{unit.block.ends_label}</Info>
          </dl>
        ) : unit.state === "buffer" && task && progress ? (
          <div className="rc-hk">
            <dl>
              <Info label="خادم خدمات">{task.assignee}</Info>
              <Info label="پایان تخمینی">
                <bdi>{task.due_label}</bdi>
              </Info>
            </dl>
            <progress
              className="rc-progress"
              max={100}
              value={progress.percent}
              aria-label={`پیشرفت نظافت ${unit.code}`}
              data-overdue={progress.overdue || undefined}
            >
              {faDigits(progress.percent)}٪
            </progress>
            <p className="rc-hk__meta">
              <span>پیشرفت {faDigits(progress.percent)}٪</span>
              <span>
                {progress.overdue
                  ? `${minutesLabel(Math.abs(progress.remaining))} از موعد گذشته`
                  : `${minutesLabel(Math.max(0, progress.remaining))} مانده`}
              </span>
            </p>
          </div>
        ) : row ? (
          <dl>
            <Info label={unit.current ? "زائر مقیم" : "زائر بعدی"} wide>
              <strong>{row.guest_name || "زائر"}</strong>
              {row.desk.guest_city ? <span className="rc-muted"> ({row.desk.guest_city})</span> : null}
            </Info>
            <Info label="همراهان">{faDigits(row.guests_count)} نفر</Info>
            <Info label={unit.current ? "تخلیه" : "ورود"}>
              <bdi>{unit.current ? row.desk.end_label : row.desk.due_label}</bdi>
            </Info>
            {!unit.current ? (
              <Info label="وضعیت" wide>
                <LanePill row={row} />
              </Info>
            ) : null}
          </dl>
        ) : (
          <p className="rc-unit__idle">
            <Icon name="sparkle" size={16} /> واحد آماده و کلید در قفسه است؛ نوبت امروز ندارد.
          </p>
        )}
      </div>

      <div className="rc-unit__actions">
        <PrimaryAction unit={unit} open={open} onCheckIn={onCheckIn} onFocusScanner={onFocusScanner} />
      </div>
    </article>
  );
}

function PrimaryAction({
  unit,
  open,
  onCheckIn,
  onFocusScanner,
}: {
  unit: DeskUnit;
  open: OpenDialog;
  onCheckIn: (row: DeskRow) => void;
  onFocusScanner: () => void;
}) {
  const current = unit.current;
  const arrival = unit.arrival;
  switch (unit.state) {
    case "occupied":
      return current ? (
        <>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block"
            onClick={() => open({ kind: "checkout", row: current, unit })}
          >
            <Icon name="door-exit" size={16} /> ثبت خروج و تحویل به نظافت
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={() => open({ kind: "dossier", row: current })}
          >
            <Icon name="id-card" size={16} /> پروندهٔ زائر
          </button>
        </>
      ) : null;
    case "expected":
      return arrival ? (
        <>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block"
            onClick={() => onCheckIn(arrival)}
            disabled={!arrival.desk.can_check_in}
            title={arrival.desk.can_check_in ? undefined : "پنجرهٔ پذیرش هنوز باز نشده است"}
          >
            <Icon name="key" size={16} /> پذیرش به محض ورود
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={() => open({ kind: "dossier", row: arrival })}
          >
            <Icon name="phone" size={16} /> پرونده و تماس با زائر
          </button>
        </>
      ) : null;
    case "ready":
      return (
        <>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block"
            onClick={() => (arrival?.desk.can_check_in ? onCheckIn(arrival) : onFocusScanner())}
          >
            <Icon name="scan" size={16} /> پذیرش سریع و تحویل کلید
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm btn-block"
            onClick={() => open({ kind: "block", unit })}
          >
            <Icon name="wrench" size={16} /> تعمیرات
          </button>
        </>
      );
    case "buffer":
      return (
        <button
          type="button"
          className="btn btn-primary btn-sm btn-block rc-btn-done"
          onClick={() => open({ kind: "complete", unit })}
        >
          <Icon name="check" size={16} /> تأیید اتمام نظافت و آماده‌سازی
        </button>
      );
    case "maintenance":
      return (
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-block"
          onClick={() => open({ kind: "unblock", unit })}
          disabled={!unit.block}
        >
          <Icon name="lock-open" size={16} /> رفع مسدودی و آماده‌سازی
        </button>
      );
    default:
      return null;
  }
}

/** منوی «کنش‌های بیشتر» هر کارت — فقط کنش‌هایی که سرور برای همین لحظه مجاز می‌داند. */
function UnitMenu({ unit, open }: { unit: DeskUnit; open: OpenDialog }) {
  const row = unit.current ?? unit.arrival;
  type Item = { icon: IconName; label: string; run: () => void; danger?: boolean };
  const items: Item[] = [];
  if (row) {
    items.push({ icon: "id-card", label: "پروندهٔ زائر و تماس", run: () => open({ kind: "dossier", row }) });
    items.push({ icon: "note", label: "یادداشت داخلی", run: () => open({ kind: "note", row }) });
    if (row.desk.can_move)
      items.push({ icon: "swap", label: "جابه‌جایی واحد یا زمان", run: () => open({ kind: "move", row }) });
    if (row.desk.can_no_show)
      items.push({ icon: "user-x", label: "ثبت عدم‌حضور", run: () => open({ kind: "noshow", row }), danger: true });
    if (row.desk.can_cancel)
      items.push({ icon: "calendar-x", label: "لغو نوبت", run: () => open({ kind: "cancel", row }), danger: true });
  }
  if (unit.state === "ready" || (unit.state === "expected" && !unit.housekeeping))
    items.push({ icon: "broom", label: "سپردن به نظافت", run: () => open({ kind: "housekeeping", unit }) });
  if (unit.state !== "maintenance" && unit.state !== "occupied")
    items.push({ icon: "wrench", label: "مسدودسازی برای تعمیرات", run: () => open({ kind: "block", unit }) });
  if (unit.state === "ready")
    items.push({
      icon: "calendar-plus",
      label: "ثبت نوبت حضوری",
      run: () => open({ kind: "create", unit: unit.code }),
    });
  if (items.length === 0) return null;
  return (
    <Popover
      anchor="desk-unit"
      label={`کنش‌های بیشتر ${unit.code}`}
      className="menu-popover"
      align="start"
      trigger={(p) => (
        <button
          type="button"
          {...p}
          className={`icon-button rc-unit__more ${p.className}`}
          aria-label={`کنش‌های بیشتر واحد ${unit.code}`}
        >
          <Icon name="more" size={18} />
        </button>
      )}
    >
      {(close) => (
        <div className="menu" role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={cx("menu__item", it.danger && "menu__item--danger")}
              onClick={() => {
                close();
                it.run();
              }}
            >
              <Icon name={it.icon} size={16} />
              <span className="menu__text">{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
