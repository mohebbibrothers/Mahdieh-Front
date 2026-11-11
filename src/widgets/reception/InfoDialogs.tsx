"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import {
  downloadReport,
  guestDetailQuery,
  regenerateRecoveryCodes,
  reservationEventsQuery,
  revealPhone,
  staffWaitlistQuery,
  type Desk,
  type DeskRow,
  type StaffOffer,
} from "@/shared/api/desk";
import { helpQuery } from "@/shared/api/queries";
import { copyText } from "@/shared/lib/clipboard";
import { cx } from "@/shared/lib/cx";
import { faDigits, formatFullDate, formatMoment } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { ChoiceCards, DateField, Summary } from "./form";
import { PURPOSES, exportRange, minutesLabel, phoneWorthy, type ExportRange, type PurposeId } from "./model";
import { Info, LanePill, Latin, Notice, UnitBadge } from "./parts";
import { errorText, useDeskRuntime } from "./runtime";
import type { OpenDialog } from "./types";

type Close = () => void;
const REVEAL_SECONDS = 90;

/* ── نمایش شمارهٔ کامل (تأیید تازه + هدف ثبت‌شده) ─────────────────────────── */
/**
 * شمارهٔ کامل فقط با «هدف» مشخص و تأیید تازهٔ عامل دوم نمایان می‌شود؛ هر نمایش در حسابرسی ثبت
 * می‌شود و پس از ۹۰ ثانیه خودبه‌خود دوباره پوشیده می‌گردد (حریم زائر روی صفحهٔ باز پیشخوان).
 */
export function PhoneReveal({ guestId, masked, worthy = true }: { guestId: string; masked: string; worthy?: boolean }) {
  const { run } = useDeskRuntime();
  const now = useClock();
  const noteId = useId();
  const [purpose, setPurpose] = useState<PurposeId>("call_guest");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<{ phone: string; until: number } | null>(null);
  const left = shown && now ? Math.max(0, Math.ceil((shown.until - now) / 1000)) : REVEAL_SECONDS;
  const visible = shown !== null && left > 0;
  const needsNote = purpose === "other";
  const ready = !needsNote || note.trim().length >= 5;

  const reveal = async () => {
    if (!ready || busy) return;
    setBusy(true);
    const out = await run(() => revealPhone(guestId, purpose, note.trim()), { quiet: true });
    setBusy(false);
    if (out.ok) setShown({ phone: out.value.phone, until: Date.now() + REVEAL_SECONDS * 1000 });
    else toast(errorText(out.error), "warn");
  };

  if (visible) {
    return (
      <div className="rc-reveal rc-reveal--open" role="status">
        <a className="rc-reveal__phone" href={`tel:${shown.phone}`} dir="ltr">
          <Icon name="phone" size={18} />
          <bdi className="latin">{shown.phone}</bdi>
        </a>
        <button
          type="button"
          className="icon-button"
          aria-label="رونوشت شماره"
          onClick={() => void copyText(shown.phone).then((ok) => ok && toast("شماره رونوشت شد.", "success"))}
        >
          <Icon name="copy" size={16} />
        </button>
        <span className="rc-reveal__timer" aria-label={`${faDigits(left)} ثانیه تا پوشش دوباره`}>
          <Icon name="hourglass" size={14} /> {faDigits(left)}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(null)}>
          <Icon name="lock" size={14} /> پوشاندن
        </button>
      </div>
    );
  }

  return (
    <div className="rc-reveal">
      <p className="rc-reveal__masked">
        <Icon name="lock" size={16} /> <Latin>{masked}</Latin>
      </p>
      {!worthy ? (
        <p className="rc-field__hint">این نوبت بسته شده است؛ نمایش شماره فقط در صورت ضرورت و با هدف روشن.</p>
      ) : null}
      <ChoiceCards
        legend="هدف نمایش شمارهٔ کامل (در حسابرسی ثبت می‌شود)"
        columns={2}
        items={PURPOSES.map((p) => ({ value: p.id, label: p.label, hint: p.hint }))}
        value={purpose}
        onChange={setPurpose}
      />
      {needsNote ? (
        <div className="rc-field">
          <label className="field-label" htmlFor={noteId}>
            توضیح هدف
          </label>
          <input
            id={noteId}
            className="text-input"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="دست‌کم ۵ نویسه"
          />
        </div>
      ) : null}
      <button type="button" className="btn btn-secondary" disabled={!ready || busy} onClick={() => void reveal()}>
        {busy ? <span className="rc-spinner" aria-hidden="true" /> : <Icon name="shield-check" size={18} />}
        <span>نمایش شمارهٔ کامل (تأیید امنیتی)</span>
      </button>
    </div>
  );
}

