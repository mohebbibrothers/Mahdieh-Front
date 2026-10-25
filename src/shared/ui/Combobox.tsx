"use client";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { latinDigits } from "@/shared/lib/fa";
import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import { useAnchoredList } from "./use-anchored-list";

export type ComboOption = {
  value: string;
  label: string;
  /** واژه‌های جست‌وجوی اضافه (مثلاً نام لاتین کشور یا کد آن) */
  keywords?: string;
  /** گزینه‌های پرتکرار بالای فهرست (با خط جداکننده) */
  priority?: boolean;
};

/** یکسان‌سازی فارسی برای جست‌وجو: ی/ک عربی، نیم‌فاصله، اعراب و رقم‌ها. */
export function normalizeSearch(s: string): string {
  return latinDigits(s)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ءأإآ]/g, "ا")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[\u200c\s]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * انتخاب‌گر قابل جست‌وجو — جایگزین <select> بومی (قاعدهٔ طراح: هیچ select بومی نباشد).
 * الگوی ARIA 1.2 combobox + listbox: فوکوس روی ورودی می‌ماند و گزینهٔ فعال با
 * aria-activedescendant اعلام می‌شود؛ ↑/↓/Home/End/Enter/Esc. Esc فقط فهرست را می‌بندد (نه پنجره را).
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "جست‌وجو یا انتخاب…",
  error,
  help,
  required,
  name,
  emptyText = "موردی پیدا نشد.",
  quickPicks = 0,
}: {
  label: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | undefined;
  help?: string | undefined;
  required?: boolean;
  name?: string;
  emptyText?: string;
  /** چند گزینهٔ پرتکرار (‎priority‎) به‌صورت «قرص» زیر کنترل — انتخاب با یک لمس (طراح P-05) */
  quickPicks?: number;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const q = normalizeSearch(query ?? "");
  const shown = useMemo(() => {
    const hits = q
      ? options.filter((o) => normalizeSearch(`${o.label} ${o.keywords ?? ""} ${o.value}`).includes(q))
      : options;
    if (q) {
      // آغازِ نام مهم‌تر از میانهٔ آن است.
      return [...hits].sort(
        (a, b) => Number(!normalizeSearch(a.label).startsWith(q)) - Number(!normalizeSearch(b.label).startsWith(q)),
      );
    }
    return [...hits.filter((o) => o.priority), ...hits.filter((o) => !o.priority)];
  }, [options, q]);
  const priorityCount = q ? 0 : shown.filter((o) => o.priority).length;

  const openList = () => {
    if (open) return;
    const at = shown.findIndex((o) => o.value === value);
    setActive(Math.max(0, at));
    setOpen(true);
    requestAnimationFrame(() => scrollActive(Math.max(0, at)));
  };
  const close = () => {
    setOpen(false);
    setQuery(null);
  };
  const choose = (o: ComboOption | undefined) => {
    if (!o) return;
    onChange(o.value);
    close();
  };
  const scrollActive = (i: number) => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.scrollIntoView({ block: "nearest" });
  };
  const move = (i: number) => {
    const next = Math.max(0, Math.min(shown.length - 1, i));
    setActive(next);
    scrollActive(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) move(active + 1);
        else openList();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) move(active - 1);
        else openList();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          move(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          move(shown.length - 1);
        }
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          choose(shown[active]);
        }
        break;
      case "Escape":
        if (open) {
          // جلوی «درخواست بستن» پنجرهٔ والد را می‌گیرد: Esc اول فقط فهرست را می‌بندد.
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case "Tab":
        if (open && query) choose(shown[active]);
        else close();
        break;
    }
  };

  useAnchoredList(open, controlRef, listRef, { dep: shown.length });

  const describedBy = [help ? helpId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  const activeId = open && shown[active] ? `${id}-o-${shown[active].value}` : undefined;

  return (
    <div className={cx("combo", open && "combo--open")}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="required-star" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="combo__control" ref={controlRef}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          className="text-input combo__input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={selected ? selected.label : placeholder}
          value={query ?? selected?.label ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onClick={openList}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) close();
          }}
        />
        <button
          type="button"
          className="combo__toggle"
          tabIndex={-1}
          aria-label={open ? `بستن فهرست ${label}` : `باز کردن فهرست ${label}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close();
            else {
              openList();
              inputRef.current?.focus();
            }
          }}
        >
          <Icon name="chevron-down" size={18} />
        </button>
        <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="combo__list" popover="manual">
          {shown.length === 0 ? (
            <li className="combo__empty" role="presentation">
              {emptyText}
            </li>
          ) : null}
          {shown.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-o-${o.value}`}
              role="option"
              data-index={i}
              data-group-end={priorityCount > 0 && i === priorityCount - 1 ? "" : undefined}
              aria-selected={o.value === value}
              data-active={i === active || undefined}
              className="combo__option"
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => i !== active && setActive(i)}
              onClick={() => choose(o)}
            >
              <span>{o.label}</span>
              {o.value === value ? <Icon name="check" size={16} /> : null}
            </li>
          ))}
        </ul>
      </div>
      {quickPicks > 0 && options.some((o) => o.priority) ? (
        <div className="combo__quick" role="group" aria-label={`${label} — گزینه‌های پرتکرار`}>
          <span aria-hidden="true">پرتکرار:</span>
          {options
            .filter((o) => o.priority)
            .slice(0, quickPicks)
            .map((o) => (
              <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
                {o.label}
              </button>
            ))}
        </div>
      ) : null}
      {help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
