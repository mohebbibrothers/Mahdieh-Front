"use client";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Period, UnitTimeline } from "@/entities/slot/timeline";
import { floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import type { Calendar, CalendarCell, Occasion } from "@/shared/api/schemas";
import { cx } from "@/shared/lib/cx";
import { faDigits, formatDayMonth, formatWeekday } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import {
  SLOT_ICON,
  SLOT_LABEL,
  SLOT_REASON,
  DAY_TAG_LABEL,
  cellsOfDay,
  dayFree,
  dayMark,
  slotState,
  startCell,
  type Clock,
  type Selection,
} from "./model";

type Day = Calendar["days"][number];

export const PERIOD_LABEL: Record<Period, string> = { day: "سانس روزانه", night: "سانس شبانه" };

/** «۰۸:۰۰ تا ۲۰:۰۰» از شبکهٔ زندهٔ بک‌اند (‎grid_start_hour‎، ‎cell_hours‎). */
export function periodHours(period: Period, startHour: number, cellHours: number): string {
  const hh = (h: number) => `${faDigits(String(h % 24).padStart(2, "0"))}:۰۰`;
  const from = period === "day" ? startHour : startHour + cellHours;
  return `${hh(from)} تا ${hh(from + cellHours)}`;
}

/** نقش هر نیم‌روز در انتخاب: آغاز/میانه/پایان (برای شکل کپسولی پیوسته). */
export function selectionMap(
  units: UnitTimeline[],
  sel: Selection | null,
): Map<string, "single" | "start" | "mid" | "end"> {
  const out = new Map<string, "single" | "start" | "mid" | "end">();
  if (!sel) return out;
  const unit = units.find((u) => u.code === sel.unit);
  const head = startCell(unit, sel);
  if (!unit || !head) return out;
  for (let k = 0; k < sel.cells; k++) {
    const role = sel.cells === 1 ? "single" : k === 0 ? "start" : k === sel.cells - 1 ? "end" : "mid";
    out.set(`${unit.code}:${head.index + k}`, role);
  }
  return out;
}

export type MatrixProps = {
  days: Day[];
  units: UnitTimeline[];
  clock: Clock;
  selection: Selection | null;
  guests: number;
  /** مناسبت‌های رسمی/دستی هر روز (از ‎/occasions‎). */
  occDays: Map<string, Occasion[]>;
  today: string;
  startHour: number;
  cellHours: number;
  refreshing: boolean;
  focusDay: { day: string; nonce: number } | null;
  onCell: (unit: UnitTimeline, cell: CalendarCell) => void;
};

/**
 * ماتریس واحد × نیم‌روز طراح P-04 — جدول بومی (معنای سطر/ستون برای صفحه‌خوان) با ستون واحد چسبان،
 * پیش‌نمایش زندهٔ بازه با اشاره‌گر، فوکوس گردان با کلیدهای جهت (راست‌به‌چپ: ← بعدی) و نشان «!» روی
 * نیم‌روزهای ناسازگار انتخاب.
 */
export function Matrix(p: MatrixProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ unit: string; index: number } | null>(null);
  const roles = useMemo(() => selectionMap(p.units, p.selection), [p.units, p.selection]);

  // پیش‌نمایش: آغاز انتخاب تا خانهٔ زیر اشاره‌گر (فقط همان واحد و رو به جلو)
  const preview = useMemo(() => {
    const set = new Set<number>();
    if (!p.selection || !hover || hover.unit !== p.selection.unit) return set;
    const unit = p.units.find((u) => u.code === hover.unit);
    const head = startCell(unit, p.selection);
    if (!head || hover.index <= head.index) return set;
    for (let i = head.index; i <= hover.index && i - head.index < 14; i++) set.add(i);
    return set;
  }, [hover, p.selection, p.units]);

  // فوکوس گردان: آغاز انتخاب یا نخستین نیم‌روز آزاد
  const rovingKey = useMemo(() => {
    for (const [k, role] of roles) if (role === "start" || role === "single") return k;
    for (const u of p.units) {
      const c = u.cells.find((x) => slotState(x, p.clock) === "free" && x.start.slice(0, 10) >= (p.days[0]?.day ?? ""));
      if (c) return `${u.code}:${c.index}`;
    }
    const u = p.units[0];
    const c = u ? cellsOfDay(u, p.days[0]?.day ?? "")[0] : undefined;
    return u && c ? `${u.code}:${c.index}` : "";
  }, [roles, p.units, p.clock, p.days]);
  const rendered = useMemo(() => {
    const keys = new Set<string>();
    for (const u of p.units)
      for (const d of p.days) for (const c of cellsOfDay(u, d.day)) keys.add(`${u.code}:${c.index}`);
    return keys;
  }, [p.units, p.days]);
  const [roving, setRoving] = useState<string>("");
  const activeKey = roving && rendered.has(roving) ? roving : rovingKey;

  // پرش به یک روز (تراشهٔ مناسبت، کشف بازه، انتخاب تاریخ)
  useEffect(() => {
    if (!p.focusDay) return;
    const th = scroller.current?.querySelector<HTMLElement>(`th[data-day="${p.focusDay.day}"]`);
    if (!th || !scroller.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    th.scrollIntoView({ behavior: reduce ? "auto" : "smooth", inline: "center", block: "nearest" });
    th.dataset.flash = "";
    const t = setTimeout(() => delete th.dataset.flash, 1600);
    return () => clearTimeout(t);
  }, [p.focusDay]);

  const onKey = (e: KeyboardEvent<HTMLTableElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-key]");
    if (!btn) return;
    const row = Number(btn.dataset.row);
    const col = Number(btn.dataset.col);
    const cols = p.days.length * 2;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [0, 1],
      ArrowRight: [0, -1],
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
    };
    let r = row;
    let c = col;
    if (e.key in map) {
      const [dr, dc] = map[e.key] ?? [0, 0];
      r = Math.max(0, Math.min(p.units.length - 1, row + dr));
      c = Math.max(0, Math.min(cols - 1, col + dc));
    } else if (e.key === "Home") c = 0;
    else if (e.key === "End") c = cols - 1;
    else return;
    e.preventDefault();
    const next = scroller.current?.querySelector<HTMLButtonElement>(`button[data-row="${r}"][data-col="${c}"]`);
    if (next) {
      setRoving(next.dataset.key ?? "");
      next.focus();
      next.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  return (
    <div className="cp-matrix" data-refreshing={p.refreshing || undefined}>
      <span className="cp-refresh" aria-hidden="true" />
      <p className="cp-matrix__hint" aria-hidden="true">
        <Icon name="arrow-left" size={16} />
        برای دیدن روزهای بعد، جدول را به چپ بکشید
      </p>
      <div
        ref={scroller}
        className="cp-matrix__scroll"
        tabIndex={-1}
        onPointerLeave={() => setHover(null)}
        role="region"
        aria-label="جدول نیم‌روزهای واحدها — برای روزهای بعد به چپ بلغزانید"
      >
        <table
          className="cp-table"
          aria-label="تقویم موجودی واحدهای اقامتی"
          aria-describedby="cp-keys"
          onKeyDown={onKey}
        >
          <thead>
            <tr>
              <th scope="col" className="cp-corner">
                <span>واحد اقامتی</span>
                <small>روز / شب</small>
              </th>
              {p.days.map((d) => {
                const f = dayFree(p.units, d.day, p.clock);
                const mark = dayMark(d, p.occDays.get(d.day));
                return (
                  <th
                    key={d.day}
                    scope="col"
                    className="cp-dh"
                    data-day={d.day}
                    data-weekend={d.is_weekend || undefined}
                    data-peak={mark.tag === "peak" || undefined}
                    data-today={d.day === p.today || undefined}
                    title={mark.titles.join("، ") || undefined}
                  >
                    <span className="cp-dh__wd">{formatWeekday(d.day)}</span>
                    <span className="cp-dh__date">{formatDayMonth(d.day)}</span>
                    <span className="cp-dh__tags">
                      {d.day === p.today ? <span className="cp-tag cp-tag--today">امروز</span> : null}
                      {mark.tag ? (
                        <span className={`cp-tag cp-tag--${mark.tag}`}>{DAY_TAG_LABEL[mark.tag]}</span>
                      ) : null}
                      {mark.titles.length ? <span className="sr-only">— {mark.titles.join("، ")}</span> : null}
                    </span>
                    <span className="cp-dh__free" data-none={f.free === 0 || undefined}>
                      {f.free ? `${faDigits(f.free)} از ${faDigits(f.total)} آزاد` : "تکمیل"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {p.units.map((u, row) => (
              <tr key={u.code} data-short={p.guests > u.capacity || undefined}>
                <th scope="row" className="cp-unit">
                  <span className="cp-unit__text">
                    <span className="cp-unit__top">
                      <bdi className="latin cp-unit__badge">{u.code}</bdi>
                      <small className="cp-unit__floor">
                        <Icon name={unitTypeIcon(u.unitType)} size={14} />
                        {floorLabel(u.floor)}
                      </small>
                    </span>
                    <span className="cp-unit__name">{u.title}</span>
                    <small>ظرفیت: {faDigits(u.capacity)} نفر</small>
                    {p.guests > u.capacity ? (
                      <small className="cp-unit__warn">
                        <Icon name="users" size={12} /> کمتر از {faDigits(p.guests)} نفر
                      </small>
                    ) : null}
                  </span>
                </th>
                {p.days.map((d, di) => (
                  <td key={d.day} data-today={d.day === p.today || undefined}>
                    <div className="cp-slots">
                      {cellsOfDay(u, d.day).map((cell) => {
                        const key = `${u.code}:${cell.index}`;
                        const state = slotState(cell, p.clock);
                        const role = roles.get(key);
                        const conflict = Boolean(role) && state !== "free";
                        const dead = state === "past";
                        return (
                          <button
                            key={cell.index}
                            type="button"
                            className="cp-slot"
                            data-key={key}
                            data-unit={u.code}
                            data-day={d.day}
                            data-row={row}
                            data-col={di * 2 + (cell.kind === "day" ? 0 : 1)}
                            data-state={state}
                            data-kind={cell.kind}
                            data-sel={role}
                            data-conflict={conflict || undefined}
                            data-preview={(!role && preview.has(cell.index) && hover?.unit === u.code) || undefined}
                            tabIndex={key === activeKey ? 0 : -1}
                            aria-pressed={Boolean(role)}
                            aria-disabled={dead || undefined}
                            onPointerEnter={() => setHover({ unit: u.code, index: cell.index })}
                            onFocus={() => setRoving(key)}
                            onClick={() => !dead && p.onCell(u, cell)}
                          >
                            {/* نام دسترس‌پذیر = متن دیداری (پیوسته) + زمینهٔ پنهان پیش و پس از آن (WCAG 2.5.3) */}
                            <span className="sr-only">
                              {u.code}، {formatWeekday(d.day)} {formatDayMonth(d.day)}،{" "}
                            </span>
                            <span className="cp-slot__kind">
                              <Icon name={cell.kind === "day" ? "sun" : "moon"} size={12} />
                              {cell.kind === "day" ? "روز" : "شب"}
                            </span>{" "}
                            <span className="cp-slot__state">
                              {role ? (conflict ? SLOT_LABEL[state] : "انتخاب") : SLOT_LABEL[state]}
                            </span>
                            <span className="sr-only">
                              — {PERIOD_LABEL[cell.kind]} {periodHours(cell.kind, p.startHour, p.cellHours)}؛{" "}
                              {SLOT_REASON[state]}
                            </span>
                            {conflict ? (
                              <span className="cp-slot__bang" aria-hidden="true">
                                !
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p id="cp-keys" className="sr-only">
        روی هر نیم‌روز بزنید تا آغاز اقامت شود و روی نیم‌روز بعدی تا پایان آن. با کلیدهای جهت میان نیم‌روزها و واحدها
        جابه‌جا شوید.
      </p>
    </div>
  );
}

type LegendItem = {
  state: string;
  short: string;
  label: string;
  symbol: string;
  icon: Parameters<typeof Icon>[0]["name"];
};

/** یک منبع برای راهنمای زیر تقویم و بخش «بی‌تکیه بر رنگ» پنجرهٔ راهنما (همان نماد و ظاهر خانهٔ جدول). */
export const LEGEND_ITEMS: LegendItem[] = [
  { state: "free", short: "آزاد", label: "آزاد (قابل رزرو)", symbol: "خورشید یا ماه", icon: "sun" },
  { state: "occupied", short: "رزروشده", label: "رزروشده", symbol: "قفل و هاشور", icon: SLOT_ICON.occupied },
  { state: "buffer", short: "نظافت", label: "نظافت و آماده‌سازی", symbol: "جارو، کادر خط‌چین", icon: SLOT_ICON.buffer },
  { state: "blocked", short: "تعمیرات", label: "تعمیرات", symbol: "آچار و هاشور خاکستری", icon: SLOT_ICON.blocked },
  { state: "soon", short: "مهلت کوتاه", label: "رزرو بسته (مهلت کوتاه)", symbol: "ساعت شنی", icon: SLOT_ICON.soon },
  { state: "past", short: "گذشته", label: "گذشته", symbol: "ساعت، کم‌رنگ", icon: SLOT_ICON.past },
  { state: "selected", short: "انتخاب شما", label: "انتخاب شما", symbol: "تیک روی زمینهٔ پررنگ", icon: "check" },
];

/** نمونهٔ کوچک یک وضعیت (همان ظاهر خانهٔ جدول). */
export function Swatch({ item, size = 14 }: { item: LegendItem; size?: 14 | 18 }) {
  return (
    <span
      className={cx("cp-slot cp-slot--swatch", size === 18 && "cp-slot--swatch-lg")}
      data-state={item.state === "selected" ? "free" : item.state}
      data-sel={item.state === "selected" ? "single" : undefined}
      aria-hidden="true"
    >
      <Icon name={item.icon} size={size} />
    </span>
  );
}

/** راهنمای رنگ زیر تقویم (بی‌تکیه بر رنگ: هر وضعیت نماد خودش را دارد). */
export function Legend({ onGuide }: { onGuide: () => void }) {
  return (
    <div className="cp-legend">
      <ul className="cp-legend__items" aria-label="راهنمای وضعیت نیم‌روزها">
        {LEGEND_ITEMS.map((it) => (
          <li key={it.state}>
            <Swatch item={it} />
            <span className="cp-legend__label">{it.label}</span>
            <span className="cp-legend__short" aria-hidden="true">
              {it.short}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="cp-legend__guide" onClick={onGuide}>
        <Icon name="info" size={18} />
        <span>راهنمای کامل</span>
        <span className="cp-legend__gx"> زمان‌های تحویل و مقررات شبکه</span>
      </button>
    </div>
  );
}
