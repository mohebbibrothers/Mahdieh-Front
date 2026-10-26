"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useMemo, useState } from "react";
import { fieldErrors } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/client";
import { type ArrivalPatch, updateArrival } from "@/shared/api/portal";
import { rk } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { faDigits, formatClock } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { ArrivalPicker } from "@/widgets/booking/ArrivalPicker";
import { NEEDS, NOTE_MAX, arrivalLabel, arrivalOptions, composeNote, parseNote } from "@/widgets/booking/model";
import { PlateInput, type PlateValue } from "@/widgets/booking/PlateInput";

/**
 * «هماهنگی ورود» پس از ثبت (طراح: مودال «تنظیم ساعت ورود و پلاک خودرو») — فقط فیلدهای تغییرکرده
 * فرستاده می‌شوند (‎PATCH‎ جزئی)؛ پس از پذیرش حضوری سرور ‎409 details_locked‎ می‌دهد و کارت تازه می‌شود.
 */
export function ArrivalDialog({
  reservation,
  isOpen,
  onOpenChange,
}: {
  reservation: Reservation;
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="هماهنگی ساعت ورود و پلاک خودرو"
      subtitle={`رزرو ${reservation.code} · تحویل کلید از ساعت ${formatClock(reservation.start)}`}
      size="md"
    >
      {/* هر بار گشودن ⇒ فرم تازه از آخرین دادهٔ سرور */}
      {isOpen ? <ArrivalForm r={reservation} onDone={() => onOpenChange(false)} /> : null}
    </AppDialog>
  );
}

function ArrivalForm({ r, onDone }: { r: Reservation; onDone: () => void }) {
  const id = useId();
  const qc = useQueryClient();
  const initialArrival = r.expected_arrival ? r.expected_arrival.slice(0, 5) : null;
  const initialNote = useMemo(() => parseNote(r.guest_note ?? ""), [r.guest_note]);
  const [arrival, setArrival] = useState<string | null>(initialArrival);
  const [plate, setPlate] = useState<PlateValue>({ text: r.vehicle_plate, complete: true });
  const [plateTouched, setPlateTouched] = useState(false);
  const [needs, setNeeds] = useState<string[]>(initialNote.needs);
  const [text, setText] = useState(initialNote.text);
  const note = composeNote(needs, text);
  const headLen = composeNote(needs, "").length + (needs.length ? 3 : 0);
  const textMax = Math.max(0, NOTE_MAX - headLen);

  // ساعت ثبت‌شدهٔ قبلی ممکن است خارج از پیشنهادهای امروز باشد — در فهرست نگهش می‌داریم.
  const options = useMemo(() => {
    const base = arrivalOptions(r.start);
    if (!initialArrival || base.some((o) => o.value === initialArrival)) return base;
    return [
      { value: initialArrival, label: arrivalLabel(initialArrival) ?? initialArrival, hint: "ساعت ثبت‌شدهٔ فعلی" },
      ...base,
    ];
  }, [r.start, initialArrival]);

  const patch: ArrivalPatch = {
    ...(arrival !== initialArrival ? { expected_arrival: arrival } : {}),
    ...(plate.text !== r.vehicle_plate ? { vehicle_plate: plate.text } : {}),
    ...(note !== (r.guest_note ?? "") ? { guest_note: note } : {}),
  };
  const dirty = Object.keys(patch).length > 0;

  const save = useMutation<Reservation, Error>({
    mutationFn: () => updateArrival(r.code, patch),
    onSuccess: (next) => {
      qc.setQueryData(rk.reservation(next.code), next);
      void qc.invalidateQueries({ queryKey: ["me", "reservations"] });
      void qc.invalidateQueries({ queryKey: rk.timeline(next.code) });
      toast("هماهنگی ورود به‌روز شد؛ پذیرش در جریان است.", "success");
      onDone();
    },
    onError: (e) => {
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
        void qc.invalidateQueries({ queryKey: ["me"] });
      }
    },
  });
  const errors = fieldErrors(save.error);
  const locked = save.error instanceof ApiError && save.error.status === 409;
  const plateBad = plateTouched && !plate.complete;

  return (
    <form
      className="account-flow pt-arrival"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setPlateTouched(true);
        if (!plate.complete) {
          document.getElementById(`${id}-plate`)?.querySelector<HTMLInputElement>("input")?.focus();
          return;
        }
        if (!dirty) {
          onDone();
          return;
        }
        save.mutate();
      }}
    >
      <p className="pt-arrival__lead">
        <Icon name="car" size={18} />
        <span>
          با ثبت پلاک، خادمان پارکینگ خودروی شما را از پیش می‌شناسند؛ ساعت رسیدن هم برای آماده‌سازی کلید و حضور خادم
          کشیک به کار می‌رود. هر دو اختیاری‌اند و تا پیش از پذیرش حضوری قابل تغییرند.
        </span>
      </p>

      <div className="acc-row acc-row--trio pt-arrival__row">
        <ArrivalPicker
          options={options}
          value={arrival}
          onChange={setArrival}
          help={`تحویل کلید از ساعت ${formatClock(r.start)}؛ خادم کشیک در طول شب حضور دارد.`}
        />
        <div id={`${id}-plate`}>
          <PlateInput onChange={setPlate} invalid={plateBad} initial={r.vehicle_plate} />
        </div>
      </div>
      {errors.expected_arrival ? <p className="field-error">{errors.expected_arrival}</p> : null}
      {errors.vehicle_plate ? <p className="field-error">{errors.vehicle_plate}</p> : null}

      <div className="acc-field note-field">
        <label className="field-label" htmlFor={`${id}-note`}>
          یادداشت به خادمان پذیرش (اختیاری)
        </label>
        <div className="need-chips" role="group" aria-label="نیازهای ویژه (افزودن به یادداشت)">
          {NEEDS.map((n) => (
            <button
              key={n}
              type="button"
              className="need-chip"
              aria-pressed={needs.includes(n)}
              onClick={() => setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]))}
            >
              <Icon name={needs.includes(n) ? "check" : "plus"} size={14} />
              {n}
            </button>
          ))}
        </div>
        <textarea
          id={`${id}-note`}
          className="text-input note-field__input"
          rows={3}
          maxLength={textMax}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, textMax))}
          placeholder="مثلاً: همراه کالسکهٔ کودک هستیم؛ اگر ممکن است واحد نزدیک آسانسور باشد."
          aria-describedby={`${id}-note-c`}
          aria-invalid={errors.guest_note ? true : undefined}
        />
        <p className="note-field__count" id={`${id}-note-c`} aria-live="polite">
          <bdi>
            {faDigits(note.length)} / {faDigits(NOTE_MAX)}
          </bdi>{" "}
          نویسه
        </p>
        {errors.guest_note ? <p className="field-error">{errors.guest_note}</p> : null}
      </div>

      {save.error && !Object.keys(errors).length ? (
        <div className="verdict verdict--bad" role="alert">
          <Icon name={locked ? "lock" : "alert"} size={18} />
          <div className="verdict__body">
            <strong>{locked ? "هماهنگی ورود دیگر قابل ویرایش نیست" : save.error.message}</strong>
            {locked ? (
              <span>پذیرش حضوری انجام شده یا رزرو دیگر فعال نیست؛ برای تغییر با پذیرش تماس بگیرید.</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="account-actions pt-arrival__actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={save.isPending || locked}
          aria-busy={save.isPending}
        >
          {save.isPending ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={18} />}
          {save.isPending ? "در حال ثبت…" : dirty ? "ثبت و به‌روزرسانی" : "بدون تغییر — بستن"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          انصراف
        </button>
      </div>
    </form>
  );
}
