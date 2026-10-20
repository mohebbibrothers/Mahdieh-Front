"use client";
import { useQuery } from "@tanstack/react-query";
import { cellAt, evaluate, nearestFit, STATUS_ICON, STATUS_LABEL } from "@/entities/slot/timeline";
import { featureIcon, floorLabel, unitPlan } from "@/entities/unit/unit";
import { bookingHref, draftStore } from "@/features/booking-draft/store";
import { useAvailability } from "@/features/booking-draft/use-availability";
import { fetchQuote, meQuery, propertyQuery } from "@/shared/api/queries";
import { loginHref } from "@/shared/config/site";
import { durationLabel, faDigits, formatDayLabel, formatDayMonth, formatMoment, formatWeekday, guestsLabel } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { Stepper } from "@/shared/ui/Stepper";

/**
 * جزئیات یک واحد در بافت جست‌وجوی جاری: وضعیت بازه، انتخاب زمان ۷روزه، امکانات،
 * و — برای کاربر واردشده — حکم شخصیِ سرور (quote: سهمیه، فاصله، محرومیت، جایگزین‌ها).
 */
export function UnitDialog() {
  const { timeline, draft, policies, now } = useAvailability();
  const property = useQuery(propertyQuery);
  const me = useQuery(meQuery);
  const code = draft.openUnit;
  const row = timeline?.units.find((u) => u.code === code);
  const unit = property.data?.flatMap((f) => f.units).find((u) => u.code === code);
  const days = timeline?.days.slice(0, 7) ?? [];

  const q = draft.day ? { day: draft.day, period: draft.period, cells: draft.cells, guests: draft.guests } : null;
  const verdict = row && q ? evaluate(row, q, now, policies.minLeadHours) : null;
  const range = verdict && (verdict.kind === "ok" || verdict.kind === "partial") ? verdict.cells : null;
  const first = range?.[0];
  const last = range?.at(-1);
  const startCell = row && q ? cellAt(row, q.day, q.period) : undefined;
  const nearest = row && startCell && verdict?.kind !== "ok" ? nearestFit(row, startCell.index, draft.cells, draft.guests, now, policies.minLeadHours)?.[0] : undefined;

  const signedIn = Boolean(me.data);
  const quote = useQuery({
    queryKey: ["quote", code, first?.start, last?.end, draft.guests],
    queryFn: () => fetchQuote({ unit_code: code ?? "", start: first?.start ?? "", end: last?.end ?? "", guests_count: draft.guests }),
    enabled: Boolean(signedIn && code && first && last && verdict?.kind === "ok"),
    staleTime: 15_000,
    retry: false,
  });

  const chip =
    verdict?.kind === "ok"
      ? { tone: "ok", icon: "check" as const, text: "آزاد برای تمام بازه" }
      : verdict?.kind === "capacity"
        ? { tone: "warn", icon: "users" as const, text: "ظرفیت کافی نیست" }
        : verdict?.kind === "lead"
          ? { tone: "warn", icon: "clock" as const, text: "مهلت رزرو این زمان گذشته است" }
          : verdict?.kind === "partial"
            ? { tone: "warn", icon: "lock" as const, text: "بخشی از بازه آزاد نیست" }
            : { tone: "warn", icon: "info" as const, text: "بازه بیرون از تقویم این صفحه است" };

  const close = () => draftStore.set({ openUnit: null });
  const serverBlock = quote.data && !quote.data.allowed;
  const canContinue = verdict?.kind === "ok" && !serverBlock;

  return (
    <AppDialog
      isOpen={Boolean(code)}
      onOpenChange={(o) => !o && close()}
      size="lg"
      closeLabel="بستن جزئیات واحد"
      title={unit?.title ?? row?.title ?? "واحد"}
      subtitle={
        row ? (
          <>
            {floorLabel(row.floor)} · {unit?.type_label ?? ""} · تا {faDigits(row.capacity)} نفر · <bdi className="latin">{row.code}</bdi>
          </>
        ) : null
      }
      badge={
        verdict ? (
          <span className="range-chip" data-tone={chip.tone} role="status">
            <Icon name={chip.icon} size={16} /> {chip.text}
          </span>
        ) : null
      }
      actions={
        <>
          {canContinue && code ? (
            <a className="btn btn-primary" href={signedIn ? bookingHref(code, draft) : loginHref(bookingHref(code, draft))}>
              {signedIn ? "انتخاب این واحد و ادامه" : "ورود و ادامهٔ رزرو"} <Icon name="arrow-left" size={18} />
            </a>
          ) : nearest ? (
            <button type="button" className="btn btn-primary" onClick={() => draftStore.set({ day: nearest.start.slice(0, 10), period: nearest.kind })}>
              انتخاب نزدیک‌ترین زمان: {formatMoment(nearest.start)}
            </button>
          ) : null}
          <a
            className="btn btn-secondary"
            href="#quick-search"
            onClick={() => {
              close();
            }}
          >
            تغییر تاریخ یا نفرات
          </a>
        </>
      }
    >
      <div className="unit-detail">
        <div className="unit-detail__visual">
          {unit ? <img src={unitPlan(unit.unit_type)} alt={`طرح مفهومی ${unit.type_label}`} width={400} height={300} /> : <div className="skeleton skeleton--block" />}
        </div>

        <section className="unit-detail__section" aria-labelledby="ud-when">
          <h3 id="ud-when">زمان ورود</h3>
          <div className="mini-picker" role="group" aria-label="انتخاب نیم‌روز آغاز">
            {days.map((d) => (
              <div key={d.day} className="mini-picker__day">
                <span className="mini-picker__label">
                  <small>{formatWeekday(d.day)}</small>
                  {formatDayMonth(d.day)}
                </span>
                {(["day", "night"] as const).map((k) => {
                  const c = row ? cellAt(row, d.day, k) : undefined;
                  if (!c) return <span key={k} className="mini-picker__cell" data-status="past" />;
                  const selected = draft.day === d.day && draft.period === k;
                  const inRange = range?.some((x) => x.index === c.index);
                  return (
                    <button
                      key={k}
                      type="button"
                      className="mini-picker__cell"
                      data-status={c.status}
                      data-range={inRange || undefined}
                      aria-pressed={selected}
                      disabled={c.status === "past"}
                      onClick={() => draftStore.set({ day: d.day, period: k, searched: true })}
                      aria-label={`${formatDayLabel(d.day)}، ${k === "day" ? "روز" : "شب"} — ${STATUS_LABEL[c.status]}`}
                    >
                      <Icon name={k === "day" ? "sun" : "moon"} size={14} />
                      <Icon name={STATUS_ICON[c.status]} size={12} className="mini-picker__status" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="unit-detail__controls">
            <div>
              <span className="field-label" id="ud-guests">
                نفرات
              </span>
              <Stepper value={draft.guests} min={1} max={Math.max(row?.capacity ?? 8, draft.guests)} onChange={(guests) => draftStore.set({ guests })} format={guestsLabel} labelId="ud-guests" incLabel="افزایش نفرات" decLabel="کاهش نفرات" />
            </div>
            <div>
              <span className="field-label" id="ud-cells">
                مدت
              </span>
              <Stepper value={draft.cells} min={policies.minCells} max={policies.maxCells} onChange={(cells) => draftStore.set({ cells })} format={durationLabel} labelId="ud-cells" incLabel="افزایش مدت" decLabel="کاهش مدت" />
            </div>
          </div>
          {first && last ? (
            <dl className="stay-summary">
              <div>
                <dt>
                  <Icon name="calendar-check" size={16} /> ورود
                </dt>
                <dd>{formatMoment(first.start)}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="calendar-x" size={16} /> خروج
                </dt>
                <dd>{formatMoment(last.end)}</dd>
              </div>
            </dl>
          ) : null}
          {verdict?.kind === "partial" ? (
            <p className="inline-note" data-tone="warn">
              <Icon name="lock" size={16} />
              {verdict.blocking
                .slice(0, 3)
                .map((c) => `${formatDayLabel(c.start.slice(0, 10))} ${c.kind === "day" ? "روز" : "شب"} (${STATUS_LABEL[c.status]})`)
                .join("، ")}
              {verdict.blocking.length > 3 ? " و …" : ""} آزاد نیست.
            </p>
          ) : null}
          {verdict?.kind === "capacity" ? (
            <p className="inline-note" data-tone="warn">
              <Icon name="users" size={16} /> این واحد حداکثر {faDigits(verdict.capacity)} نفر را می‌پذیرد؛ برای {guestsLabel(draft.guests)} واحد بزرگ‌تری انتخاب کنید.
            </p>
          ) : null}
        </section>

        {signedIn && verdict?.kind === "ok" ? (
          <section className="unit-detail__section" aria-labelledby="ud-check" aria-busy={quote.isFetching}>
            <h3 id="ud-check">بررسی برای شما</h3>
            {quote.isPending ? <p className="inline-note">در حال بررسی سهمیه و قواعد رزرو شما…</p> : null}
            {quote.data?.allowed ? (
              <p className="inline-note" data-tone="ok">
                <Icon name="shield-check" size={16} /> با قواعد رزرو شما هم‌خوان است.
              </p>
            ) : null}
            {quote.data?.violations.map((v) => (
              <p key={v.code} className="inline-note" data-tone="warn">
                <Icon name="info" size={16} /> {v.message}
              </p>
            ))}
            {quote.data?.notes.map((n) => (
              <p key={n} className="inline-note">
                <Icon name="info" size={16} /> {n}
              </p>
            ))}
            {quote.data?.alternatives.length ? (
              <ul className="alt-list" aria-label="بازه‌های جایگزین">
                {quote.data.alternatives.slice(0, 4).map((a) => (
                  <li key={`${a.unit_code}${a.start}`}>
                    <button type="button" onClick={() => draftStore.set({ day: a.start.slice(0, 10), period: a.start.slice(11, 13) === "20" ? "night" : "day", openUnit: a.unit_code })}>
                      <strong>{a.unit_title}</strong>
                      <small>{formatMoment(a.start)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {quote.isError ? <p className="inline-note">بررسی شخصی ممکن نشد؛ در مرحلهٔ ثبت دوباره سنجیده می‌شود.</p> : null}
          </section>
        ) : null}

        {unit?.features.length ? (
          <section className="unit-detail__section" aria-labelledby="ud-features">
            <h3 id="ud-features">امکانات</h3>
            <ul className="feature-grid">
              {unit.features.map((f) => (
                <li key={f.code} data-highlight={f.is_highlight || undefined}>
                  <Icon name={featureIcon(f.code)} size={18} /> {f.title}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppDialog>
  );
}
