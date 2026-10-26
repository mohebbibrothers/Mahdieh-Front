"use client";
import { useId, useState } from "react";
import { featureIcon, floorLabel } from "@/entities/unit/unit";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import type { IconName } from "@/shared/ui/icon-names";
import { INITIAL_STATE, type FeatureFacet, type Filters, type Kind } from "./model";

export type Facets = {
  kinds: Record<Kind, number>;
  floors: Array<{ number: number; count: number }>;
  feats: Array<FeatureFacet & { count: number }>;
  /** امکاناتی که همهٔ واحدها دارند (فیلتر نمی‌شوند؛ یک‌جا گفته می‌شوند) */
  shared: string[];
  dated: boolean;
};

const KINDS: Array<{ id: Kind; label: string; icon: IconName }> = [
  { id: "all", label: "همهٔ واحدها", icon: "building" },
  { id: "suite", label: "سوئیت", icon: "suite" },
  { id: "large_room", label: "اتاق بزرگ", icon: "room" },
];

export const CLEARED: Filters = {
  kind: INITIAL_STATE.kind,
  floor: INITIAL_STATE.floor,
  feats: [],
  freeOnly: false,
};

/** کنترل‌های پالایش — مشترک میان کنارهٔ دسکتاپ و برگهٔ گوشی. */
export function FilterControls({
  value,
  onChange,
  facets,
}: {
  value: Filters;
  onChange: (patch: Partial<Filters>) => void;
  facets: Facets;
}) {
  const id = useId();
  return (
    <div className="uf__groups">
      <fieldset className="uf__group">
        <legend>نوع اقامت</legend>
        <div className="uf__kinds">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className="uf__kind"
              aria-pressed={value.kind === k.id}
              onClick={() => onChange({ kind: k.id })}
            >
              <Icon name={k.icon} size={18} />
              <span>{k.label}</span>
              <span className="uf__count" aria-label={`${faDigits(facets.kinds[k.id])} واحد`}>
                {faDigits(facets.kinds[k.id])}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="uf__group">
        <legend>طبقهٔ دلخواه</legend>
        <div className="uf__floors">
          <button type="button" aria-pressed={value.floor === 0} onClick={() => onChange({ floor: 0 })}>
            همه
          </button>
          {facets.floors.map((f) => (
            <button
              key={f.number}
              type="button"
              aria-pressed={value.floor === f.number}
              disabled={!f.count && value.floor !== f.number}
              onClick={() => onChange({ floor: f.number })}
            >
              {faDigits(f.number)}
              <span className="sr-only">
                {" "}
                — {floorLabel(f.number)}، {faDigits(f.count)} واحد
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {facets.feats.length ? (
        <fieldset className="uf__group">
          <legend>امکانات ثبت‌شده</legend>
          <ul className="uf__feats">
            {facets.feats.map((f) => {
              const checked = value.feats.includes(f.code);
              const fid = `${id}-${f.code}`;
              return (
                <li key={f.code}>
                  <input
                    id={fid}
                    type="checkbox"
                    className="uf__check"
                    checked={checked}
                    disabled={!f.count && !checked}
                    onChange={() =>
                      onChange({ feats: checked ? value.feats.filter((c) => c !== f.code) : [...value.feats, f.code] })
                    }
                  />
                  <label htmlFor={fid}>
                    <Icon name={featureIcon(f.code)} size={16} />
                    <span>{f.title}</span>
                    <span className="uf__count">{faDigits(f.count)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {facets.shared.length ? (
            <p className="uf__note">
              <Icon name="check" size={14} /> در همهٔ واحدها: {facets.shared.join("، ")}
            </p>
          ) : null}
          <p className="uf__note uf__note--muted">نبود یک امکان در داده، لزوماً به معنی نبود آن در مجموعه نیست.</p>
        </fieldset>
      ) : null}

      <fieldset className="uf__group uf__group--free" disabled={!facets.dated}>
        <legend className="sr-only">آزادی در بازهٔ سفر</legend>
        <div className="uf__free">
          <input
            id={`${id}-free`}
            type="checkbox"
            className="uf__check"
            checked={value.freeOnly && facets.dated}
            onChange={() => onChange({ freeOnly: !value.freeOnly })}
          />
          <label htmlFor={`${id}-free`}>
            <Icon name="calendar-check" size={16} />
            <span>فقط آزادهای بازهٔ من</span>
          </label>
        </div>
        <p className="uf__note uf__note--muted">
          {facets.dated
            ? "واحدهایی که همهٔ نیم‌روزهای سفرتان در آن‌ها آزاد است."
            : "پس از انتخاب تاریخ سفر فعال می‌شود."}
        </p>
      </fieldset>
    </div>
  );
}

/** کنارهٔ چسبان دسکتاپ (بالای ۸۵۰ پیکسل). */
export function FilterAside({
  value,
  onChange,
  facets,
  activeCount,
}: {
  value: Filters;
  onChange: (patch: Partial<Filters>) => void;
  facets: Facets;
  activeCount: number;
}) {
  return (
    <aside className="uf" aria-labelledby="uf-title">
      <header className="uf__head">
        <h2 id="uf-title">کدام فضا؟</h2>
        <button type="button" className="uf__clear" disabled={!activeCount} onClick={() => onChange(CLEARED)}>
          پاک کردن
        </button>
      </header>
      <div className="uf__scroll" data-float-scroll="" tabIndex={0}>
        <FilterControls value={value} onChange={onChange} facets={facets} />
      </div>
    </aside>
  );
}

/**
 * برگهٔ پالایش گوشی/تبلت: پیش‌نویس محلی؛ شمار نتیجه زنده پیش از اعمال دیده می‌شود
 * و فقط با «نمایش» به صفحه می‌رسد (بی پرش فهرست زیر برگه).
 */
export function FilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  facetsFor,
  countFor,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: Filters;
  onApply: (f: Filters) => void;
  facetsFor: (f: Filters) => Facets;
  countFor: (f: Filters) => number;
}) {
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="کدام فضا؟"
      subtitle="نوع، طبقه و امکانات دلخواه را انتخاب کنید."
    >
      {open ? (
        <SheetBody
          initial={value}
          onApply={onApply}
          facetsFor={facetsFor}
          countFor={countFor}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </AppDialog>
  );
}

function SheetBody({
  initial,
  onApply,
  facetsFor,
  countFor,
  onClose,
}: {
  initial: Filters;
  onApply: (f: Filters) => void;
  facetsFor: (f: Filters) => Facets;
  countFor: (f: Filters) => number;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Filters>(initial);
  const n = countFor(draft);
  return (
    <div className="uf-sheet">
      <FilterControls value={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} facets={facetsFor(draft)} />
      <div className="uf-sheet__actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          {n ? `نمایش ${faDigits(n)} واحد` : "واحدی با این شرایط نیست"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setDraft(CLEARED)}>
          پاک کردن
        </button>
      </div>
    </div>
  );
}
