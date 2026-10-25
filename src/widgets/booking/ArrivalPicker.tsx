"use client";
import { SelectMenu } from "@/shared/ui/SelectMenu";
import type { ArrivalOption } from "./model";

/**
 * انتخاب‌گر «ساعت تقریبی حضور» — روی فهرست شناور مشترک سایت (‎SelectMenu‎؛ بی ‎<select>‎ بومی، یادداشت ۳
 * طراح). گزینهٔ پایانی «هنوز مشخص نیست» با خط جداکننده از ساعت‌ها جدا می‌شود.
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
  const all = [
    ...options.map((o, i) => ({ ...o, groupEnd: i === options.length - 1 })),
    { value: UNKNOWN, label: "هنوز مشخص نیست", hint: "پس از رزرو هم با پذیرش هماهنگ می‌شود" },
  ];
  return (
    <SelectMenu
      label="ساعت تقریبی حضور در زائرسرا"
      icon="clock"
      options={all}
      value={value ?? UNKNOWN}
      onChange={(v) => onChange(v === UNKNOWN ? null : v)}
      help={help}
    />
  );
}
