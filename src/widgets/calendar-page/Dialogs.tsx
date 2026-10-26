"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useId, useState } from "react";
import type { UnitTimeline } from "@/entities/slot/timeline";
import { floorLabel } from "@/entities/unit/unit";
import { rangeLabel } from "@/widgets/booking/parts";
import { ApiError } from "@/shared/api/client";
import type { Policies } from "@/shared/api/policies";
import { pk } from "@/shared/api/portal";
import { joinWaitlist, problemExtras } from "@/shared/api/reservations";
import type { Occasion, WaitlistEntry } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { durationLabel, faDigits, formatFullDate, guestsLabel } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { SelectMenu } from "@/shared/ui/SelectMenu";
import { Stepper } from "@/shared/ui/Stepper";
import { LEGEND_ITEMS, Swatch, periodHours } from "./Matrix";

const ANY = "*";

/* ── صف انتظار ───────────────────────────────────────────────────────────── */

export type WaitlistTarget = { unit: string; start: string; end: string; cells: number };

/**
 * ثبت در صف انتظار (طراح P-04 + رسید) — شمارهٔ پیامک همان شمارهٔ تأییدشدهٔ حساب است (بی ورود دستی و
 * بی امکان ثبت برای شمارهٔ دیگران). خطاهای قاعده‌ای سرور (سهمیهٔ صف، بازهٔ آزادشده…) با متن فارسی خود
 * سرور نمایش داده می‌شوند.
 */