/* ── پروندهٔ پذیرش و اقامت زائر ──────────────────────────────────────────── */
export function DossierDialog({
  row,
  open,
  onCheckIn,
  close,
}: {
  row: DeskRow;
  open: OpenDialog;
  onCheckIn: (row: DeskRow) => void;
  close: Close;
}) {
  const guest = useQuery(guestDetailQuery(row.guest_id));
  const events = useQuery(reservationEventsQuery(row.code));
  const f = row.desk;
  const g = guest.data;
  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && close()}
      title="پروندهٔ پذیرش و اقامت زائر"
      subtitle="اطلاعات هویتی، سابقهٔ اقامت و تاریخچهٔ این نوبت"
      size="lg"
      className="rc-dialog rc-dossier-dialog"
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>
            بازگشت به پیشخوان
          </button>
          {f.can_check_in ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                close();
                onCheckIn(row);
              }}
            >
              <Icon name="key" size={18} /> پذیرش و تحویل کلید
            </button>
          ) : f.can_check_out ? (
            <button
              type="button"
              className="btn btn-primary rc-btn-amber"
              onClick={() => open({ kind: "checkout", row, unit: null })}
            >
              <Icon name="door-exit" size={18} /> ثبت خروج
            </button>
          ) : null}
        </>
      }
    >
      <Summary title={row.guest_name || "زائر"} aside={<LanePill row={row} />}>
        <UnitBadge code={row.unit_code} size="sm" /> {row.unit_title} · <bdi>{f.start_label}</bdi> تا{" "}
        <bdi>{f.end_label}</bdi> · {row.duration_label}
      </Summary>

      <dl className="rc-dossier__grid rc-dossier__grid--3">
        <Info label="شهر مبدأ">{f.guest_city || g?.guest.city || "—"}</Info>
        <Info label="تعداد زائران">{faDigits(row.guests_count)} نفر</Info>
        <Info label={f.guest_document || "کد ملی"}>
          <Latin>{f.guest_national_id_masked || g?.national_id_masked || "—"}</Latin>
        </Info>
        <Info label="کد رزرو">
          <Latin>{row.code}</Latin>
        </Info>
        <Info label="کد کوتاه آفلاین">
          <Latin>
            <strong className="rc-brand-ink">{f.short_code}</strong>
          </Latin>
        </Info>
        <Info label="منبع ثبت">{row.source_label}</Info>
        {row.expected_arrival ? <Info label="رسیدن اعلامی">{faDigits(row.expected_arrival.slice(0, 5))}</Info> : null}
        {row.vehicle_plate ? <Info label="پلاک خودرو">{row.vehicle_plate}</Info> : null}
        {row.guest_nationality && row.guest_nationality !== "IR" ? (
          <Info label="ملیت">{g?.guest.nationality_title || row.guest_nationality}</Info>
        ) : null}
      </dl>

      <section className="rc-block" aria-labelledby="rc-dossier-phone">
        <h3 id="rc-dossier-phone">
          <Icon name="phone" size={16} /> تلفن تماس سرپرست
        </h3>
        <PhoneReveal guestId={row.guest_id} masked={row.guest_phone_masked} worthy={phoneWorthy(row)} />
      </section>

      {g ? (
        <section className="rc-block" aria-labelledby="rc-dossier-history">
          <h3 id="rc-dossier-history">
            <Icon name="history" size={16} /> سابقهٔ زائر
          </h3>
          <div className="rc-stats">
            <span>
              <strong>{faDigits(g.guest.reservations_count)}</strong> نوبت
            </span>
            <span data-tone={g.guest.no_show_count ? "amber" : undefined}>
              <strong>{faDigits(g.guest.no_show_count)}</strong> عدم‌حضور
            </span>
            <span>
              عضویت از <strong>{formatFullDate(g.guest.date_joined.slice(0, 10))}</strong>
            </span>
            {g.standing.suspended_until ? (
              <span data-tone="danger">تعلیق تا {formatMoment(g.standing.suspended_until)}</span>
            ) : null}
          </div>
        </section>
      ) : guest.isPending ? (
        <p className="rc-skeleton" aria-busy="true">
          در حال خواندن سابقهٔ زائر…
        </p>
      ) : null}

      {row.guest_note || row.staff_note ? (
        <section className="rc-block" aria-labelledby="rc-dossier-notes">
          <h3 id="rc-dossier-notes">
            <Icon name="note" size={16} /> یادداشت‌های پرونده
          </h3>
          {row.guest_note ? <p className="rc-note">زائر: {row.guest_note}</p> : null}
          {row.staff_note ? <p className="rc-note rc-note--staff">داخلی: {row.staff_note}</p> : null}
        </section>
      ) : null}

      <section className="rc-block" aria-labelledby="rc-dossier-events">
        <h3 id="rc-dossier-events">
          <Icon name="calendar" size={16} /> تاریخچهٔ نوبت
        </h3>
        {events.data?.results.length ? (
          <ol className="rc-timeline">
            {events.data.results.map((e) => (
              <li key={e.id}>
                <strong>{e.kind_label}</strong>
                <span>
                  {formatMoment(e.at)}
                  {e.actor_label ? ` · ${e.actor_label}` : ""}
                </span>
                {e.reason ? <p>{e.reason}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="rc-muted">{events.isPending ? "در حال خواندن…" : "رویدادی ثبت نشده است."}</p>
        )}
      </section>

      <div className="rc-quick-actions" role="group" aria-label="کنش‌های پرونده">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: "note", row })}>
          <Icon name="note" size={16} /> یادداشت داخلی
        </button>
        {f.can_move ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: "move", row })}>
            <Icon name="swap" size={16} /> جابه‌جایی
          </button>
        ) : null}
        {f.can_no_show ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: "noshow", row })}>
            <Icon name="user-x" size={16} /> عدم‌حضور
          </button>
        ) : null}
        {f.can_cancel ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm rc-text-danger"
            onClick={() => open({ kind: "cancel", row })}
          >
            <Icon name="calendar-x" size={16} /> لغو نوبت
          </button>
        ) : null}
      </div>
    </AppDialog>
  );
}

