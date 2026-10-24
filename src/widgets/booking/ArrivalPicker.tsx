"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import type { ArrivalOption } from "./model";

/**
 * انتخاب‌گر «ساعت تقریبی حضور» — فهرست شناور سفارشی (بی‌‎<select>‎ بومی؛ یادداشت ۳ طراح) با الگوی
 * ‎button + listbox‎ (WAI-ARIA APG): ↑/↓/Home/End، Enter/Space، Esc و بستن با خروج فوکوس.
 */
const UNKNOWN = "";

export function ArrivalPicker({
  options,
  value,
  onChange,
  help,
}: {
  options: ArrivalOption[];
  value: string | null;
  onChange: (v: string | null) => void;
  help: string;
}) {
  const id = useId();
  const all: ArrivalOption[] = [
    ...options,
    { value: UNKNOWN, label: "هنوز مشخص نیست", hint: "پس از رزرو هم با پذیرش هماهنگ می‌شود" },
  ];
  const selected = all.find((o) => o.value === (value ?? UNKNOWN)) ?? all.at(-1);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const show = () => {
    setActive(Math.max(0, all.indexOf(selected ?? all[0]!)));
    setOpen(true);
    requestAnimationFrame(() => list.current?.focus());
  };
  const pick = (o: ArrivalOption) => {
    onChange(o.value === UNKNOWN ? null : o.value);
    setOpen(false);
    button.current?.focus();
  };
  const scrollTo = (i: number) =>
    requestAnimationFrame(() => list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }));

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = all.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      setActive(i);
      scrollTo(i);
    };
    if (e.key === "ArrowDown") move(Math.min(last, active + 1));
    else if (e.key === "ArrowUp") move(Math.max(0, active - 1));
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const o = all[active];
      if (o) pick(o);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
    }
  };

  return (
    <div className={cx("combo picker", open && "combo--open")}>
      <span className="field-label" id={`${id}-l`}>
        ساعت تقریبی حضور در زائرسرا
      </span>
      <div className="combo__control">
        <button
          ref={button}
          type="button"
          className="text-input picker__button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-labelledby={`${id}-l ${id}-v`}
          aria-describedby={`${id}-h`}
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              show();
            }
          }}
        >
          <Icon name="clock" size={18} />
          <span id={`${id}-v`}>{selected?.label}</span>
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
          hidden={!open}
          onKeyDown={onListKey}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) setOpen(false);
          }}
        >
          {all.map((o, i) => (
            <li
              key={o.value || "unknown"}
              id={`${id}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={o === selected}
              data-active={i === active ? "" : undefined}
              data-group-end={i === all.length - 2 ? "" : undefined}
              className="combo__option picker__option"
              onPointerMove={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
            >
              <span>
                {o.label}
                {o.hint ? <small>{o.hint}</small> : null}
              </span>
              {o === selected ? <Icon name="check" size={16} /> : null}
            </li>
          ))}
        </ul>
      </div>
      <p className="field-help" id={`${id}-h`}>
        {help}
      </p>
    </div>
  );
}
