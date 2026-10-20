"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { floorLabel } from "@/entities/unit/unit";
import { configQuery, propertyQuery } from "@/shared/api/queries";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";

/** «آشنایی با مهدیه»: طبقه‌ها، واحدها و نکات دسترس‌پذیری از ‎/property‎؛ نشانی از ‎/config‎. */
export function HeroAbout() {
  const [open, setOpen] = useState(false);
  const property = useQuery({ ...propertyQuery, enabled: open });
  const config = useQuery({ ...configQuery, enabled: open });
  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        آشنایی با مهدیه
        <Icon name="arrow-up-left" size={18} />
      </button>
      <AppDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="آشنایی با مهدیه"
        subtitle="خانه‌ای سه‌طبقه برای میزبانی رایگان زائران امام رضا (ع)"
        actions={
          <a className="btn btn-primary" href="#quick-search" onClick={() => setOpen(false)}>
            دیدن زمان‌های آزاد <Icon name="arrow-left" size={18} />
          </a>
        }
      >
        <div className="about-floors">
          {(property.data ?? [])
            .toSorted((a, b) => b.number - a.number)
            .map((f) => (
              <section key={f.number} className="about-floor">
                <h3>
                  <span className="about-floor__num">{faDigits(f.number)}</span>
                  {f.title || floorLabel(f.number)}
                </h3>
                {f.description ? <p>{f.description}</p> : null}
                <ul>
                  {f.units.map((u) => (
                    <li key={u.code}>
                      <bdi className="latin">{u.code}</bdi> {u.title} · تا {faDigits(u.capacity_total)} نفر
                    </li>
                  ))}
                </ul>
                {f.accessibility_notes ? (
                  <p className="about-floor__a11y">
                    <Icon name="accessibility" size={16} /> {f.accessibility_notes}
                  </p>
                ) : null}
              </section>
            ))}
          {property.isPending ? <div className="skeleton skeleton--block" /> : null}
        </div>
        {config.data?.site.support_address ? (
          <p className="about-address">
            <Icon name="map-pin" size={18} /> {config.data.site.support_address}
          </p>
        ) : null}
      </AppDialog>
    </>
  );
}