/* ── صف انتظار ───────────────────────────────────────────────────────────── */
function OfferClock({ offer, now }: { offer: Pick<StaffOffer, "expires_at">; now: number }) {
  const left = now ? Math.max(0, Math.floor((Date.parse(offer.expires_at) - now) / 1000)) : 0;
  const mm = Math.floor(left / 60);
  const ss = left % 60;
  return (
    <span className="rc-offer-clock" data-urgent={left < 600 || undefined}>
      <Icon name="hourglass" size={14} />
      <bdi className="latin">{faDigits(`${mm}:${String(ss).padStart(2, "0")}`)}</bdi>
    </span>
  );
}

export function WaitlistDialog({ close }: { close: Close }) {
  const q = useQuery({ ...staffWaitlistQuery, refetchInterval: 20_000 });
  const now = useClock();
  const [callee, setCallee] = useState<string | null>(null);
  const d = q.data;
  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && close()}
      title="صف انتظار و پیشنهادهای باز"
      subtitle="سانس آزادشده (لغو، عدم‌حضور، رفع مسدودی) خودکار و به ترتیب صف به زائران پیشنهاد می‌شود"
      size="lg"
      className="rc-dialog"
      actions={
        <button type="button" className="btn btn-secondary btn-block" onClick={close}>
          بستن پنجره
        </button>
      }
    >
      {q.isError ? (
        <Notice tone="danger" icon="alert">
          {errorText(q.error)}
        </Notice>
      ) : !d ? (
        <p className="rc-skeleton" aria-busy="true">
          در حال خواندن صف…
        </p>
      ) : (
        <>
          <div className="rc-wl-stats">
            <Info label="در انتظار">{faDigits(d.stats.waiting)}</Info>
            <Info label="پیشنهاد باز">{faDigits(d.stats.open_offers)}</Info>
            <Info label="رو به انقضا">{faDigits(d.stats.expiring_soon)}</Info>
            <Info label="نرخ پذیرش">{faDigits(Math.round(d.stats.acceptance_rate * 100))}٪</Info>
            <Info label="تبدیل به رزرو (کل)">{faDigits(d.overview.converted)}</Info>
          </div>

          <section className="rc-block" aria-labelledby="rc-wl-offers">
            <h3 id="rc-wl-offers">
              <Icon name="clock-alert" size={16} /> پیشنهادهای در انتظار پاسخ زائر
            </h3>
            {d.open_offers.length === 0 ? (
              <p className="rc-muted">پیشنهاد بازی نیست.</p>
            ) : (
              <ul className="rc-wl-list">
                {d.open_offers.map((o) => (
                  <li key={o.id} className="rc-wl-item" data-tone="gold">
                    <UnitBadge code={o.unit_code} size="sm" />
                    <div>
                      <strong>{o.guest_name || "زائر"}</strong>
                      <span>
                        {formatMoment(o.starts_at)} تا {formatMoment(o.ends_at)}
                      </span>
                    </div>
                    <OfferClock offer={o} now={now} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rc-block" aria-labelledby="rc-wl-queue">
            <h3 id="rc-wl-queue">
              <Icon name="users" size={16} /> صف به ترتیب نوبت
            </h3>
            {d.queue.length === 0 ? (
              <p className="rc-muted">صف انتظار خالی است.</p>
            ) : (
              <ol className="rc-wl-list">
                {d.queue.map((e) => (
                  <li key={e.id} className="rc-wl-item" data-open={callee === e.id || undefined}>
                    <span className="rc-wl-pos">{faDigits(e.position)}</span>
                    <div>
                      <strong>
                        {e.guest_name || "زائر"} · {faDigits(e.guests_count)} نفر
                      </strong>
                      <span>
                        {e.unit_title ?? "هر واحد آزاد"} · {formatMoment(e.starts_at)} · {e.status_label}
                        {e.offers_sent ? ` · ${faDigits(e.offers_sent)} پیشنهاد` : ""}
                      </span>
                    </div>
                    {e.open_offer ? <OfferClock offer={e.open_offer} now={now} /> : null}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-expanded={callee === e.id}
                      onClick={() => setCallee(callee === e.id ? null : e.id)}
                    >
                      <Icon name="phone" size={14} /> تماس
                    </button>
                    {callee === e.id ? (
                      <div className="rc-wl-call">
                        <PhoneReveal guestId={e.guest_id} masked={e.guest_phone_masked} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </AppDialog>
  );
}

/* ── خروجی اکسل ──────────────────────────────────────────────────────────── */
export function ExportDialog({ desk, close }: { desk: Desk; close: Close }) {
  const { run } = useDeskRuntime();
  const [kind, setKind] = useState<ExportRange>("shift");
  const [from, setFrom] = useState<string | null>(desk.day);
  const [to, setTo] = useState<string | null>(desk.day);
  const [phones, setPhones] = useState<"masked" | "full">("masked");
  const [busy, setBusy] = useState(false);
  const range = exportRange(kind, desk, { from: from ?? desk.day, to: to ?? desk.day });
  const valid = range.from <= range.to;
  const manager = desk.officer.is_manager;

  const go = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const out = await run(() => downloadReport(range.from, range.to, phones === "full"), { quiet: true });
    setBusy(false);
    if (!out.ok) {
      toast(errorText(out.error), "warn");
      return;
    }
    const url = URL.createObjectURL(out.value.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = out.value.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
    toast("کارپوشهٔ اکسل آماده و دریافت شد.", "success");
    close();
  };

  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && close()}
      title="خروجی اکسل دفتر شیفت"
      subtitle="کارپوشهٔ هفت‌برگی: نوبت‌ها، ورود و خروج، عدم‌حضور، لغو، اشغال واحدها و خلاصهٔ مدیریتی"
      size="md"
      className="rc-dialog"
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>
            انصراف
          </button>
          <button type="button" className="btn btn-primary" disabled={!valid || busy} onClick={() => void go()}>
            {busy ? <span className="rc-spinner" aria-hidden="true" /> : <Icon name="download" size={18} />}
            <span>دریافت فایل اکسل</span>
          </button>
        </>
      }
    >
      <ChoiceCards
        legend="بازهٔ گزارش"
        columns={2}
        items={[
          {
            value: "shift",
            label: `شیفت جاری (${desk.shift.label})`,
            hint: desk.shift.hours_label,
            icon: "clock",
          },
          { value: "today", label: "امروز", hint: desk.day_label, icon: "sun" },
          { value: "week", label: "هفت روز گذشته", hint: "تا امروز", icon: "history" },
          { value: "custom", label: "بازهٔ دلخواه", hint: "انتخاب از تقویم", icon: "calendar" },
        ]}
        value={kind}
        onChange={(v) => setKind(v as ExportRange)}
      />
      {kind === "custom" ? (
        <div className="rc-row-2">
          <DateField anchor="desk-export-from" label="از روز" value={from} onChange={setFrom} max={desk.day} />
          <DateField
            anchor="desk-export-to"
            label="تا روز"
            value={to}
            onChange={setTo}
            rangeFrom={from}
            invalid={!valid}
          />
        </div>
      ) : null}
      <p className="rc-preview">
        <Icon name="sheet" size={16} /> از <strong>{formatFullDate(range.from)}</strong> تا{" "}
        <strong>{formatFullDate(range.to)}</strong>
      </p>
      <ChoiceCards
        legend="شمارهٔ تلفن زائران در فایل"
        columns={2}
        items={[
          { value: "masked", label: "پوشیده", hint: "پیش‌فرض امن برای همهٔ خادمان", icon: "lock" },
          {
            value: "full",
            label: "کامل",
            hint: manager ? "فقط مدیر · تأیید امنیتی تازه" : "فقط مدیر شیفت",
            icon: "shield-check",
            disabled: !manager,
          },
        ]}
        value={phones}
        onChange={(v) => setPhones(v as "masked" | "full")}
      />
      {phones === "full" ? (
        <Notice tone="amber" icon="shield-check">
          فایل با شمارهٔ کامل، داده‌ای حساس است: نام شما و زمان دریافت در حسابرسی ثبت می‌شود و فایل را فقط در سامانهٔ
          امن نگه دارید.
        </Notice>
      ) : null}
    </AppDialog>
  );
}

/* ── شیوه‌نامهٔ کشیک (کشوی کناری) ────────────────────────────────────────── */
type SopTab = "id" | "privacy" | "cleaning" | "waitlist" | "routine";
/** پیمایش صفحه‌کلیدی زبانه‌ها (عمودی در دسکتاپ، افقی راست‌به‌چپ در گوشی). */
const SOP_KEYS: Partial<Record<string, 1 | -1>> = { ArrowDown: 1, ArrowLeft: 1, ArrowUp: -1, ArrowRight: -1 };

export function SopDrawer({ desk, close }: { desk: Desk; close: Close }) {
  const help = useQuery(helpQuery);
  const [tab, setTab] = useState<SopTab>("id");
  const r = desk.rules;
  const hk = desk.housekeeping;
  const phone = help.data?.contact.phone_display || "";
  const tabs: Array<{ id: SopTab; label: string; short: string; icon: IconName }> = [
    { id: "id", label: "تطبیق هویت", short: "هویت", icon: "id-card" },
    { id: "privacy", label: "حریم خصوصی", short: "حریم", icon: "lock" },
    { id: "cleaning", label: "بافر نظافت", short: "نظافت", icon: "broom" },
    { id: "waitlist", label: "صف و اضطرار", short: "اضطرار", icon: "alert" },
    { id: "routine", label: "روال روزانه", short: "روال", icon: "list" },
  ];
  const move = (step: number) => {
    const i = tabs.findIndex((t) => t.id === tab);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    if (!next) return;
    setTab(next.id);
    document.getElementById(`rc-sop-${next.id}`)?.focus();
  };
  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && close()}
      title="شیوه‌نامه و مقررات کشیک خادمان"
      subtitle="دستورالعمل اجرایی پیشخوان پذیرش زائرسرای مهدیه — با قواعد زندهٔ سامانه"
      size="lg"
      className="rc-dialog rc-sop"
      actions={
        <button type="button" className="btn btn-secondary btn-block" onClick={close}>
          متوجه شدم و بستن شیوه‌نامه
        </button>
      }
    >
      <div className="rc-sop__layout">
        <div className="rc-sop__nav" role="tablist" aria-label="بخش‌های شیوه‌نامه" aria-orientation="vertical">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`rc-sop-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="rc-sop-panel"
              tabIndex={tab === t.id ? 0 : -1}
              className="rc-sop__tab"
              aria-label={`بخش ${faDigits(i + 1)}: ${t.label}`}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => {
                const step = SOP_KEYS[e.key];
                if (!step) return;
                e.preventDefault();
                move(step);
              }}
            >
              <span className="rc-sop__tab-icon" aria-hidden="true">
                <Icon name={t.icon} size={18} />
              </span>
              <span className="rc-sop__tab-text">
                <span className="rc-sop__tab-step" aria-hidden="true">
                  بخش {faDigits(i + 1)}
                </span>
                <span className="rc-sop__tab-long">{t.label}</span>
                <span className="rc-sop__tab-short" aria-hidden="true">
                  {t.short}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div
          id="rc-sop-panel"
          key={tab}
          role="tabpanel"
          aria-labelledby={`rc-sop-${tab}`}
          className="rc-sop__panel"
          tabIndex={0}
        >
          {tab === "id" ? (
            <>
              <h3>بررسی اصل مدارک هویتی</h3>
              <p>
                پذیرش سرپرست منوط به ارائهٔ <strong>اصل کارت ملی هوشمند</strong> یا <strong>گذرنامه</strong> (زائران
                غیرایرانی) است؛ تصویر یا کپی مدرک پذیرفته نیست.
              </p>
              <ul className="rc-ticks">
                <li>تطبیق چهره و نام سرپرست با پروندهٔ نوبت و گواهی امضاشدهٔ سرور.</li>
                <li>شمار همراهان از ظرفیت مجاز واحد بیشتر نباشد.</li>
                <li>
                  پنجرهٔ پذیرش از <strong>{faDigits(r.checkin_early_hours)} ساعت</strong> پیش از آغاز اقامت باز می‌شود؛
                  ورود زودتر را سامانه نمی‌پذیرد.
                </li>
                <li>گواهی نامعتبر یا ناهمخوان (هشدار قرمز اسکن) ⇒ پذیرش متوقف و مسئول شیفت آگاه شود.</li>
              </ul>
            </>
          ) : tab === "privacy" ? (
            <>
              <h3>حریم خصوصی زائران</h3>
              <ul className="rc-ticks">
                <li>
                  شماره‌ها همه‌جا پوشیده‌اند؛ نمایش کامل فقط با هدف مشخص و تأیید امنیتی تازه، و هر بار حسابرسی می‌شود.
                </li>
                <li>شمارهٔ نمایان‌شده پس از ۹۰ ثانیه خودبه‌خود پوشیده می‌شود.</li>
                <li>خروجی اکسل با شمارهٔ کامل فقط برای مدیر و با تأیید تازه ممکن است.</li>
                <li>هنگام ترک پیشخوان، از منوی نام خود «خروج امن» را بزنید تا نشست بسته شود.</li>
              </ul>
            </>
          ) : tab === "cleaning" ? (
            <>
              <h3>چرخهٔ بهداشتی و آماده‌سازی واحد</h3>
              <p>
                پس از خروج زائر، واحد به «بافر نظافت» می‌رود. زمان پیش‌فرض{" "}
                <strong>{minutesLabel(hk.default_minutes)}</strong> و بازهٔ مجاز {minutesLabel(hk.min_minutes)} تا{" "}
                {minutesLabel(hk.max_minutes)} است.
              </p>
              <ul className="rc-ticks">
                <li>تعویض ملافه و روبالشتی؛ ضدعفونی سرویس بهداشتی، حمام و شیرآلات.</li>
                <li>نظافت سالن و آشپزخانه و تکمیل پک بهداشتی زائر.</li>
                <li>کلید در این مدت با برچسب کهربایی «خدمات» نزد خادم نظافت می‌ماند.</li>
                <li>پایان کار را از کارت واحد ثبت کنید تا واحد «آمادهٔ پذیرش» شود.</li>
              </ul>
            </>
          ) : tab === "waitlist" ? (
            <>
              <h3>تأخیر، عدم‌حضور و صف انتظار</h3>
              <ul className="rc-ticks">
                <li>
                  {faDigits(r.late_minutes)} دقیقه پس از ساعت ورود، نوبت در دفتر «تأخیر» نشان داده می‌شود؛ با زائر تماس
                  بگیرید.
                </li>
                <li>
                  ثبت عدم‌حضور پس از <strong>{faDigits(r.no_show_grace_hours)} ساعت</strong> مهلت ممکن است و دلیل آن
                  الزامی است.
                </li>
                <li>سانس آزادشده خودکار و به ترتیب صف به زائران منتظر پیشنهاد و پیامک می‌شود.</li>
              </ul>
              <h3>شماره‌های اضطراری</h3>
              <div className="rc-emergency">
                <Info label="اورژانس">
                  <Latin>115</Latin>
                </Info>
                <Info label="پلیس">
                  <Latin>110</Latin>
                </Info>
                <Info label="آتش‌نشانی">
                  <Latin>125</Latin>
                </Info>
                <Info label="پشتیبانی مهدیه">{phone ? <Latin>{phone}</Latin> : "در تنظیمات ثبت نشده"}</Info>
              </div>
            </>
          ) : (
            <>
              <h3>روال روزانهٔ خادم پیشخوان</h3>
              {help.data ? (
                <ol className="rc-routine">
                  {help.data.staff_checklist.map((s) => (
                    <li key={s.title}>
                      <strong>{s.title}</strong>
                      <p>{s.text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rc-skeleton" aria-busy="true">
                  در حال خواندن…
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </AppDialog>
  );
}

/* ── کدهای بازیابی تازه ──────────────────────────────────────────────────── */
export function RecoveryDialog({ remaining, close }: { remaining: number; close: Close }) {
  const { run } = useDeskRuntime();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => () => setCodes(null), []);

  const generate = async () => {
    setBusy(true);
    const out = await run(() => regenerateRecoveryCodes(), { quiet: true });
    setBusy(false);
    if (out.ok) setCodes(out.value.recovery_codes);
    else toast(errorText(out.error), "warn");
  };
  const text = codes?.join("\n") ?? "";
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`کدهای بازیابی مهدیه\n\n${text}\n`], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mahdieh-recovery-codes.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4_000);
  };

  return (
    <AppDialog
      isOpen
      onOpenChange={(o) => !o && (codes === null || saved) && close()}
      title="کدهای بازیابی ورود"
      subtitle="اگر گوشی در دسترس نبود، هر کد یک بار به‌جای رمز ۶ رقمی کار می‌کند"
      size="sm"
      className="rc-dialog"
      actions={
        codes ? (
          <button type="button" className="btn btn-primary btn-block" disabled={!saved} onClick={close}>
            <Icon name="check" size={18} /> کدها را جای امن نگه داشتم
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={close}>
              انصراف
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void generate()}>
              {busy ? <span className="rc-spinner" aria-hidden="true" /> : <Icon name="refresh" size={18} />}
              <span>ساخت ۱۰ کد تازه</span>
            </button>
          </>
        )
      }
    >
      {codes ? (
        <>
          <Notice tone="amber" icon="alert">
            کدهای پیشین از همین لحظه باطل شدند. این کدها فقط همین یک بار نمایش داده می‌شوند.
          </Notice>
          <ol className="rc-codes" dir="ltr">
            {codes.map((c) => (
              <li key={c}>
                <bdi className="latin">{c}</bdi>
              </li>
            ))}
          </ol>
          <div className="rc-row-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void copyText(text).then((ok) => ok && toast("کدها رونوشت شدند.", "success"))}
            >
              <Icon name="copy" size={16} /> رونوشت همه
            </button>
            <button type="button" className="btn btn-secondary" onClick={download}>
              <Icon name="download" size={16} /> دریافت فایل متنی
            </button>
          </div>
          <label className="rc-check">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <span>کدها را چاپ یا در جای امنی ذخیره کردم.</span>
          </label>
        </>
      ) : (
        <>
          <Summary
            tone={remaining <= 3 ? "amber" : "neutral"}
            title={`${faDigits(remaining)} کد استفاده‌نشده باقی است`}
          >
            ساخت کدهای تازه، همهٔ کدهای پیشین را باطل می‌کند و به تأیید امنیتی تازه نیاز دارد.
          </Summary>
          <p className={cx("rc-muted")}>کدها را چاپ کنید و دور از گوشی نگه دارید؛ هر کد فقط یک بار پذیرفته می‌شود.</p>
        </>
      )}
    </AppDialog>
  );
}
