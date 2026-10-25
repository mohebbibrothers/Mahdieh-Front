"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon, type IconName } from "./Icon";
import { useAnchoredList } from "./use-anchored-list";

export type SelectOption = {
  value: string;
  label: string;
  /** کد لاتین (مثل A1) که پیش از برچسب، جدا و با رقم لاتین می‌آید. */
  code?: string;
  /** سطر دوم کم‌رنگ زیر برچسب */
  hint?: string;
  /** خط جداکننده پس از این گزینه */
  groupEnd?: boolean;
  disabled?: boolean;
};

/**
 * فهرست انتخاب شناور سفارشی — جایگزین ‎<select>‎ بومی (یادداشت ۳ طراح: شعاع ۱۸، نوار پیمایش کپسولی).
 * الگوی ‎button + listbox‎ (WAI-ARIA APG): ↑/↓/Home/End، Enter/Space، Esc و بستن با خروج فوکوس؛
 * فهرست در لایهٔ بالایی (‎popover=manual‎) تا هیچ ظرف پیمایش‌پذیری آن را نبُرد.
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
  max = 300,
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
  max?: number;
}) {
  const id = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const control = useRef<HTMLDivElement>(null);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const show = () => {
    const at = selected ? options.indexOf(selected) : 0;
    setActive(at >= 0 ? at : (enabled[0] ?? 0));
    setOpen(true);
    requestAnimationFrame(() => list.current?.focus());
  };
  const pick = (o: SelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
    button.current?.focus();
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
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
    }
  };

  useAnchoredList(open, control, list, { max });

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
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              show();
            }
          }}
        >
          {icon ? <Icon name={icon} size={18} /> : null}
          <span id={`${id}-v`}>
            {selected?.code ? <OptionCode code={selected.code} /> : null}
            {selected?.label}
          </span>
          <span className="combo__toggle" aria-hidden="true">
            <Icon name="chevron-down" size={18} />
          </span>
        </button>
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-l`}
          aria-activedescendant={open ? `${id}-o${active}` : undefined}
          className="combo__list"
          popover="manual"
          onKeyDown={onListKey}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setOpen(false);
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
              className="combo__option picker__option"
              onPointerMove={() => !o.disabled && setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
            >
              <span>
                <span className="combo__label">
                  {o.code ? <OptionCode code={o.code} /> : null}
                  {o.label}
                </span>
                {o.hint ? <small>{o.hint}</small> : null}
              </span>
              {o === selected ? <Icon name="check" size={16} /> : null}
            </li>
          ))}
        </ul>
      </div>
      {help ? (
        <p className="field-help" id={`${id}-h`}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

function OptionCode({ code }: { code: string }) {
  return (
    <>
      <bdi className="latin">{code}</bdi>
      {" — "}
    </>
  );
}