export function WaitlistDialog({
  target,
  onClose,
  units,
  guests,
  phone,
  policies,
  onSlotFree,
}: {
  target: WaitlistTarget | null;
  onClose: () => void;
  units: UnitTimeline[];
  guests: number;
  phone: string;
  policies: Policies;
  onSlotFree: () => void;
}) {
  const id = useId();
  const qc = useQueryClient();
  const [unit, setUnit] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const chosenUnit = unit ?? target?.unit ?? ANY;
  const people = count ?? guests;
  const capacityOf = (code: string) => units.find((u) => u.code === code)?.capacity ?? 0;
  const maxPeople = chosenUnit === ANY ? Math.max(1, ...units.map((u) => u.capacity)) : capacityOf(chosenUnit) || 1;

  const join = useMutation({
    mutationFn: () =>
      joinWaitlist({
        ...(chosenUnit === ANY ? {} : { unit_code: chosenUnit }),
        start: target?.start ?? "",
        end: target?.end ?? "",
        guests_count: Math.min(people, maxPeople),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: pk.waitlist }),
  });

  const close = () => {
    onClose();
    // پس از بسته شدن، فرم برای درخواست بعدی تازه شود
    setTimeout(() => {
      setUnit(null);
      setCount(null);
      setNote("");
      join.reset();
    }, 250);
  };

  const done = join.data;
  const err = join.error;
  const slotFree = err instanceof ApiError && err.code === "slot_already_free";
  const violations = problemExtras(err).violations;

  if (done) return <WaitlistReceipt entry={done} phone={phone} policies={policies} onClose={close} />;

  return (
    <AppDialog
      isOpen={Boolean(target)}
      onOpenChange={(o) => !o && close()}
      title="ثبت درخواست در صف انتظار"
      subtitle="با آزاد شدن این بازه، به ترتیب نوبت پیامک و پیشنهاد در پرتال دریافت می‌کنید"
      actions={
        <>
          <button type="button" className="btn btn-outline" onClick={close}>
            انصراف
          </button>
          <button
            type="submit"
            form={`${id}-f`}
            className="btn btn-primary"
            disabled={join.isPending || !target}
            data-loading={join.isPending || undefined}
          >
            {join.isPending ? "در حال ثبت…" : "ثبت در صف انتظار"}
          </button>
        </>
      }
    >
      <form
        id={`${id}-f`}
        className="cp-wait"
        onSubmit={(e) => {
          e.preventDefault();
          if (!join.isPending) join.mutate();
        }}
      >
        {target ? (
          <p className="cp-wait__range">
            <Icon name="calendar" size={18} />
            <span>
              <strong>{rangeLabel(target.start, target.end)}</strong>
              <small>{durationLabel(target.cells)}</small>
            </span>
          </p>
        ) : null}
        <SelectMenu
          label="واحد درخواستی"
          icon="building"
          value={chosenUnit}
          onChange={setUnit}
          options={[
            {
              value: ANY,
              label: "هر واحدی که زودتر آزاد شود",
              icon: "sparkle",
              hint: "بیشترین شانس پیشنهاد",
              groupEnd: true,
            },
            ...units.map((u) => ({
              value: u.code,
              code: u.code,
              label: u.title,
              hint: `${floorLabel(u.floor)} · ظرفیت ${faDigits(u.capacity)} نفر`,
            })),
          ]}
        />
        <div className="cp-field">
          <span className="field-label" id={`${id}-g`}>
            تعداد همسفران
          </span>
          <Stepper
            value={Math.min(people, maxPeople)}
            min={1}
            max={maxPeople}
            onChange={setCount}
            format={guestsLabel}
            labelId={`${id}-g`}
            incLabel="افزودن یک همسفر"
            decLabel="کاستن یک همسفر"
          />
        </div>
        <label className="cp-field">
          <span className="field-label">یادداشت برای پذیرش (اختیاری)</span>
          <textarea
            className="text-input cp-wait__note"
            maxLength={200}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: همراه سالمند داریم؛ طبقهٔ اول ترجیح داده می‌شود"
          />
        </label>
        <p className="cp-wait__phone">
          <Icon name="smartphone" size={18} />
          <span>
            پیامک پیشنهاد به <bdi dir="ltr">{faDigits(phone)}</bdi> فرستاده می‌شود؛ در ساعات سکوت شبانه (<bdi>۲۳</bdi>{" "}
            تا <bdi>۷</bdi>) پیامک ارسال نمی‌شود. مهلت پاسخ به هر پیشنهاد {faDigits(policies.waitlistOfferMinutes)}{" "}
            دقیقه است.
          </span>
        </p>
        {err ? (
          <div className="cp-wait__error" role="alert">
            <Icon name="alert" size={18} />
            <div>
              <p>{err.message}</p>
              {violations.length ? (
                <ul>
                  {violations.map((x) => (
                    <li key={x.code}>{x.message}</li>
                  ))}
                </ul>
              ) : null}
              {slotFree ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    close();
                    onSlotFree();
                  }}
                >
                  همین حالا رزرو کنید <Icon name="arrow-left" size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </AppDialog>
  );
}

function WaitlistReceipt({
  entry,
  phone,
  policies,
  onClose,
}: {
  entry: WaitlistEntry;
  phone: string;
  policies: Policies;
  onClose: () => void;
}) {
  const portal = destHref("portal");
  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && onClose()}
      title="درخواست شما در صف انتظار ثبت شد"
      subtitle="با آزاد شدن بازه، سامانه خودکار به ترتیب نوبت پیشنهاد می‌فرستد"
      actions={
        <>
          {portal ? (
            <Link className="btn btn-outline" href={`${portal}#waitlist` as Route} onClick={onClose}>
              پیگیری در پرتال زائر
            </Link>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            متوجه شدم و بازگشت به تقویم
          </button>
        </>
      }
    >
      <div className="cp-receipt" role="group" aria-label="رسید ثبت در صف انتظار">
        <div className="cp-receipt__head">
          <span className="cp-receipt__seal" aria-hidden="true">
            <Icon name="bell" size={22} />
          </span>
          <div>
            <small>نوبت شما در صف این بازه</small>
            <strong className="cp-receipt__pos">{faDigits(entry.position)}</strong>
          </div>
          <span className="cp-receipt__status">{entry.status_label}</span>
        </div>
        <span className="cp-receipt__perf" aria-hidden="true" />
        <dl className="cp-receipt__grid">
          <div>
            <dt>واحد درخواستی</dt>
            <dd>
              {entry.unit_title} <bdi className="latin">({entry.unit_code})</bdi>
            </dd>
          </div>
          <div>
            <dt>همسفران</dt>
            <dd>{guestsLabel(entry.guests_count)}</dd>
          </div>
          <div className="cp-receipt__wide">
            <dt>بازهٔ اقامت</dt>
            <dd>
              {rangeLabel(entry.starts_at, entry.ends_at)} ({durationLabel(entry.cells_count)})
            </dd>
          </div>
          <div>
            <dt>شمارهٔ پیامک</dt>
            <dd>
              <bdi dir="ltr">{faDigits(phone)}</bdi>
            </dd>
          </div>
          <div>
            <dt>مهلت پاسخ به پیشنهاد</dt>
            <dd>{faDigits(policies.waitlistOfferMinutes)} دقیقه پس از پیامک</dd>
          </div>
        </dl>
        <ul className="cp-receipt__notes">
          <li>
            <Icon name="heart-hand" size={16} /> همهٔ خدمات مهدیه رایگان است؛ هیچ مبلغی در هیچ مرحله دریافت نمی‌شود.
          </li>
          <li>
            <Icon name="moon" size={16} /> در ساعات سکوت شبانه (<bdi>۲۳</bdi> تا <bdi>۷</bdi>) پیامک به صبح موکول
            می‌شود.
          </li>
        </ul>
      </div>
    </AppDialog>
  );
}

/* ── مناسبت ─────────────────────────────────────────────────────────────── */

const KIND_LABEL: Record<Occasion["kind"], string> = {
  religious: "مناسبت مذهبی",
  holiday: "تعطیل رسمی",
  seasonal: "فصل زیارتی",
  custom: "رویداد ویژه",
};
const DEMAND_LABEL = { normal: "تقاضای عادی", high: "تقاضای بالا", peak: "اوج تقاضا" } as const;

export function OccasionDialog({
  occasion,
  policies,
  onClose,
  onShow,
}: {
  occasion: Occasion | null;
  policies: Policies;
  onClose: () => void;
  onShow: (day: string) => void;
}) {
  const level = occasion?.demand_level ?? (occasion?.is_peak ? "peak" : "normal");
  return (
    <AppDialog
      isOpen={Boolean(occasion)}
      onOpenChange={(o) => !o && onClose()}
      title={occasion?.title ?? ""}
      subtitle={
        occasion
          ? [
              occasion.is_holiday && occasion.kind !== "holiday" ? "تعطیل رسمی" : KIND_LABEL[occasion.kind],
              formatFullDate(occasion.date_gregorian),
              occasion.hijri_date,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined
      }
      actions={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            بستن
          </button>
          {occasion ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onShow(occasion.date_gregorian);
                onClose();
              }}
            >
              نمایش این روز در تقویم <Icon name="arrow-left" size={18} />
            </button>
          ) : null}
        </>
      }
    >
      {occasion ? (
        <div className="cp-occ">
          <p className="cp-occ__level" data-level={level}>
            <Icon name={level === "normal" ? "calendar" : "users"} size={16} /> {DEMAND_LABEL[level]}
          </p>
          {occasion.description ? <p className="cp-occ__desc">{occasion.description}</p> : null}
          {occasion.is_provisional ? (
            <p className="cp-occ__note" role="note">
              <Icon name="info" size={16} />
              <span>
                تاریخ تقریبی است: ماه قمری آن هنوز در تقویم رسمی کشور اعلام نشده و با رؤیت هلال ممکن است یک روز جابه‌جا
                شود. پس از اعلام رسمی، تقویم خودکار به‌روز می‌شود.
              </span>
            </p>
          ) : occasion.source === "official" ? (
            <p className="cp-occ__src">
              <Icon name="check" size={14} /> برگرفته از تقویم رسمی کشور
            </p>
          ) : null}
          <div className="cp-occ__policy">
            <strong>میزبانی عادلانه در ایام پرتقاضا</strong>
            <p>
              برای آنکه زائران بیشتری بهره‌مند شوند، هر زائر هم‌زمان {faDigits(policies.maxActive)} رزرو فعال دارد و سقف
              اقامت او {faDigits(policies.cellsPerWindow)} نیم‌روز در هر {faDigits(policies.windowDays)} روز و{" "}
              {faDigits(policies.cellsPerYear)} نیم‌روز در سال است. اگر بازهٔ دلخواه پر بود، در صف انتظار بمانید؛ با هر
              لغو، به ترتیب نوبت پیشنهاد می‌شود. همهٔ خدمات رایگان است.
            </p>
          </div>
        </div>
      ) : null}
    </AppDialog>
  );
}

