"use client";
import { useId, useState } from "react";
import type { Desk, DeskEvent, DeskRow } from "@/shared/api/desk";
import { cx } from "@/shared/lib/cx";
import { faDigits } from "@/shared/lib/fa";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { LEDGER_TABS, agoLabel, inTab, searchRows, sortLedger, tabCounts, type LedgerTab } from "./model";
import { LanePill, Latin, SectionHead, UnitBadge } from "./parts";
import type { OpenDialog } from "./types";

type Props = { desk: Desk; open: OpenDialog; onCheckIn: (row: DeskRow) => void };

/**
 * دفتر حضور و غیاب امروز: زبانه‌ها با شمارنده، جست‌وجوی فوری (نام، واحد، کد رزرو/کوتاه، ارقام پیدای
 * کد ملی و تلفن، شهر)، جدول در دسکتاپ و کارت در گوشی (نه جدول با پیمایش افقی). تلفن همیشه ماسک است
 * و «کپسول قفل» پروندهٔ زائر را برای نمایش با تأیید تازه باز می‌کند.
 */
export function Ledger({ desk, open, onCheckIn }: Props) {
  const [tab, setTab] = useState<LedgerTab>("all");
  const [q, setQ] = useState("");
  const tabsId = useId();
  const counts = tabCounts(desk.ledger);
  const rows = sortLedger(searchRows(desk.ledger, q).filter((r) => inTab(r, tab)));

  return (
    <section className="rc-section rc-ledger" aria-labelledby="rc-ledger-title">
      <div className="rc-ledger__bar">
        <SectionHead eyebrow="دفتر حضور و غیاب" id="rc-ledger-title" title="نوبت‌های ورودی و خروجی امروز" />
        <div className="rc-tabs" role="tablist" aria-label="صافی دفتر">
          {LEDGER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${tabsId}-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${tabsId}-panel`}
              tabIndex={tab === t.id ? 0 : -1}
              className="rc-tab"
              data-alert={t.id === "alerts" && counts.alerts > 0 ? true : undefined}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => {
                const i = LEDGER_TABS.findIndex((x) => x.id === tab);
                const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
                if (!step) return;
                e.preventDefault();
                const next = LEDGER_TABS[(i + step + LEDGER_TABS.length) % LEDGER_TABS.length];
                if (next) {
                  setTab(next.id);
                  document.getElementById(`${tabsId}-${next.id}`)?.focus();
                }
              }}
            >
              <span className="rc-tab__long">{t.label}</span>
              <span className="rc-tab__short">{t.short}</span>
              <span className="rc-tab__count">{faDigits(counts[t.id])}</span>
            </button>
          ))}
        </div>
        <label className="rc-ledger__search">
          <Icon name="search" size={16} />
          <span className="sr-only">جست‌وجو در دفتر</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام زائر، واحد، کد رزرو یا کد ملی…"
          />
        </label>
      </div>

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-${tab}`}
        className="rc-ledger__panel"
        tabIndex={0}
      >
        {rows.length === 0 ? (
          <p className="rc-empty">
            <Icon name={q ? "search" : "calendar"} size={18} />
            {q ? `برای «${q}» ردیفی در این زبانه نیست.` : "در این زبانه نوبتی برای امروز ثبت نشده است."}
          </p>
        ) : (
          <>
            <table className="rc-table">
              <caption className="sr-only">دفتر نوبت‌های امروز — {faDigits(rows.length)} ردیف</caption>
              <thead>
                <tr>
                  <th scope="col">واحد</th>
                  <th scope="col">مشخصات زائر</th>
                  <th scope="col">کد ملی</th>
                  <th scope="col">تلفن تماس</th>
                  <th scope="col">ورود / تخلیه</th>
                  <th scope="col">وضعیت پذیرش</th>
                  <th scope="col">اقدامات خادم</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} data-lane={r.desk.lane}>
                    <td>
                      <UnitBadge code={r.unit_code} />
                    </td>
                    <td>
                      <strong className="rc-table__name">{r.guest_name || "زائر"}</strong>
                      <span className="rc-table__sub">
                        {r.desk.guest_city || "—"} · {faDigits(r.guests_count)} نفر
                      </span>
                    </td>
                    <td>
                      <Latin>{r.desk.guest_national_id_masked || "—"}</Latin>
                    </td>
                    <td>
                      <PhoneLock row={r} open={open} />
                    </td>
                    <td>
                      <span className="rc-table__time">
                        <bdi>{r.desk.start_label}</bdi>
                      </span>
                      <span className="rc-table__sub">
                        تا <bdi>{r.desk.end_label}</bdi>
                      </span>
                    </td>
                    <td>
                      <LanePill row={r} />
                    </td>
                    <td>
                      <RowActions row={r} open={open} onCheckIn={onCheckIn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="rc-cards" aria-label={`دفتر نوبت‌های امروز — ${faDigits(rows.length)} ردیف`}>
              {rows.map((r) => (
                <li key={r.id} className="rc-card" data-lane={r.desk.lane}>
                  <div className="rc-card__head">
                    <UnitBadge code={r.unit_code} />
                    <div>
                      <strong>{r.guest_name || "زائر"}</strong>
                      <span>
                        {r.desk.guest_city || "—"} · {faDigits(r.guests_count)} نفر
                      </span>
                    </div>
                    <LanePill row={r} />
                  </div>
                  <dl className="rc-card__facts">
                    <div>
                      <dt>ورود</dt>
                      <dd>
                        <bdi>{r.desk.start_label}</bdi>
                      </dd>
                    </div>
                    <div>
                      <dt>کد ملی</dt>
                      <dd>
                        <Latin>{r.desk.guest_national_id_masked || "—"}</Latin>
                      </dd>
                    </div>
                    <div>
                      <dt>تلفن</dt>
                      <dd>
                        <PhoneLock row={r} open={open} />
                      </dd>
                    </div>
                  </dl>
                  <RowActions row={r} open={open} onCheckIn={onCheckIn} block />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function PhoneLock({ row, open }: { row: DeskRow; open: OpenDialog }) {
  return (
    <button type="button" className="rc-lock" onClick={() => open({ kind: "dossier", row })}>
      {/* نام دسترس‌پذیر = متن دیدنی + توضیح پنهان (نه aria-label جدا ⇒ قاعدهٔ label-content-name-mismatch) */}
      <span className="sr-only">شمارهٔ {row.guest_name || "زائر"}: </span>
      <Icon name="lock" size={14} />
      <Latin>{row.guest_phone_masked}</Latin>
      <span className="sr-only"> — نمایش کامل با تأیید تازه</span>
    </button>
  );
}

function RowActions({ row, open, onCheckIn, block }: Omit<Props, "desk"> & { row: DeskRow; block?: boolean }) {
  const f = row.desk;
  return (
    <div className={cx("rc-row-actions", block && "rc-row-actions--block")}>
      {f.can_check_in ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onCheckIn(row)}>
          <Icon name="key" size={16} /> پذیرش و کلید
        </button>
      ) : f.can_check_out ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => open({ kind: "checkout", row, unit: null })}
        >
          <Icon name="door-exit" size={16} /> ثبت خروج
        </button>
      ) : f.can_no_show ? (
        <button
          type="button"
          className="btn btn-secondary btn-sm rc-btn-warn"
          onClick={() => open({ kind: "noshow", row })}
        >
          <Icon name="user-x" size={16} /> عدم‌حضور
        </button>
      ) : (
        <span className="rc-row-actions__state">
          {f.lane === "checked_out"
            ? "تخلیه و تحویل کلید"
            : f.lane === "checked_in"
              ? "کلید تحویل شد ✓"
              : row.status_label}
        </span>
      )}
      <button
        type="button"
        className="icon-button rc-row-actions__open"
        onClick={() => open({ kind: "dossier", row })}
        aria-label={`پروندهٔ ${row.guest_name || "زائر"} — ${row.unit_code}`}
      >
        <Icon name="arrow-up-left" size={16} />
      </button>
    </div>
  );
}

const EVENT_ICON: Record<string, IconName> = {
  "reservation.created": "calendar-plus",
  "reservation.checked_in": "key",
  "reservation.checked_out": "door-exit",
  "reservation.no_show": "user-x",
  "reservation.cancelled": "calendar-x",
  "reservation.moved": "swap",
  "reservation.note": "note",
  "reservation.details": "car",
  "housekeeping.started": "broom",
  "housekeeping.completed": "sparkle",
  "block.created": "wrench",
};

/** ثبت وقایع زندهٔ شیفت (Audit Trail) — از دفتر رویدادهای سرور، تازه‌ترین بالا. */
export function AuditTrail({ events, onUnit }: { events: DeskEvent[]; onUnit: (code: string) => void }) {
  const now = useHydratedNow(30_000);
  return (
    <section className="rc-section rc-audit" aria-labelledby="rc-audit-title">
      <SectionHead eyebrow="شفافیت و پاسخ‌گویی" id="rc-audit-title" title="ثبت وقایع زندهٔ شیفت جاری" />
      {events.length === 0 ? (
        <p className="rc-empty">
          <Icon name="history" size={18} /> هنوز رویدادی در این شیفت ثبت نشده است.
        </p>
      ) : (
        <ol className="rc-events">
          {events.map((e) => (
            <li key={`${e.at}-${e.kind}-${e.reservation_code}-${e.unit_code}`} className="rc-event" data-tone={e.tone}>
              <span className="rc-event__icon" aria-hidden="true">
                <Icon name={EVENT_ICON[e.kind] ?? "history"} size={16} />
              </span>
              <time className="rc-event__clock" dateTime={e.at}>
                {e.clock}
              </time>
              <p className="rc-event__text">
                {e.text}
                {e.actor ? <span className="rc-event__actor"> — {e.actor}</span> : null}
              </p>
              <span className="rc-event__meta">
                {e.unit_code ? (
                  <button type="button" className="rc-event__unit" onClick={() => onUnit(e.unit_code)}>
                    <Latin>{e.unit_code}</Latin>
                  </button>
                ) : null}
                {now ? <span>{agoLabel(e.at, now)}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
