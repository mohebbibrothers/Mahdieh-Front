"use client";
import { useQuery } from "@tanstack/react-query";
import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod/mini";
import {
  cancelReservation,
  completeHousekeeping,
  createBlock,
  createStaffReservation,
  moveReservation,
  removeBlock,
  startHousekeeping,
  transition,
  type Desk,
  type DeskRow,
  type DeskUnit,
} from "@/shared/api/desk";
import { configQuery } from "@/shared/api/queries";
import { cx } from "@/shared/lib/cx";
import { durationLabel, faDigits, latinDigits } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { Combobox, type ComboOption } from "@/shared/ui/Combobox";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { SelectMenu } from "@/shared/ui/SelectMenu";
import { Stepper } from "@/shared/ui/Stepper";
import {
  ChoiceCards,
  DateField,
  DialogActions,
  FormSection,
  ReasonField,
  Summary,
  TimeField,
  fieldError,
} from "./form";
import {
  BLOCK_REASONS,
  MAX_CELLS,
  MOVE_REASONS,
  NO_SHOW_REASONS,
  REASON_MIN,
  UNBLOCK_REASONS,
  latticeRange,
  liveProgress,
  minutesLabel,
  phoneLooksValid,
  readLattice,
  releasePresets,
  selectionOf,
  tehranDay,
  tehranIso,
  tehranMoment,
  type Period,
  tehranLabel,
} from "./model";
import { PlateInput, type PlateValue } from "@/widgets/booking/PlateInput";
import { LanePill, Latin, Notice, UnitBadge } from "./parts";
import { errorText, useDeskRuntime } from "./runtime";

type Close = () => void;

/* ── پوستهٔ مشترک پنجرهٔ فرم ─────────────────────────────────────────────── */
function FormDialog({
  title,
  subtitle,
  close,
  onSubmit,
  actions,
  size = "md",
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  close: Close;
  onSubmit: () => void;
  actions: (formId: string) => ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "amber" | "danger";
  children: ReactNode;
}) {
  const formId = useId();
  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && close()}
      title={title}
      subtitle={subtitle}
      size={size}
      className={cx("rc-dialog", tone && `rc-dialog--${tone}`)}
      actions={actions(formId)}
    >
      <form
        id={formId}
        className="rc-form"
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {children}
      </form>
    </AppDialog>
  );
}

/** یک کنش در حال اجرا ⇒ قفل دکمه؛ پایان موفق ⇒ بستن پنجره، ناموفق ⇒ خطای فیلدی در فرم. */
function useSubmit(close: Close) {
  const { run } = useDeskRuntime();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submit = async <T,>(task: () => Promise<T>, opts: Parameters<typeof run>[1] = {}) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const out = await run(task, opts);
    setBusy(false);
    if (out.ok) close();
    else setError(out.error);
  };
  return { busy, error, submit };
}

const unitOf = (r: unknown) => (r as { unit: DeskUnit }).unit;

/* ── نظافت: خادم + مدت ───────────────────────────────────────────────────── */
const MINUTE_HINT: Record<number, string> = {
  30: "نظافت سبک و مرتب‌سازی",
  45: "استاندارد و تعویض ملافه",
  60: "شست‌وشوی کامل و ضدعفونی",
  90: "ضدعفونی عمیق و تجهیز کامل",
};

function HousekeepingFields({
  desk,
  assignee,
  setAssignee,
  minutes,
  setMinutes,
  error,
}: {
  desk: Desk;
  assignee: string;
  setAssignee: (v: string) => void;
  minutes: number;
  setMinutes: (v: number) => void;
  error: unknown;
}) {
  const hk = desk.housekeeping;
  const nameId = useId();
  const stepId = useId();
  const custom = !hk.presets.includes(minutes);
  const nameErr = fieldError(error, "assignee") ?? fieldError(error, "housekeeper");
  return (
    <>
      <div className="rc-field">
        <label className="field-label" htmlFor={nameId}>
          خادم مسئول نظافت و آماده‌سازی
        </label>
        {hk.suggestions.length ? (
          <div className="rc-suggest" role="group" aria-label="خادمان اخیر">
            {hk.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="rc-suggest__chip"
                aria-pressed={assignee === s}
                onClick={() => setAssignee(s)}
              >
                <Icon name="user" size={14} /> {s}
              </button>
            ))}
          </div>
        ) : null}
        <input
          id={nameId}
          className="text-input"
          value={assignee}
          maxLength={80}
          autoComplete="off"
          placeholder="مثلاً: برادر مهدی صادقی"
          aria-invalid={nameErr ? true : undefined}
          onChange={(e) => setAssignee(e.target.value)}
        />
        {nameErr ? <p className="rc-field__hint rc-field__hint--warn">{nameErr}</p> : null}
      </div>
      <ChoiceCards
        legend="مدت تخمینی بافر نظافت"
        columns={hk.presets.length >= 4 ? 4 : 2}
        items={hk.presets.map((m) => ({
          value: String(m),
          label: minutesLabel(m),
          hint: MINUTE_HINT[m] ?? "زمان سفارشی",
        }))}
        value={custom ? null : String(minutes)}
        onChange={(v) => setMinutes(Number(v))}
      />
      <div className="rc-inline-field">
        <span id={stepId} className="field-label">
          یا مدت دلخواه {custom ? <span className="rc-chip-mini">انتخاب‌شده</span> : null}
        </span>
        <Stepper
          value={minutes}
          min={hk.min_minutes}
          max={hk.max_minutes}
          onChange={setMinutes}
          format={(v) => minutesLabel(v)}
          labelId={stepId}
          incLabel="۵ دقیقه بیشتر"
          decLabel="۵ دقیقه کمتر"
        />
      </div>
    </>
  );
}

