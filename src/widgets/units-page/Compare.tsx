"use client";
import type { ReactNode } from "react";
import { featureIcon } from "@/entities/unit/unit";
import { unitPageHref, type TripQuery } from "@/shared/config/destinations";
import { cx } from "@/shared/lib/cx";
import { faDigits, guestsLabel } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import type { AvailCopy } from "./copy";
import { compareFeatures, MAX_COMPARE, type CatalogUnit } from "./model";
import { composition } from "./UnitCard";

/** سینی شناور مقایسه (بالای نوار پایین گوشی). */
export function CompareTray({
  units,
  onRemove,
  onClear,
  onOpen,
}: {
  units: CatalogUnit[];
  onRemove: (code: string) => void;
  onClear: () => void;
  onOpen: () => void;
}) {
  if (!units.length) return null;
  const ready = units.length >= 2;
  return (
    <section className="ucmp-tray" aria-label="واحدهای انتخاب‌شده برای مقایسه" data-float-guard="">
      <p className="ucmp-tray__label">
        <Icon name="compare" size={18} />
        <span>
          <strong>{faDigits(units.length)}</strong> از {faDigits(MAX_COMPARE)} واحد
        </span>
      </p>
      <ul className="ucmp-tray__list">
        {units.map((u) => (
          <li key={u.code}>
            <bdi className="latin">{u.code}</bdi>
            <button type="button" onClick={() => onRemove(u.code)}>
              <Icon name="x" size={12} />
              <span className="sr-only">حذف {u.title} از مقایسه</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary ucmp-tray__go"
        disabled={!ready}
        onClick={onOpen}
        id="compare-open"
      >
        {ready ? `مقایسهٔ ${faDigits(units.length)} واحد` : "یک واحد دیگر نشانه بزنید"}
      </button>
      <button type="button" className="icon-button ucmp-tray__clear" onClick={onClear}>
        <Icon name="x" size={18} />
        <span className="sr-only">پاک کردن مقایسه</span>
      </button>
    </section>
  );
}

type Row = { id: string; label: ReactNode; cells: ReactNode[]; differs: boolean };

/**
 * جدول مقایسه — نقش‌های ARIA جدول (نه ‎<table>‎) تا در گوشی همان ساختار بی پیمایش افقی
 * به ردیف‌های «عنوان + ستون‌های کنار هم» بشکند. ردیف‌هایی که تفاوت دارند برجسته‌اند.
 */
export function CompareDialog({
  open,
  onOpenChange,
  units,
  copies,
  onRemove,
  onChoose,
  chooseLabel,
  trip,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  units: CatalogUnit[];
  copies: Map<string, AvailCopy>;
  onRemove: (code: string) => void;
  onChoose: (u: CatalogUnit) => void;
  chooseLabel: (u: CatalogUnit) => string;
  /** شرایط سفر جاری — همراه پیوند صفحهٔ کامل هر واحد */
  trip?: TripQuery;
}) {
  const feats = compareFeatures(units);
  const same = (vals: Array<string | number | boolean>) => vals.every((v) => v === vals[0]);
  const rows: Row[] = [
    {
      id: "cap",
      label: "ظرفیت کل",
      cells: units.map((u) => guestsLabel(u.capacity_total)),
      differs: !same(units.map((u) => u.capacity_total)),
    },
    {
      id: "mix",
      label: "ترکیب ثبت‌شده",
      cells: units.map((u) => composition(u) ?? "—"),
      differs: !same(units.map((u) => composition(u) ?? "")),
    },
    {
      id: "floor",
      label: "طبقه",
      cells: units.map((u) => u.floorTitle),
      differs: !same(units.map((u) => u.floor_number)),
    },
    {
      id: "access",
      label: "دسترسی",
      cells: units.map((u) => u.access || "ثبت نشده"),
      differs: !same(units.map((u) => u.access)),
    },
    {
      id: "time",
      label: "زمان مناسب",
      cells: units.map((u) => {
        const c = copies.get(u.code);
        return c ? (
          <span className="ucmp-time" data-tone={c.tone}>
            <strong>{c.title}</strong>
            <small>{c.sub}</small>
          </span>
        ) : (
          "—"
        );
      }),
      differs: !same(units.map((u) => copies.get(u.code)?.title ?? "")),
    },
    ...feats.map((f) => {
      const has = units.map((u) => u.features.find((x) => x.code === f.code));
      return {
        id: `f-${f.code}`,
        label: (
          <>
            <Icon name={featureIcon(f.code)} size={16} /> {f.title}
          </>
        ),
        cells: has.map((x, i) =>
          x ? (
            <span key={units[i]?.code} className="ucmp-yes">
              <Icon name="check" size={14} /> ثبت شده{x.note ? <small>{x.note}</small> : null}
            </span>
          ) : (
            <span key={units[i]?.code} className="ucmp-no">
              ثبت نشده
            </span>
          ),
        ),
        differs: !same(has.map(Boolean)),
      };
    }),
    { id: "cost", label: "هزینه", cells: units.map(() => "کاملاً رایگان"), differs: false },
  ];

  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      className="up-dlg up-dlg--compare"
      size="xl"
      title="مقایسهٔ واحدها"
      subtitle="ردیف‌هایی که نشانهٔ طلایی دارند، میان واحدها متفاوت‌اند."
      actions={
        <button type="button" className="btn btn-ghost ucmp__back" onClick={() => onOpenChange(false)}>
          <Icon name="arrow-right" size={18} /> بازگشت به واحدها
        </button>
      }
    >
      {/* CSP درون‌خطی را منع می‌کند ⇒ شمار ستون‌ها با ‎data-cols‎ به CSS می‌رسد */}
      <div className="ucmp" role="table" aria-label="مقایسهٔ واحدها" data-cols={units.length}>
        <div className="ucmp__row ucmp__row--head" role="row">
          <span className="ucmp__label" role="columnheader">
            <span className="sr-only">ویژگی</span>
          </span>
          {units.map((u) => (
            <div key={u.code} className="ucmp__unit" role="columnheader">
              <div className="ucmp__unit-top">
                <span className="ucmp__code">
                  <bdi className="latin">{u.code}</bdi>
                </span>
                {units.length > 2 ? (
                  <button type="button" className="icon-button ucmp__remove" onClick={() => onRemove(u.code)}>
                    <Icon name="x" size={14} />
                    <span className="sr-only">حذف {u.title} از مقایسه</span>
                  </button>
                ) : null}
              </div>
              <strong>
                <a className="ucmp__title" href={unitPageHref(u.code, trip) ?? undefined}>
                  {u.title}
                </a>
              </strong>
              <button type="button" className="btn btn-primary btn-sm ucmp__choose" onClick={() => onChoose(u)}>
                {chooseLabel(u)}
              </button>
            </div>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.id} className={cx("ucmp__row", r.differs && "is-diff")} role="row">
            <span className="ucmp__label" role="rowheader">
              {r.label}
            </span>
            {r.cells.map((c, i) => (
              <span key={units[i]?.code ?? i} className="ucmp__cell" role="cell">
                <bdi className="latin ucmp__cell-code" aria-hidden="true">
                  {units[i]?.code}
                </bdi>
                <span className="ucmp__cell-value">{c}</span>
              </span>
            ))}
          </div>
        ))}
        {/* گوشی/تبلت: فراخوان‌ها از سرِ چسبان به ردیف پایانی می‌آیند تا سر جمع‌وجور بماند */}
        <div className="ucmp__row ucmp__row--choose" role="row">
          <span className="ucmp__label" role="rowheader">
            <Icon name="calendar" size={16} /> انتخاب زمان
          </span>
          {units.map((u) => (
            <span key={u.code} className="ucmp__cell" role="cell">
              <button type="button" className="btn btn-primary btn-sm ucmp__choose" onClick={() => onChoose(u)}>
                {chooseLabel(u)}
                <span className="sr-only"> — {u.title}</span>
              </button>
            </span>
          ))}
        </div>
      </div>
    </AppDialog>
  );
}

/** «راهنمای مقایسه»: پیشنهادهای آماده از خود داده، یا باز کردن مستقیم مقایسهٔ نشانه‌خورده‌ها. */
export function PresetsDialog({
  open,
  onOpenChange,
  presets,
  selected,
  onPick,
  onOpenCurrent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presets: Array<{ id: string; title: string; hint: string; codes: string[] }>;
  selected: CatalogUnit[];
  onPick: (codes: string[]) => void;
  onOpenCurrent: () => void;
}) {
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="راهنمای مقایسه"
      subtitle="یک ترکیب آماده را انتخاب کنید یا روی هر کارت «مقایسه» را بزنید (تا سه واحد)."
    >
      <div className="ucmp-presets">
        {selected.length >= 2 ? (
          <button
            type="button"
            className="ucmp-preset ucmp-preset--current"
            onClick={() => {
              onOpenCurrent();
              onOpenChange(false);
            }}
          >
            <Icon name="compare" size={20} />
            <span>
              <strong>مقایسهٔ انتخاب‌های شما</strong>
              <small>
                {selected.map((u) => (
                  <bdi key={u.code} className="latin">
                    {u.code}
                  </bdi>
                ))}
              </small>
            </span>
            <Icon name="arrow-left" size={18} />
          </button>
        ) : null}
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="ucmp-preset"
            onClick={() => {
              onPick(p.codes);
              onOpenChange(false);
            }}
          >
            <Icon name={p.id.startsWith("floor") ? "building" : "columns"} size={20} />
            <span>
              <strong>{p.title}</strong>
              <small>
                {p.codes.map((c) => (
                  <bdi key={c} className="latin">
                    {c}
                  </bdi>
                ))}
              </small>
            </span>
            <Icon name="arrow-left" size={18} />
          </button>
        ))}
        <ol className="ucmp-steps">
          <li>روی کارت هر واحد «مقایسه» را بزنید؛ دو یا سه واحد کافی است.</li>
          <li>از سینی پایین صفحه «مقایسه» را باز کنید؛ ردیف‌های متفاوت برجسته‌اند.</li>
          <li>از همان جدول، واحد مناسب را برای همان زمان سفر انتخاب کنید.</li>
        </ol>
      </div>
    </AppDialog>
  );
}
