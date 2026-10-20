"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cellAt, STATUS_LABEL } from "@/entities/slot/timeline";
import { floorLabel, unitTypeIcon } from "@/entities/unit/unit";
import { useEasyMode } from "@/features/easy-mode/easy-mode";
import { draftStore } from "@/features/booking-draft/store";
import { useAvailability } from "@/features/booking-draft/use-availability";
import type { CellStatus } from "@/shared/api/schemas";
import { faDigits, formatDayLabel } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { SHRINE_SVG } from "@/shared/ui/shrine.generated";

type RoomState = {
  code: string;
  title: string;
  floor: number;
  type: string;
  capacity: number;
  status: CellStatus | "unknown";
  fit: "ok" | "no" | null;
};

const FLOORS = [0, 3, 2, 1] as const;

/**
 * ساختمان تعاملی: وضعیت هر واحد در «زمان ورود انتخاب‌شده» با data-status روی گروه‌های SVG
 * (رنگ‌ها در CSS)، انتخاب طبقه با data-floor، کلیک/Enter با واگذاری رویداد، برچسب‌های
 * دسترس‌پذیر پویا. حالت آسان یا انتخاب «فهرست» ⇒ فهرست ساده به‌جای مدل.
 */
export function BuildingModel({ children }: { children: ReactNode }) {
  const { timeline, draft, results, calendar } = useAvailability();
  const easy = useEasyMode();
  const host = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const view = easy ? "list" : draft.view;

  const rooms: RoomState[] =
    timeline?.units.map((u) => {
      const cell = draft.day ? cellAt(u, draft.day, draft.period) : undefined;
      const r = results.find((x) => x.code === u.code);
      return {
        code: u.code,
        title: u.title,
        floor: u.floor,
        type: u.unitType,
        capacity: u.capacity,
        status: cell?.status ?? "unknown",
        fit: draft.searched && r ? (r.verdict.kind === "ok" ? "ok" : "no") : null,
      };
    }) ?? [];

  // همگام‌سازی SVG با وضعیت (فقط ویژگی‌ها؛ هیچ style درون‌خطی).
  useEffect(() => {
    const svgRoot = host.current;
    if (!svgRoot) return;
    for (const g of svgRoot.querySelectorAll<SVGGElement>(".building-room")) {
      const code = g.dataset.unit ?? "";
      const room = rooms.find((r) => r.code === code);
      const status = room?.status ?? "unknown";
      g.dataset.status = status;
      if (room?.fit) g.dataset.fit = room.fit;
      else delete g.dataset.fit;
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      g.setAttribute(
        "aria-label",
        room
          ? `${room.title}، ${floorLabel(room.floor)}، ظرفیت ${faDigits(room.capacity)} نفر — ${status === "unknown" ? "در حال دریافت وضعیت" : STATUS_LABEL[status]}. جزئیات و زمان‌ها`
          : `واحد ${code}`,
      );
    }
  });

  const open = (code: string) => draftStore.set({ openUnit: code });
  const roomFrom = (target: EventTarget | null) =>
    (target instanceof Element ? target.closest<SVGGElement>(".building-room") : null)?.dataset.unit ?? null;

  const hovered = rooms.find((r) => r.code === hover);
  const dateText = draft.day ? `${formatDayLabel(draft.day)} · ${draft.period === "day" ? "روز" : "شب"}` : "…";

  return (
    <figure className="building-figure" aria-labelledby="building-caption">
      <div className="model-toolbar">
        <p className="model-date" title="وضعیت واحدها مطابق زمان ورود انتخاب‌شده است">
          <Icon name="calendar" size={16} />
          <span>{dateText}</span>
        </p>
        <p className="destination-cartouche">
          <span className="destination-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHRINE_SVG }} />
          <span>به شوقِ زیارت</span>
        </p>
      </div>

      <div
        className="building-stage"
        data-view={view}
        data-floor={draft.floor}
        data-loading={calendar.isPending ? "true" : undefined}
        data-hover={hover ?? undefined}
      >
        <div className="arch-backdrop" aria-hidden="true" />
        <div
          ref={host}
          className="building-interactive"
          onClick={(e) => {
            const code = roomFrom(e.target);
            if (code) open(code);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const code = roomFrom(e.target);
            if (code) {
              e.preventDefault();
              open(code);
            }
          }}
          onPointerOver={(e) => setHover(roomFrom(e.target))}
          onPointerLeave={() => setHover(null)}
          onFocus={(e) => setHover(roomFrom(e.target))}
          onBlur={() => setHover(null)}
        >
          {children}
        </div>

        {hovered ? (
          <div className="building-tooltip" role="presentation" data-floor={hovered.floor}>
            <strong>{hovered.title}</strong>
            <span data-status={hovered.status}>
              {hovered.status === "unknown" ? "…" : STATUS_LABEL[hovered.status]} · تا {faDigits(hovered.capacity)} نفر
            </span>
          </div>
        ) : null}

        <div className="floor-selector" role="group" aria-label="نمایش طبقه">
          {FLOORS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={draft.floor === f}
              onClick={() => draftStore.set({ floor: f })}
              aria-label={f === 0 ? "همهٔ طبقه‌ها" : floorLabel(f)}
            >
              {f === 0 ? "همه" : faDigits(f)}
            </button>
          ))}
        </div>

        <ul className="simple-unit-list" aria-label="واحدها در زمان انتخاب‌شده">
          {rooms
            .filter((r) => draft.floor === 0 || r.floor === draft.floor)
            .map((r) => (
              <li key={r.code}>
                <button type="button" onClick={() => open(r.code)} data-status={r.status} data-fit={r.fit ?? undefined}>
                  <Icon name={unitTypeIcon(r.type)} size={22} />
                  <span className="simple-unit-list__text">
                    <strong>{r.title}</strong>
                    <small>
                      {floorLabel(r.floor)} · تا {faDigits(r.capacity)} نفر
                    </small>
                  </span>
                  <span className="status-chip" data-status={r.status}>
                    {r.status === "unknown" ? "…" : STATUS_LABEL[r.status]}
                  </span>
                </button>
              </li>
            ))}
        </ul>

        {calendar.isError ? (
          <div className="model-error" role="alert">
            <Icon name="cloud-off" size={26} />
            <strong>زمان‌های آزاد دریافت نشد</strong>
            <p>معرفی واحدها در دسترس است؛ برای وضعیت تازه دوباره تلاش کنید.</p>
            <button type="button" className="btn btn-secondary" onClick={() => void calendar.refetch()}>
              <Icon name="refresh" size={18} /> تلاش دوباره
            </button>
          </div>
        ) : null}
      </div>

      <div className="building-foot">
        <ul className="status-legend" aria-label="راهنمای رنگ‌ها">
          <li>
            <i data-status="free" aria-hidden="true" />
            آزاد
          </li>
          <li>
            <i data-status="occupied" aria-hidden="true" />
            رزروشده
          </li>
          {draft.searched ? (
            <li>
              <i data-status="fit" aria-hidden="true" />
              مناسب جست‌وجوی شما
            </li>
          ) : null}
        </ul>
        {easy ? null : (
          <div className="segment" role="group" aria-label="نوع نمایش">
            <button
              type="button"
              aria-pressed={draft.view === "building"}
              onClick={() => draftStore.set({ view: "building" })}
            >
              <Icon name="building" size={16} /> ساختمان
            </button>
            <button type="button" aria-pressed={draft.view === "list"} onClick={() => draftStore.set({ view: "list" })}>
              <Icon name="list" size={16} /> فهرست
            </button>
          </div>
        )}
      </div>
      <figcaption id="building-caption" className="building-caption">
        روی یک واحد بزنید و زمان‌های آن را ببینید · تصویر مفهومی، نه پلان واقعی
      </figcaption>
    </figure>
  );
}