/* ── راهنمای شبکه ───────────────────────────────────────────────────────── */

export function GuideDialog({
  open,
  onClose,
  policies,
  startHour,
  cellHours,
}: {
  open: boolean;
  onClose: () => void;
  policies: Policies;
  startHour: number;
  cellHours: number;
}) {
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={(o) => !o && onClose()}
      title="راهنمای زمان‌های تحویل و شبکهٔ نیم‌روز"
      subtitle="همهٔ اعداد از سیاست‌های زندهٔ سامانه خوانده می‌شوند"
      size="lg"
      actions={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          متوجه شدم
        </button>
      }
    >
      <ol className="explain-list">
        <li>
          <span className="explain-list__icon" aria-hidden="true">
            <Icon name="sun" size={18} />
          </span>
          <div>
            <h3>شبکهٔ {faDigits(cellHours)} ساعته: هر شبانه‌روز دو سانس</h3>
            <p>
              <strong>سانس روزانه</strong> ({periodHours("day", startHour, cellHours)}): ورود در آغاز و تخلیه تا پایان
              سانس. <strong>سانس شبانه</strong> ({periodHours("night", startHour, cellHours)} صبح بعد). هر خانهٔ جدول یک
              نیم‌روز است.
            </p>
          </div>
        </li>
        <li>
          <span className="explain-list__icon" aria-hidden="true">
            <Icon name="mouse-pointer" size={18} />
          </span>
          <div>
            <h3>انتخاب بازه با دو کلیک</h3>
            <p>
              کلیک نخست آغاز اقامت است (با مدت پیش‌فرض)، کلیک روی نیم‌روزی جلوتر پایان آن، و کلیک روی نیم‌روزی عقب‌تر
              آغاز را جابه‌جا می‌کند. کلیک دوباره روی آغاز، انتخاب را لغو می‌کند. اقامت از{" "}
              {durationLabel(policies.minCells)} تا {durationLabel(policies.maxCells)} و باید پیوسته آزاد باشد.
            </p>
          </div>
        </li>
        <li>
          <span className="explain-list__icon" aria-hidden="true">
            <Icon name="clock" size={18} />
          </span>
          <div>
            <h3>بازهٔ رزرو آنلاین</h3>
            <p>
              رزرو تا {faDigits(policies.horizonDays)} روز آینده باز است و دست‌کم {faDigits(policies.minLeadHours)} ساعت
              پیش از آغاز سانس بسته می‌شود («رزرو بسته»). لغو تا {faDigits(policies.cancelFreeHours)} ساعت پیش از ورود
              آزاد است
              {policies.bufferMinutes
                ? `؛ میان دو اقامت ${faDigits(policies.bufferMinutes)} دقیقه نظافت انجام می‌شود`
                : ""}
              .
            </p>
          </div>
        </li>
        <li>
          <span className="explain-list__icon" aria-hidden="true">
            <Icon name="bell" size={18} />
          </span>
          <div>
            <h3>بازهٔ پر؟ صف انتظار</h3>
            <p>
              روی نیم‌روز رزروشده هم می‌توان بازه گرفت و در صف ماند. با هر لغو، به ترتیب نوبت پیامک می‌رسد و{" "}
              {faDigits(policies.waitlistOfferMinutes)} دقیقه برای پذیرش فرصت دارید.
            </p>
          </div>
        </li>
        <li>
          <span className="explain-list__icon" aria-hidden="true">
            <Icon name="accessibility" size={18} />
          </span>
          <div>
            <h3>بی‌تکیه بر رنگ</h3>
            <p>هر وضعیت نماد و بافت خودش را دارد؛ بی دیدن رنگ هم خوانده می‌شود.</p>
            <ul className="cp-keys">
              {LEGEND_ITEMS.map((it) => (
                <li key={it.state}>
                  <Swatch item={it} size={18} />
                  <span>
                    <strong>{it.label}</strong>
                    <small>{it.symbol}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      </ol>
    </AppDialog>
  );
}
