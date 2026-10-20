"use client";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { cellAt, STATUS_LABEL } from "@/entities/slot/timeline";
import { featureIcon, floorLabel, unitPlan } from "@/entities/unit/unit";
import { draftStore } from "@/features/booking-draft/store";
import { useAvailability } from "@/features/booking-draft/use-availability";
import { propertyQuery } from "@/shared/api/queries";
import { faCount, faDigits, formatDayLabel } from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";

export function UnitRail() {
  const property = useQuery(propertyQuery);
  const { timeline } = useAvailability();
  const rail = useRef<HTMLUListElement>(null);
  const units = (property.data ?? [])
    .flatMap((f) => f.units)
    .toSorted((a, b) => a.floor_number - b.floor_number || a.code.localeCompare(b.code));
  const suites = units.filter((u) => u.unit_type === "suite").length;
  const rooms = units.length - suites;
  const days = timeline?.days.slice(0, 7) ?? [];

  const scroll = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    // RTL: «بعدی» یعنی حرکت به چپ (scrollLeft منفی در RTL).
    el.scrollBy({ left: -dir * (card.getBoundingClientRect().width + 20), behavior: "smooth" });
  };

  return (
    <section className="page-shell section" id="units" aria-labelledby="units-title">
      <div className="section-head">
        <div>
          <p className="section-eyebrow">فضایی برای آسودن</p>
          <h2 className="section-title" id="units-title">
            {units.length ? `${faCount(units.length)} واحد، یک حس آشنای خانه` : "پنج واحد، یک حس آشنای خانه"}
          </h2>
          <p className="section-sub">
            {units.length
              ? `${faCount(suites)} سوئیت و ${faCount(rooms)} اتاق بزرگ؛ در سه طبقهٔ مهدیه.`
              : "دو سوئیت و سه اتاق بزرگ؛ در سه طبقهٔ مهدیه."}
          </p>
        </div>
        <div className="rail-controls">
          <button type="button" className="icon-button" onClick={() => scroll(-1)} aria-label="واحد قبلی">
            <Icon name="arrow-right" size={18} />
          </button>
          <button type="button" className="icon-button" onClick={() => scroll(1)} aria-label="واحد بعدی">
            <Icon name="arrow-left" size={18} />
          </button>
        </div>
      </div>
      <ul ref={rail} className="unit-rail" aria-label="واحدهای اقامتی">
        {units.length
          ? units.map((u) => {
              const row = timeline?.units.find((x) => x.code === u.code);
              const free = row
                ? days.reduce(
                    (n, d) =>
                      n + (["day", "night"] as const).filter((k) => cellAt(row, d.day, k)?.status === "free").length,
                    0,
                  )
                : null;
              return (
                <li key={u.code} className="unit-card">
                  <div className="unit-card__visual">
                    <img
                      src={unitPlan(u.unit_type)}
                      alt={`طرح مفهومی ${u.type_label}`}
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                    />
                    <span className="unit-card__code">
                      <bdi className="latin">{u.code}</bdi>
                    </span>
                  </div>
                  <div className="unit-card__body">
                    <div className="unit-card__title">
                      <h3>{u.type_label}</h3>
                      <small>{floorLabel(u.floor_number)}</small>
                    </div>
                    <p className="unit-card__meta">
                      <span>
                        <Icon name="users" size={16} /> تا {faDigits(u.capacity_total)} نفر
                      </span>
                      <span>
                        <Icon name="building" size={16} /> {floorLabel(u.floor_number)}
                      </span>
                    </p>
                    <ul className="unit-feature-row" aria-label={`امکانات ${u.title}`}>
                      {u.features
                        .filter((f) => f.is_highlight)
                        .concat(u.features.filter((f) => !f.is_highlight))
                        .slice(0, 3)
                        .map((f) => (
                          <li key={f.code} title={f.title}>
                            <Icon name={featureIcon(f.code)} size={14} />
                            <span>{f.title}</span>
                          </li>
                        ))}
                    </ul>
                    <div className="unit-card__foot">
                      <div className="mini-availability">
                        <small>
                          {free === null ? (
                            "در حال دریافت زمان‌ها…"
                          ) : (
                            <>
                              {faDigits(free)} نیم‌روز آزاد
                              <span className="mini-availability__range"> در ۷ روز آینده</span>
                            </>
                          )}
                        </small>
                        <span className="mini-cells" aria-hidden="true">
                          {row
                            ? days.flatMap((d) =>
                                (["day", "night"] as const).map((k) => {
                                  const c = cellAt(row, d.day, k);
                                  return (
                                    <i
                                      key={`${d.day}${k}`}
                                      data-status={c?.status ?? "past"}
                                      title={c ? `${formatDayLabel(d.day)} · ${STATUS_LABEL[c.status]}` : undefined}
                                    />
                                  );
                                }),
                              )
                            : Array.from({ length: 14 }, (_, i) => <i key={i} className="skeleton" />)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-label={`دیدن واحد — ${u.title}`}
                        onClick={() => draftStore.set({ openUnit: u.code })}
                      >
                        دیدن واحد <Icon name="arrow-left" size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          : Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="unit-card unit-card--skeleton" aria-hidden="true">
                <div className="unit-card__visual skeleton" />
                <div className="unit-card__body">
                  <span className="skeleton skeleton--title" />
                  <span className="skeleton skeleton--text" />
                  <span className="skeleton skeleton--text" />
                </div>
              </li>
            ))}
      </ul>
    </section>
  );
}
