"use client";
import { useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { useFloating, useTopLayer } from "./floating";
import { Icon, type IconName } from "./Icon";

export type SelectOption = {
  value: string;
  label: string;
  /** کد لاتین (مثل A1) که در نشانی جدا با رقم لاتین پیش از برچسب می‌آید. */
  code?: string;
  /** نماد گزینه‌های بی‌کد (مثلاً «همهٔ واحدها») */
  icon?: IconName;
  /** نشانهٔ متنی کوتاه در همان قاب نماد (مثلاً شمارهٔ طبقه «۲») */
  glyph?: string;
  /** سطر دوم کم‌رنگ زیر برچسب */
  hint?: string;
  /** خط جداکننده پس از این گزینه */
  groupEnd?: boolean;
  disabled?: boolean;
};

/** گوشی ⇒ برگهٔ پایینی؛ بزرگ‌تر ⇒ فهرست شناور کنار کنترل. */
const SHEET_QUERY = "(max-width: 620px)";

/**
 * فهرست انتخاب شناور سفارشی — جایگزین ‎<select>‎ بومی (یادداشت ۳ طراح: شعاع ۱۸، نوار پیمایش کپسولی).
 * الگوی ‎button + listbox‎ (WAI-ARIA APG): ↑/↓/Home/End، Enter/Space، Esc و بستن با خروج فوکوس.
 * لایهٔ بالایی (‎popover=manual‎) + موتور مشترک ‎useFloating‎: هرگز روی سرصفحه/نوار پایین نمی‌رود و اگر
 * کنترل زیر آن‌ها برود بسته می‌شود. گوشی: برگهٔ پایینی با عنوان، پس‌زمینهٔ تیره و قفل پیمایش صفحه.
 */
export function SelectMenu({
  label,
  options,
  value,
  onChange,
  icon,
  help,
  layout = "stack",
  className,
  sheetTitle,
  minWidth = 280,
  max = 340,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  icon?: IconName;
  help?: string;
  /** «stack» = برچسب بالای کنترل؛ «inline» = برچسب کنار کنترل (نوار ابزار طراح P-04) */
  layout?: "stack" | "inline";
  className?: string;
  /** عنوان برگهٔ پایینی گوشی (پیش‌فرض: همان برچسب بی دونقطه) */
  sheetTitle?: string;
  /** کمینهٔ پهنای فهرست شناور (کنترل‌های باریک نوار ابزار ⇒ فهرست خوانا) */
  minWidth?: number;
  max?: number;
}) {
  const id = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const control = useRef<HTMLDivElement>(null);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const title = sheetTitle ?? label.replace(/[:：]\s*$/, "");

  const show = () => {
    const at = selected ? options.indexOf(selected) : 0;
    setActive(at >= 0 ? at : (enabled[0] ?? 0));
    setOpen(true);
    requestAnimationFrame(() => {
      list.current?.focus({ preventScroll: true });
      list.current?.querySelector(`[data-i="${at}"]`)?.scrollIntoView({ block: "nearest" });
    });
  };
  const hide = (refocus = false) => {
    setOpen(false);
    if (refocus) button.current?.focus({ preventScroll: true });
  };
  const pick = (o: SelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    hide(true);
  };
  const scrollTo = (i: number) =>
    requestAnimationFrame(() => list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }));

  const step = (dir: 1 | -1) => {
    const pos = enabled.indexOf(active);
    const next = enabled[Math.min(enabled.length - 1, Math.max(0, pos + dir))];
    return next ?? active;
  };
  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const move = (i: number) => {
      e.preventDefault();
      setActive(i);
      scrollTo(i);
    };
    if (e.key === "ArrowDown") move(step(1));
    else if (e.key === "ArrowUp") move(step(-1));
    else if (e.key === "Home") move(enabled[0] ?? 0);
    else if (e.key === "End") move(enabled.at(-1) ?? 0);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const o = options[active];
      if (o) pick(o);
    } else if (e.key === "Escape") {
      // Esc نخست فقط فهرست را می‌بندد، نه پنجرهٔ والد را.
      e.preventDefault();
      e.stopPropagation();
      hide(true);
    } else if (e.key === "Tab") hide();
  };
  // کلیک درون برگه (عنوان، فاصله‌ها) فوکوس فهرست را نمی‌گیرد؛ کلیک روی پس‌زمینهٔ تیره (بیرون از قاب) ⇒ بستن.
  const keepFocus = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) e.preventDefault();
  };

  useTopLayer(open, pop);
  useFloating(open, control, pop, { align: "stretch", minWidth, max, sheet: SHEET_QUERY, onHidden: hide });

  return (
    <div className={cx("combo picker", `picker--${layout}`, open && "combo--open", className)}>
      <span className="field-label" id={`${id}-l`}>
        {label}
      </span>
      <div className="combo__control" ref={control}>
        <button
          ref={button}
          type="button"
          className="text-input picker__button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-labelledby={`${id}-l ${id}-v`}
          aria-describedby={help ? `${id}-h` : undefined}
          onClick={() => (open ? hide() : show())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              show();
            }
          }}
        >
          {icon ? <Icon name={icon} size={18} /> : null}
          <span id={`${id}-v`} className="picker__value">
            {selected?.code ? (
              <>
                <bdi className="latin select-code select-code--sm">{selected.code}</bdi>{" "}
              </>
            ) : null}
            {selected?.label}
          </span>
          <span className="combo__toggle" aria-hidden="true">
            <Icon name="chevron-down" size={18} />
          </span>
        </button>
        <div ref={pop} className="select-pop" popover="manual" onMouseDown={keepFocus}>
          <div className="select-pop__head" aria-hidden="true">
            <span className="select-pop__grab" />
            <strong>{title}</strong>
            <button type="button" tabIndex={-1} className="select-pop__close" onClick={() => hide(true)}>
              <Icon name="x" size={18} />
            </button>
          </div>
          <ul
            ref={list}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-l`}
            aria-activedescendant={open ? `${id}-o${active}` : undefined}
            className="select-pop__list"
            data-float-scroll=""
            onKeyDown={onListKey}
            onBlur={(e) => {
              if (!control.current?.contains(e.relatedTarget as Node | null)) hide();
            }}
          >
            {options.map((o, i) => (
              <li
                key={o.value || "empty"}
                id={`${id}-o${i}`}
                data-i={i}
                role="option"
                aria-selected={o === selected}
                aria-disabled={o.disabled || undefined}
                data-active={i === active ? "" : undefined}
                data-group-end={o.groupEnd ? "" : undefined}
                className="select-opt"
                onPointerMove={() => !o.disabled && i !== active && setActive(i)}
                onClick={() => pick(o)}
              >
                {o.code ? (
                  <bdi className="latin select-code">{o.code}</bdi>
                ) : o.icon || o.glyph ? (
                  <span className="select-opt__glyph" aria-hidden="true">
                    {o.icon ? <Icon name={o.icon} size={18} /> : o.glyph}
                  </span>
                ) : null}
                <span className="select-opt__text">
                  <span className="select-opt__label">{o.label}</span>
                  {o.hint ? <small>{o.hint}</small> : null}
                </span>
                <span className="select-opt__check" aria-hidden="true">
                  {o === selected ? <Icon name="check" size={18} /> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {help ? (
        <p className="field-help" id={`${id}-h`}>
          {help}
        </p>
      ) : null}
    </div>
  );
}