/* ── تخلیه و سپردن به نظافت ──────────────────────────────────────────────── */
export function CheckoutDialog({ row, desk, close }: { row: DeskRow; desk: Desk; close: Close }) {
  const hk = desk.housekeeping;
  const [handoff, setHandoff] = useState(true);
  const [assignee, setAssignee] = useState(hk.suggestions[0] ?? "");
  const [minutes, setMinutes] = useState(hk.default_minutes);
  const [note, setNote] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const ready = !handoff || assignee.trim().length >= 2;

  const go = () =>
    ready &&
    void submit(
      () =>
        transition(row.code, "check-out", {
          ...(note.trim() ? { staff_note: note.trim() } : {}),
          ...(handoff ? { housekeeper: assignee.trim(), cleaning_minutes: minutes } : {}),
        }),
      {
        success: handoff
          ? `خروج ثبت شد؛ ${row.unit_code} به ${assignee.trim()} سپرده شد (${minutesLabel(minutes)}).`
          : `خروج ${row.guest_name || "زائر"} ثبت شد و کلید ${row.unit_code} به قفسه برگشت.`,
      },
    );

  return (
    <FormDialog
      title="ثبت خروج زائر و تحویل واحد به نظافت"
      subtitle="پایان اقامت، بازگشت کلید و آغاز چرخهٔ بافر بهداشتی"
      close={close}
      onSubmit={go}
      tone="amber"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          tone="amber"
          busy={busy}
          disabled={!ready}
          submitIcon={handoff ? "broom" : "door-exit"}
          submitLabel={handoff ? "تأیید خروج و ارسال به نظافت" : "تأیید خروج بدون نوبت نظافت"}
        />
      )}
    >
      <Summary
        tone="amber"
        title={
          <>
            {row.unit_title} <Latin>{row.unit_code}</Latin>
          </>
        }
        aside={<LanePill row={row} />}
      >
        زائر مقیم: {row.guest_name || "زائر"} ({faDigits(row.guests_count)} نفر) · پایان اقامت{" "}
        <bdi>{row.desk.end_label}</bdi>
      </Summary>
      {row.desk.is_overstay ? (
        <Notice tone="danger" icon="clock-alert">
          زمان تخلیهٔ این نوبت گذشته است؛ پس از ثبت خروج، واحد هرچه زودتر برای زائر بعدی آماده شود.
        </Notice>
      ) : null}
      <label className="rc-switch">
        <input type="checkbox" role="switch" checked={handoff} onChange={(e) => setHandoff(e.target.checked)} />
        <span className="rc-switch__track" aria-hidden="true" />
        <span>
          <strong>سپردن هم‌زمان به نظافت</strong>
          <small>کلید با برچسب کهربایی «خدمات» نزد خادم نظافت می‌ماند و پیشرفت روی کارت واحد زنده دیده می‌شود.</small>
        </span>
      </label>
      {handoff ? (
        <HousekeepingFields
          desk={desk}
          assignee={assignee}
          setAssignee={setAssignee}
          minutes={minutes}
          setMinutes={setMinutes}
          error={error}
        />
      ) : null}
      <ReasonField
        label="یادداشت خروج"
        optional
        value={note}
        onChange={setNote}
        placeholder="مثلاً: کلید یدک تحویل شد"
      />
      {error && !fieldError(error, "housekeeper") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── آغاز نظافت برای واحد آماده/خالی ─────────────────────────────────────── */
export function HousekeepingDialog({ unit, desk, close }: { unit: DeskUnit; desk: Desk; close: Close }) {
  const hk = desk.housekeeping;
  const [assignee, setAssignee] = useState(hk.suggestions[0] ?? "");
  const [minutes, setMinutes] = useState(hk.default_minutes);
  const [note, setNote] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const ready = assignee.trim().length >= 2;
  const go = () =>
    ready &&
    void submit(
      () =>
        startHousekeeping(unit.code, {
          assignee: assignee.trim(),
          minutes,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      { success: `نوبت نظافت ${unit.code} به ${assignee.trim()} سپرده شد.`, patchUnit: unitOf, quiet: true },
    );
  return (
    <FormDialog
      title="سپردن واحد به نوبت نظافت"
      subtitle="آماده‌سازی دوباره پیش از ورود زائر بعدی"
      close={close}
      onSubmit={go}
      tone="amber"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          tone="amber"
          busy={busy}
          disabled={!ready}
          submitIcon="broom"
          submitLabel="آغاز نظافت"
        />
      )}
    >
      <Summary
        tone="amber"
        title={
          <>
            {unit.title} — {unit.floor_title}
          </>
        }
        aside={<UnitBadge code={unit.code} />}
      >
        وضعیت جاری: {unit.state_label} · کلید: {unit.key_label}
        {unit.arrival ? (
          <>
            {" "}
            · ورود بعدی <bdi>{unit.arrival.desk.start_label}</bdi>
          </>
        ) : null}
      </Summary>
      <HousekeepingFields
        desk={desk}
        assignee={assignee}
        setAssignee={setAssignee}
        minutes={minutes}
        setMinutes={setMinutes}
        error={error}
      />
      <ReasonField
        label="شرح کار"
        optional
        value={note}
        onChange={setNote}
        placeholder="مثلاً: تعویض پردهٔ اتاق خواب"
      />
      {error && !fieldError(error, "assignee") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── پایان نظافت ─────────────────────────────────────────────────────────── */
export function CompleteDialog({ unit, close }: { unit: DeskUnit; close: Close }) {
  const now = useClock();
  const task = unit.housekeeping;
  const progress = task && now ? liveProgress(task, now) : null;
  const { busy, error, submit } = useSubmit(close);
  const go = () =>
    void submit(() => completeHousekeeping(unit.code), {
      success: `${unit.code} آمادهٔ پذیرش شد و کلید به قفسه برگشت.`,
      patchUnit: unitOf,
      quiet: true,
    });
  return (
    <FormDialog
      title="پایان نظافت و آماده‌باش واحد"
      subtitle="بازبینی نهایی و بازگشت کلید به قفسهٔ پیشخوان"
      close={close}
      onSubmit={go}
      size="sm"
      actions={(f) => (
        <DialogActions form={f} onCancel={close} busy={busy} submitIcon="sparkle" submitLabel="تأیید: واحد آماده است" />
      )}
    >
      <Summary
        title={
          <>
            {unit.title} — {unit.floor_title}
          </>
        }
        aside={<UnitBadge code={unit.code} />}
      >
        {task ? (
          <>
            خادم: {task.assignee} · آغاز <bdi>{task.started_label}</bdi> · موعد <bdi>{task.due_label}</bdi>
          </>
        ) : (
          "نوبت نظافت باز برای این واحد ثبت نشده است."
        )}
      </Summary>
      {progress ? (
        <div className="rc-meter" data-overdue={progress.overdue || undefined}>
          <progress max={100} value={progress.percent} aria-label="پیشرفت زمانی نظافت" />
          <span>
            {progress.overdue
              ? `${minutesLabel(Math.abs(progress.remaining))} از موعد گذشته`
              : `${minutesLabel(progress.remaining)} تا موعد`}
          </span>
        </div>
      ) : null}
      <ul className="rc-ticks" aria-label="بازبینی پیش از آماده‌باش">
        <li>ملافه و روبالشتی تعویض و سرویس بهداشتی ضدعفونی شده است.</li>
        <li>پک بهداشتی زائر (صابون، شامپو، مهر و سجاده) کامل است.</li>
        <li>کلید و کارت تردد به قفسهٔ پیشخوان برگشته است.</li>
      </ul>
      {unit.arrival ? (
        <Notice tone="info" icon="calendar">
          زائر بعدی: {unit.arrival.guest_name || "زائر"} ({faDigits(unit.arrival.guests_count)} نفر) —{" "}
          <bdi>{unit.arrival.desk.start_label}</bdi>
        </Notice>
      ) : null}
      {error ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── مسدودسازی برای تعمیرات ──────────────────────────────────────────────── */
/** نشانه و توضیح کوتاه هر نوع مسدودی (برچسب از سرور می‌آید؛ نوع ناشناخته ⇐ قفل). */
const BLOCK_KIND_LOOK = {
  maintenance: { icon: "wrench", hint: "تأسیسات، برق یا لوله‌کشی" },
  cleaning: { icon: "broom", hint: "شست‌وشو و ضدعفونی کامل" },
  event: { icon: "users", hint: "اسکان هیئت یا مأموریت ویژه" },
  admin: { icon: "shield-check", hint: "به دستور مدیر زائرسرا" },
} as const satisfies Record<string, { icon: IconName; hint: string }>;

function kindLook(value: string): { icon: IconName; hint?: string } {
  return Object.hasOwn(BLOCK_KIND_LOOK, value)
    ? BLOCK_KIND_LOOK[value as keyof typeof BLOCK_KIND_LOOK]
    : { icon: "lock" };
}

export function BlockDialog({ unit, desk, close }: { unit: DeskUnit; desk: Desk; close: Close }) {
  const now = useClock();
  const presets = now ? releasePresets(now) : [];
  const [kind, setKind] = useState(desk.block_kinds[0]?.value ?? "maintenance");
  const [reason, setReason] = useState("");
  const [release, setRelease] = useState<string>("");
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState("08:00");
  const { busy, error, submit } = useSubmit(close);

  const chosen = release || presets[0]?.id || "custom";
  const end =
    chosen === "custom"
      ? day
        ? tehranIso(tehranMoment(day, time))
        : null
      : (presets.find((p) => p.id === chosen)?.end ?? null);
  const endMs = end ? Date.parse(end) : 0;
  const endValid = endMs > now + 15 * 60_000;
  const clash = unit.arrival && endMs > Date.parse(unit.arrival.start) ? unit.arrival : null;
  const ready = reason.trim().length >= REASON_MIN && endValid;

  const go = () =>
    ready &&
    end &&
    void submit(() => createBlock({ unit_code: unit.code, start: tehranIso(now), end, kind, reason: reason.trim() }), {
      success: `${unit.code} از چرخهٔ پذیرش خارج شد.`,
      quiet: true,
    });

  return (
    <FormDialog
      title="مسدودسازی واحد جهت تعمیرات و تأسیسات"
      subtitle="خروج موقت واحد اقامتی از چرخهٔ پذیرش زائران"
      close={close}
      onSubmit={go}
      size="lg"
      tone="danger"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          tone="danger"
          busy={busy}
          disabled={!ready}
          submitIcon="wrench"
          submitLabel="تأیید مسدودسازی واحد"
        />
      )}
    >
      <Summary
        tone="danger"
        title={
          <>
            {unit.title} — {unit.floor_title}
          </>
        }
        aside={<UnitBadge code={unit.code} />}
      >
        وضعیت جاری: {unit.state_label} · با مسدودسازی، این واحد تا پایان کار در تقویم عمومی هم «ناموجود» دیده می‌شود.
      </Summary>
      <ChoiceCards
        legend="نوع مسدودی"
        columns={2}
        items={desk.block_kinds.map((k) => ({
          value: k.value,
          label: k.label,
          ...kindLook(k.value),
        }))}
        value={kind}
        onChange={setKind}
      />
      <ReasonField
        label="علت مسدودسازی و توضیح مسئول فنی"
        value={reason}
        onChange={setReason}
        presets={BLOCK_REASONS}
        placeholder="شرح کار، نام یا شمارهٔ تکنسین اعزامی…"
        error={fieldError(error, "reason")}
      />
      <ChoiceCards
        legend="زمان تخمینی اتمام کار و رفع مسدودی"
        columns={(presets.length + 1) % 3 === 0 ? 3 : 2}
        items={[
          ...presets.map((p) => ({ value: p.id, label: p.label, hint: p.hint, icon: "clock" as const })),
          { value: "custom", label: "زمان دلخواه", hint: "انتخاب روز و ساعت", icon: "calendar" as const },
        ]}
        value={chosen}
        onChange={setRelease}
      />
      {chosen === "custom" ? (
        <div className="rc-row-2">
          <DateField
            anchor="desk-block-date"
            label="روز رفع مسدودی"
            value={day}
            onChange={setDay}
            min={now ? tehranDay(now) : undefined}
            invalid={Boolean(day) && !endValid}
          />
          <TimeField
            anchor="desk-block-time"
            label="ساعت رفع مسدودی"
            value={time}
            onChange={setTime}
            presets={[
              { value: "08:00", label: "آغاز شیفت روز" },
              { value: "20:00", label: "آغاز شیفت شب" },
              { value: "23:00", label: "پیش از خاموشی" },
            ]}
            invalid={Boolean(day) && !endValid}
          />
        </div>
      ) : null}
      {end && endValid ? (
        <p className="rc-preview">
          <Icon name="clock" size={16} /> مسدود از هم‌اکنون تا <strong>{tehranLabel(endMs)}</strong>
        </p>
      ) : chosen === "custom" && day ? (
        <Notice tone="amber" icon="clock">
          زمان رفع مسدودی باید دست‌کم ۱۵ دقیقه پس از اکنون باشد.
        </Notice>
      ) : null}
      {clash ? (
        <Notice tone="amber" icon="calendar-x">
          {clash.guest_name || "زائری"} از <bdi>{clash.desk.start_label}</bdi> در این واحد نوبت دارد؛ اگر کار به آن زمان
          کشید، پیش از تأیید نوبت را از منوی کارت واحد جابه‌جا کنید (سرور هم‌پوشانی را نمی‌پذیرد).
        </Notice>
      ) : null}
      {error && !fieldError(error, "reason") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── رفع مسدودی ──────────────────────────────────────────────────────────── */
export function UnblockDialog({ unit, close }: { unit: DeskUnit; close: Close }) {
  const [reason, setReason] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const block = unit.block;
  const ready = Boolean(block) && reason.trim().length >= REASON_MIN;
  const go = () =>
    ready &&
    block &&
    void submit(() => removeBlock(block.id, reason.trim()), {
      success: `مسدودی ${unit.code} برداشته شد و واحد به چرخهٔ پذیرش برگشت.`,
      quiet: true,
    });
  return (
    <FormDialog
      title="رفع مسدودی و بازگشت واحد به پذیرش"
      subtitle="واحد بلافاصله در تقویم عمومی و صف انتظار آزاد دیده می‌شود"
      close={close}
      onSubmit={go}
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          busy={busy}
          disabled={!ready}
          submitIcon="lock-open"
          submitLabel="تأیید رفع مسدودی"
        />
      )}
    >
      <Summary
        title={
          <>
            {unit.title} — {unit.floor_title}
          </>
        }
        aside={<UnitBadge code={unit.code} />}
      >
        {block ? (
          <>
            {block.kind_label}: {block.reason} · تا <bdi>{block.ends_label}</bdi>
          </>
        ) : (
          "مسدودی فعالی برای این واحد نیست."
        )}
      </Summary>
      <ReasonField
        label="دلیل رفع مسدودی"
        value={reason}
        onChange={setReason}
        presets={UNBLOCK_REASONS}
        error={fieldError(error, "reason")}
      />
      {error && !fieldError(error, "reason") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── عدم‌حضور ────────────────────────────────────────────────────────────── */
export function NoShowDialog({ row, close }: { row: DeskRow; close: Close }) {
  const [reason, setReason] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const ready = reason.trim().length >= REASON_MIN;
  const go = () =>
    ready &&
    void submit(() => transition(row.code, "no-show", { staff_note: reason.trim() }), {
      success: `عدم‌حضور ${row.guest_name || "زائر"} ثبت شد؛ سانس آزادشده به صف انتظار پیشنهاد می‌شود.`,
      quiet: true,
    });
  return (
    <FormDialog
      title="ثبت عدم‌حضور زائر"
      subtitle="پس از پایان مهلت ورود — سانس آزادشده خودکار به نوبت‌انتظار پیشنهاد می‌شود"
      close={close}
      onSubmit={go}
      tone="amber"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          tone="amber"
          busy={busy}
          disabled={!ready}
          submitIcon="user-x"
          submitLabel="ثبت عدم‌حضور"
        />
      )}
    >
      <Summary tone="amber" title={row.guest_name || "زائر"} aside={<UnitBadge code={row.unit_code} />}>
        {row.unit_title} · ورود مقرر <bdi>{row.desk.start_label}</bdi> · {faDigits(row.guests_count)} نفر
      </Summary>
      <Notice tone="info" icon="message">
        پیش از ثبت، یک بار دیگر با زائر تماس بگیرید (پروندهٔ زائر ← نمایش شماره با هدف «تماس با زائر»).
      </Notice>
      <ReasonField
        label="شرح پیگیری و دلیل"
        value={reason}
        onChange={setReason}
        presets={NO_SHOW_REASONS}
        error={fieldError(error, "staff_note")}
      />
      {error && !fieldError(error, "staff_note") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── لغو با دلیل ─────────────────────────────────────────────────────────── */
export function CancelDialog({ row, desk, close }: { row: DeskRow; desk: Desk; close: Close }) {
  const kinds = desk.cancel_reasons.filter((c) => c.value !== "no_show");
  const [kind, setKind] = useState(kinds[0]?.value ?? "guest_request");
  const [reason, setReason] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const ready = reason.trim().length >= REASON_MIN;
  const go = () =>
    ready &&
    void submit(() => cancelReservation(row.code, { reason_kind: kind, reason: reason.trim() }), {
      success: `نوبت ${row.code} لغو شد و سانس آن آزاد گردید.`,
      quiet: true,
    });
  return (
    <FormDialog
      title="لغو نوبت زائر"
      subtitle="سانس آزادشده بی‌درنگ به صف انتظار پیشنهاد می‌شود و پیامک لغو برای زائر می‌رود"
      close={close}
      onSubmit={go}
      tone="danger"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          tone="danger"
          busy={busy}
          disabled={!ready}
          submitIcon="calendar-x"
          submitLabel="تأیید لغو نوبت"
        />
      )}
    >
      <Summary tone="danger" title={row.guest_name || "زائر"} aside={<UnitBadge code={row.unit_code} />}>
        کد رزرو <Latin>{row.code}</Latin> · <bdi>{row.desk.start_label}</bdi> تا <bdi>{row.desk.end_label}</bdi>
      </Summary>
      <ChoiceCards
        legend="دستهٔ دلیل لغو"
        columns={kinds.length > 4 ? 3 : 2}
        items={kinds.map((k) => ({ value: k.value, label: k.label }))}
        value={kind}
        onChange={setKind}
      />
      <ReasonField label="شرح دلیل" value={reason} onChange={setReason} error={fieldError(error, "reason")} />
      {error && !fieldError(error, "reason") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── یادداشت داخلی ───────────────────────────────────────────────────────── */
export function NoteDialog({ row, close }: { row: DeskRow; close: Close }) {
  const [note, setNote] = useState(row.staff_note ?? "");
  const { busy, error, submit } = useSubmit(close);
  const ready = note.trim().length >= 2 && note.trim() !== (row.staff_note ?? "").trim();
  const go = () =>
    ready &&
    void submit(() => transition(row.code, "note", { staff_note: note.trim() }), {
      success: "یادداشت داخلی ذخیره شد.",
      quiet: true,
    });
  return (
    <FormDialog
      title="یادداشت داخلی پرونده"
      subtitle="فقط کارکنان می‌بینند؛ هر ویرایش با نام خادم در تاریخچه ثبت می‌شود"
      close={close}
      onSubmit={go}
      size="sm"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          busy={busy}
          disabled={!ready}
          submitIcon="note"
          submitLabel="ذخیرهٔ یادداشت"
        />
      )}
    >
      <Summary title={row.guest_name || "زائر"} aside={<UnitBadge code={row.unit_code} size="sm" />}>
        کد رزرو <Latin>{row.code}</Latin>
      </Summary>
      <ReasonField
        label="متن یادداشت"
        min={2}
        value={note}
        onChange={setNote}
        placeholder="مثلاً: سالمند همراه دارند؛ واحد طبقهٔ اول ترجیح داده شود"
        error={fieldError(error, "staff_note")}
      />
      {error && !fieldError(error, "staff_note") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── انتخاب بازهٔ نیم‌روزی (جابه‌جایی و ثبت حضوری) ──────────────────────── */
function StayPicker({
  anchor,
  day,
  setDay,
  period,
  setPeriod,
  cells,
  setCells,
  minDay,
  lattice,
}: {
  anchor: "desk-move-date" | "desk-create-date";
  day: string;
  setDay: (v: string) => void;
  period: Period;
  setPeriod: (p: Period) => void;
  cells: number;
  setCells: (n: number) => void;
  minDay: string;
  lattice: ReturnType<typeof readLattice>;
}) {
  const cellsId = useId();
  const periodId = useId();
  const startH = lattice.gridStartHour;
  const nightH = (startH + lattice.cellHours) % 24;
  const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return (
    <div className="rc-stay">
      <div className="rc-stay__day">
        <DateField
          anchor={anchor}
          label="روز ورود"
          value={day}
          min={minDay}
          onChange={(v) => v && setDay(v)}
          quick={[
            { label: "امروز", value: minDay },
            { label: "فردا", value: tehranDay(Date.parse(`${minDay}T12:00:00+03:30`) + 86_400_000) },
          ]}
        />
      </div>
      <div className="rc-field rc-stay__cells">
        <span id={cellsId} className="field-label">
          مدت اقامت
        </span>
        <Stepper
          value={cells}
          min={1}
          max={MAX_CELLS}
          onChange={setCells}
          format={(v) => durationLabel(v)}
          labelId={cellsId}
          className="stepper--wide"
          incLabel="نیم‌روز بیشتر"
          decLabel="نیم‌روز کمتر"
        />
      </div>
      <div className="rc-field rc-stay__period">
        <span id={periodId} className="field-label">
          نیم‌روز ورود
        </span>
        <div className="rc-period" role="group" aria-labelledby={periodId}>
          <button type="button" aria-pressed={period === "day"} onClick={() => setPeriod("day")}>
            <span className="rc-period__icon" aria-hidden="true">
              <Icon name="sun" size={18} />
            </span>
            <span className="rc-period__text">
              <strong>نیم‌روزِ روز</strong>
              <small>
                ورود از ساعت <bdi>{faDigits(pad(startH))}</bdi>
              </small>
            </span>
          </button>
          <button type="button" aria-pressed={period === "night"} onClick={() => setPeriod("night")}>
            <span className="rc-period__icon" aria-hidden="true">
              <Icon name="moon" size={18} />
            </span>
            <span className="rc-period__text">
              <strong>نیم‌روزِ شب</strong>
              <small>
                ورود از ساعت <bdi>{faDigits(pad(nightH))}</bdi>
              </small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RangePreview({ start, end }: { start: string; end: string }) {
  const fmt = (iso: string) => tehranLabel(Date.parse(iso));
  return (
    <p className="rc-preview">
      <Icon name="calendar" size={16} /> از <strong>{fmt(start)}</strong> تا <strong>{fmt(end)}</strong>
    </p>
  );
}

function unitOptions(desk: Desk, guests: number) {
  return desk.units.map((u) => ({
    value: u.code,
    label: u.title,
    code: u.code,
    hint: `${u.floor_title} · ظرفیت ${faDigits(u.capacity_total)} نفر · ${u.state_label}`,
    disabled: u.capacity_total < guests,
  }));
}

/* ── جابه‌جایی نوبت ──────────────────────────────────────────────────────── */
export function MoveDialog({ row, desk, close }: { row: DeskRow; desk: Desk; close: Close }) {
  const config = useQuery(configQuery);
  const lattice = readLattice(config.data?.lattice as Record<string, number> | undefined);
  const initial = selectionOf(row, lattice);
  const [unit, setUnit] = useState(row.unit_code);
  const [day, setDay] = useState(initial.day);
  const [period, setPeriod] = useState<Period>(initial.period);
  const [cells, setCells] = useState(initial.cells);
  const [reason, setReason] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const range = latticeRange({ day, period, cells }, lattice);
  const unchanged =
    unit === row.unit_code &&
    Date.parse(range.start) === Date.parse(row.start) &&
    Date.parse(range.end) === Date.parse(row.end);
  const ready = !unchanged && reason.trim().length >= REASON_MIN;
  const go = () =>
    ready &&
    void submit(
      () =>
        moveReservation(row.code, {
          unit_code: unit,
          start: range.start,
          end: range.end,
          reason: reason.trim(),
          expected_version: row.version ?? null,
        }),
      { success: `نوبت ${row.guest_name || "زائر"} جابه‌جا شد؛ گواهی تازه برای زائر پیامک می‌شود.`, quiet: true },
    );
  return (
    <FormDialog
      title="جابه‌جایی نوبت زائر"
      subtitle="تغییر واحد یا زمان — نوبت پیشین بایگانی و کد تازه صادر می‌شود"
      close={close}
      onSubmit={go}
      size="lg"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          busy={busy}
          disabled={!ready}
          submitIcon="swap"
          submitLabel="تأیید جابه‌جایی"
        />
      )}
    >
      <Summary title={row.guest_name || "زائر"} aside={<UnitBadge code={row.unit_code} />}>
        اکنون: {row.unit_title} · <bdi>{row.desk.start_label}</bdi> تا <bdi>{row.desk.end_label}</bdi> ·{" "}
        {faDigits(row.guests_count)} نفر
      </Summary>
      <SelectMenu
        label="واحد مقصد"
        icon="home"
        options={unitOptions(desk, row.guests_count)}
        value={unit}
        onChange={setUnit}
        sheetTitle="انتخاب واحد مقصد"
      />
      <StayPicker
        anchor="desk-move-date"
        day={day}
        setDay={setDay}
        period={period}
        setPeriod={setPeriod}
        cells={cells}
        setCells={setCells}
        minDay={desk.day}
        lattice={lattice}
      />
      <RangePreview start={range.start} end={range.end} />
      {unchanged ? (
        <Notice tone="info" icon="swap">
          واحد یا زمان را تغییر دهید تا جابه‌جایی ممکن شود.
        </Notice>
      ) : null}
      <ReasonField
        label="دلیل جابه‌جایی"
        value={reason}
        onChange={setReason}
        presets={MOVE_REASONS}
        error={fieldError(error, "reason")}
      />
      {error && !fieldError(error, "reason") ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}

/* ── ثبت نوبت حضوری/تلفنی ────────────────────────────────────────────────── */
const provinceRow = z.object({ value: z.string(), label: z.string() });
const FREQUENT = new Set(["khorasan_razavi", "tehran", "isfahan", "fars", "khorasan_south"]);

export function CreateDialog({ unit: initialUnit, desk, close }: { unit: string | null; desk: Desk; close: Close }) {
  const config = useQuery(configQuery);
  const lattice = readLattice(config.data?.lattice as Record<string, number> | undefined);
  const firstReady = desk.units.find((u) => u.state === "ready")?.code ?? desk.units[0]?.code ?? "";
  const [source, setSource] = useState<"desk" | "phone">("desk");
  const [unit, setUnit] = useState(initialUnit ?? firstReady);
  const [phone, setPhone] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState(2);
  const [day, setDay] = useState(desk.day);
  const [period, setPeriod] = useState<Period>(
    Number(desk.now.slice(11, 13)) >= lattice.gridStartHour + lattice.cellHours - 4 ? "night" : "day",
  );
  const [cells, setCells] = useState(2);
  const [arrival, setArrival] = useState("");
  const [plate, setPlate] = useState<PlateValue>({ text: "", complete: true });
  const [note, setNote] = useState("");
  const { busy, error, submit } = useSubmit(close);
  const ids = { phone: useId(), first: useId(), last: useId(), city: useId(), guests: useId() };

  const provinces = useMemo<ComboOption[]>(
    () =>
      (config.data?.provinces ?? []).flatMap((r) => {
        const p = provinceRow.safeParse(r);
        return p.success ? [{ value: p.data.value, label: p.data.label, priority: FREQUENT.has(p.data.value) }] : [];
      }),
    [config.data],
  );
  const target = desk.units.find((u) => u.code === unit);
  const capacity = target?.capacity_total ?? 8;
  const range = latticeRange({ day, period, cells }, lattice);
  const phoneOk = phoneLooksValid(phone);
  const plateBad = Boolean(plate.text) && !plate.complete;
  const ready = phoneOk && Boolean(unit) && guests <= capacity && !plateBad;
  const phoneErr = fieldError(error, "phone");

  const go = () =>
    ready &&
    void submit(
      () =>
        createStaffReservation({
          source,
          phone: latinDigits(phone).replace(/[\s-]/g, ""),
          unit_code: unit,
          start: range.start,
          end: range.end,
          guests_count: guests,
          ...(first.trim() ? { first_name: first.trim() } : {}),
          ...(last.trim() ? { last_name: last.trim() } : {}),
          ...(province ? { province } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
          ...(arrival ? { expected_arrival: arrival } : {}),
          ...(plate.text ? { vehicle_plate: plate.text } : {}),
          ...(note.trim() ? { staff_note: note.trim() } : {}),
        }),
      { success: `نوبت ${unit} ثبت شد و گواهی برای زائر پیامک می‌شود.`, quiet: true },
    );

  return (
    <FormDialog
      title="ثبت نوبت حضوری یا تلفنی"
      subtitle="برای زائر بی‌نوبتِ حاضر در پیشخوان یا تماس تلفنی — بی‌نیاز از کد ملی در این مسیر"
      close={close}
      onSubmit={go}
      size="lg"
      actions={(f) => (
        <DialogActions
          form={f}
          onCancel={close}
          busy={busy}
          disabled={!ready}
          submitIcon="calendar-plus"
          submitLabel="ثبت نوبت و صدور گواهی"
        />
      )}
    >
      <FormSection step={1} icon="user" title="سرپرست و شمار زائران" hint="فقط شمارهٔ همراه الزامی است">
        <div className="rc-source" role="group" aria-label="منبع نوبت">
          <button type="button" aria-pressed={source === "desk"} onClick={() => setSource("desk")}>
            <Icon name="user" size={16} /> حضوری در پیشخوان
          </button>
          <button type="button" aria-pressed={source === "phone"} onClick={() => setSource("phone")}>
            <Icon name="phone" size={16} /> تماس تلفنی
          </button>
        </div>
        <div className="rc-row-2">
          <div className="rc-field">
            <label className="field-label" htmlFor={ids.phone}>
              شمارهٔ همراه سرپرست
            </label>
            <input
              id={ids.phone}
              name="desk-guest-mobile"
              className="text-input latin"
              dir="ltr"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={phone}
              maxLength={20}
              placeholder="09xx xxx xxxx"
              aria-invalid={(phone && !phoneOk) || phoneErr ? true : undefined}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className={cx("rc-field__hint", ((phone && !phoneOk) || phoneErr) && "rc-field__hint--warn")}>
              {phoneErr ??
                (phone && !phoneOk ? "شمارهٔ همراه معتبر نیست." : "اگر حساب نداشته باشد، همین‌جا ساخته می‌شود.")}
            </p>
          </div>
          <div className="rc-field">
            <span id={ids.guests} className="field-label">
              شمار زائران
            </span>
            <Stepper
              value={guests}
              min={1}
              max={capacity}
              onChange={setGuests}
              format={(v) => `${faDigits(v)} نفر`}
              labelId={ids.guests}
              incLabel="یک نفر بیشتر"
              decLabel="یک نفر کمتر"
            />
            <p className="rc-field__hint">
              ظرفیت {target?.title ?? "واحد"}: {faDigits(capacity)} نفر
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection
        step={2}
        icon="id-card"
        title="مشخصات سرپرست"
        hint="اختیاری · هر چهار مورد ⇐ نمایهٔ زائر هم تکمیل می‌شود"
      >
        <div className="rc-row-2">
          <div className="rc-field">
            <label className="field-label" htmlFor={ids.first}>
              نام
            </label>
            <input
              id={ids.first}
              name="desk-guest-given"
              className="text-input"
              autoComplete="off"
              value={first}
              maxLength={50}
              onChange={(e) => setFirst(e.target.value)}
            />
          </div>
          <div className="rc-field">
            <label className="field-label" htmlFor={ids.last}>
              نام خانوادگی
            </label>
            <input
              id={ids.last}
              name="desk-guest-family"
              className="text-input"
              autoComplete="off"
              value={last}
              maxLength={50}
              onChange={(e) => setLast(e.target.value)}
            />
          </div>
        </div>
        <div className="rc-row-2">
          <Combobox label="استان مبدأ" options={provinces} value={province} onChange={setProvince} quickPicks={3} />
          <div className="rc-field">
            <label className="field-label" htmlFor={ids.city}>
              شهر مبدأ
            </label>
            <input
              id={ids.city}
              name="desk-guest-origin"
              className="text-input"
              autoComplete="off"
              value={city}
              maxLength={60}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection step={3} icon="calendar" title="واحد و زمان اقامت" hint="نیم‌روزهای آزاد همان لحظه بررسی می‌شوند">
        <SelectMenu
          label="واحد اقامتی"
          icon="home"
          options={unitOptions(desk, guests)}
          value={unit}
          onChange={setUnit}
          sheetTitle="انتخاب واحد"
        />
        <StayPicker
          anchor="desk-create-date"
          day={day}
          setDay={setDay}
          period={period}
          setPeriod={setPeriod}
          cells={cells}
          setCells={setCells}
          minDay={desk.day}
          lattice={lattice}
        />
        <RangePreview start={range.start} end={range.end} />
      </FormSection>

      <FormSection step={4} icon="car" title="جزئیات رسیدن" hint="اختیاری">
        <TimeField
          anchor="desk-create-time"
          label="ساعت تقریبی رسیدن"
          value={arrival}
          onChange={setArrival}
          placeholder="نامشخص"
        />
        {/* همان پلاک‌خوان ایرانی/خارجی صفحهٔ رزرو و پرتال ⇒ قالب یکسان پلاک در گواهی و گزارش */}
        <PlateInput onChange={setPlate} invalid={plateBad} />
        <ReasonField label="یادداشت داخلی" optional value={note} onChange={setNote} />
      </FormSection>
      {error && !phoneErr ? (
        <Notice tone="danger" icon="alert">
          {errorText(error)}
        </Notice>
      ) : null}
    </FormDialog>
  );
}
