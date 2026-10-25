"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useNow } from "@/features/booking-draft/use-availability";
import { pastStaysQuery } from "@/shared/api/portal";
import { feedbackToken } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import {
  durationLabel,
  faDigits,
  formatClock,
  formatDayLabel,
  formatDayMonth,
  formatYear,
  tehranToday,
} from "@/shared/lib/fa";
import { Icon } from "@/shared/ui/Icon";
import { FeedbackDialog } from "@/widgets/booking/FeedbackDialog";
import { type FeedbackCell, feedbackCell } from "./model";
import { SectionHead, StatusPill } from "./parts";

const day = (iso: string) => tehranToday(new Date(iso));
/** «۱۳ الی ۱۶ تیر ۱۴۰۵» (طراح) — ماه/سال تکراری حذف می‌شود. */
function pastRange(start: string, end: string): string {
  const a = day(start);
  const b = day(end);
  const [am, bm] = [formatDayMonth(a), formatDayMonth(b)];
  const sameYear = formatYear(a) === formatYear(b);
  const sameMonth = sameYear && am.split(" ").slice(1).join(" ") === bm.split(" ").slice(1).join(" ");
  if (a === b) return `${am} ${formatYear(a)}`;
  if (sameMonth) return `${am.split(" ")[0]} الی ${bm} ${formatYear(b)}`;
  if (sameYear) return `${am} الی ${bm} ${formatYear(b)}`;
  return `${am} ${formatYear(a)} الی ${bm} ${formatYear(b)}`;
}

const DAY_MS = 86_400_000;
/** شمار روزهای تقویمی تهران تا روز ورود (۰ = امروز). */
function daysUntil(startIso: string, now: number): number {
  const a = tehranToday(new Date(now));
  const b = day(startIso);
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/**
 * سابقهٔ اقامت‌های پیشین (طراح: جدول وسط‌چین؛ موبایل: کارت به‌جای اسکرول افقی).
 * حالت خالی سه‌گانه: سفر پیش‌رو دارد ⇒ «دفتر دل‌نوشته» با شمارش معکوس و مسیر تا ثبت دل‌نوشته؛
 * سفری ندارد و مجاز است ⇒ دعوت به برنامه‌ریزی؛ مسدود است ⇒ فقط راهنما (دکمهٔ رزروِ بی‌ثمر نمی‌دهیم).
 */
export function PastStays({
  onOpen,
  upcoming = null,
  canBook,
}: {
  onOpen: (code: string) => void;
  /** نزدیک‌ترین سفر فعال پیش‌رو (برای حالت خالی) */
  upcoming?: Reservation | null;
  /** ‎standing.can_book‎؛ ‎undefined‎ = هنوز نامعلوم ⇒ همان دعوت عادی */
  canBook?: boolean | undefined;
}) {
  const past = useInfiniteQuery(pastStaysQuery);
  const rows = past.data?.pages.flatMap((p) => p.results) ?? [];
  const total = past.data?.pages[0]?.meta.total ?? rows.length;
  const [feedbackFor, setFeedbackFor] = useState<{ token: string; code: string } | null>(null);

  return (
    <section className="pt-section" aria-labelledby="pt-past-title" id="history">
      <SectionHead
        id="pt-past-title"
        title="سابقهٔ اقامت‌های پیشین و دل‌نوشته‌های رضوی"
        aside={
          total ? (
            <>
              <b>{faDigits(total)}</b> سفر ثبت‌شده · ثبت نظر و ارزیابی خادمان مهدیه
            </>
          ) : (
            "ثبت نظر و ارزیابی خادمان مهدیه"
          )
        }
      />
      {past.isPending ? (
        <div className="pt-table-wrap" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton pt-past-skel" aria-hidden="true" />
          ))}
        </div>
      ) : past.error && !rows.length ? (
        <div className="verdict verdict--warn" role="alert">
          <Icon name="wifi-off" size={18} />
          <div className="verdict__body">
            <strong>سابقهٔ سفرها بارگذاری نشد.</strong>
            <button type="button" className="text-link" onClick={() => void past.refetch()}>
              تلاش دوباره
            </button>
          </div>
        </div>
      ) : !rows.length && upcoming ? (
        <JournalTeaser r={upcoming} onOpen={onOpen} />
      ) : !rows.length && canBook === false ? (
        <div className="pt-empty">
          <Icon name="feather" size={28} />
          <p>
            <strong>هنوز سفری به پایان نرسانده‌اید</strong>
            <span>پس از هر اقامت، سابقهٔ آن و امکان ثبت دل‌نوشته برای خادمان همین‌جا می‌آید.</span>
          </p>
          <Link className="btn btn-secondary" href={destHref("guide")}>
            <Icon name="compass" size={18} /> راهنمای زائر و قواعد نوبت‌دهی
          </Link>
        </div>
      ) : !rows.length ? (
        <div className="pt-empty">
          <Icon name="history" size={28} />
          <p>
            <strong>هنوز سفری به پایان نرسانده‌اید</strong>
            <span>پس از هر اقامت، سابقهٔ آن و امکان ثبت دل‌نوشته برای خادمان همین‌جا می‌آید.</span>
          </p>
          <Link className="btn btn-secondary" href={destHref("calendar")}>
            <Icon name="calendar" size={18} /> نخستین سفر را برنامه‌ریزی کنید
          </Link>
        </div>
      ) : (
        <div className="pt-table-wrap">
          <table className="pt-table">
            <caption className="sr-only">سابقهٔ اقامت‌های پیشین شما، تازه‌ترین نخست</caption>
            <thead>
              <tr>
                <th scope="col">کد پیگیری</th>
                <th scope="col">واحد اقامتی</th>
                <th scope="col">بازهٔ اقامت</th>
                <th scope="col">تعداد مهمانان</th>
                <th scope="col">وضعیت اقامت</th>
                <th scope="col">ارزیابی و دل‌نوشته</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <PastRow
                  key={r.code}
                  r={r}
                  onOpen={onOpen}
                  onFeedback={(token) => setFeedbackFor({ token, code: r.code })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {past.hasNextPage ? (
        <div className="pt-more">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={past.isFetchingNextPage}
            aria-busy={past.isFetchingNextPage}
            onClick={() => void past.fetchNextPage()}
          >
            {past.isFetchingNextPage ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="chevron-down" size={18} />
            )}
            نمایش سفرهای قدیمی‌تر
            {total > rows.length ? <small>({faDigits(total - rows.length)} سفر دیگر)</small> : null}
          </button>
        </div>
      ) : null}
      {feedbackFor ? (
        <FeedbackDialog
          token={feedbackFor.token}
          code={feedbackFor.code}
          isOpen
          onOpenChange={(o) => {
            if (!o) setFeedbackFor(null);
          }}
        />
      ) : null}
    </section>
  );
}

function PastRow({
  r,
  onOpen,
  onFeedback,
}: {
  r: Reservation;
  onOpen: (code: string) => void;
  onFeedback: (token: string) => void;
}) {
  const cell = feedbackCell(r);
  return (
    <tr>
      <td data-label="کد پیگیری">
        <button
          type="button"
          className="pt-past-code"
          onClick={() => onOpen(r.code)}
          aria-label={`جزئیات رزرو ${r.code}`}
        >
          <bdi className="latin" dir="ltr">
            {r.code}
          </bdi>
        </button>
      </td>
      <td data-label="واحد اقامتی">
        <span className="pt-cell2">
          <strong>
            {r.unit_title} (<bdi className="latin">{r.unit_code}</bdi>)
          </strong>
          <small>طبقهٔ {faDigits(r.floor_number)}</small>
        </span>
      </td>
      <td data-label="بازهٔ اقامت">
        <span className="pt-cell2">
          <strong>{pastRange(r.start, r.end)}</strong>
          <small>{durationLabel(r.cells_count)} اقامت صلواتی</small>
        </span>
      </td>
      <td data-label="تعداد مهمانان">{faDigits(r.guests_count)} نفر</td>
      <td data-label="وضعیت اقامت">
        <StatusPill status={r.status} label={r.status_label} />
      </td>
      <td data-label="ارزیابی و دل‌نوشته">
        <FeedbackView cell={cell} onFeedback={onFeedback} />
      </td>
    </tr>
  );
}

function FeedbackView({ cell, onFeedback }: { cell: FeedbackCell; onFeedback: (token: string) => void }) {
  switch (cell.kind) {
    case "rated":
      return (
        <span className="pt-rating" role="img" aria-label={`${faDigits(cell.rating)} ستاره، ثبت شد`}>
          <span className="pt-rating__stars" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Icon key={i} name={i < cell.rating ? "star-fill" : "star"} size={14} />
            ))}
          </span>
          <span aria-hidden="true">{faDigits(cell.rating)} ستاره (ثبت شد)</span>
        </span>
      );
    case "open": {
      const token = feedbackToken(cell.url);
      return token ? (
        <button type="button" className="btn btn-secondary btn-sm pt-fb-btn" onClick={() => onFeedback(token)}>
          <Icon name="feather" size={14} /> ثبت نظر و دل‌نوشته
        </button>
      ) : (
        <span className="pt-soft">—</span>
      );
    }
    case "refunded":
      return (
        <span className="pt-soft">
          <Icon name="check" size={14} /> سهمیه اعاده شد
        </span>
      );
    case "late":
      return (
        <span className="pt-soft pt-soft--warn">
          <Icon name="info" size={14} /> لغو دیرهنگام — سهمیه اعاده نشد
        </span>
      );
    case "noshow":
      return (
        <span className="pt-soft pt-soft--danger">
          <Icon name="alert" size={14} /> عدم حضور ثبت شد
        </span>
      );
    case "awaiting":
      return (
        <span className="pt-soft pt-soft--wait">
          <Icon name="hourglass" size={14} /> پس از ثبت تخلیه گشوده می‌شود
        </span>
      );
    case "closed":
      return <span className="pt-soft">مهلت دل‌نوشته (۳۰ روز) گذشته</span>;
    case "none":
      return <span className="pt-soft">—</span>;
  }
}

/** «دفتر دل‌نوشته» پیش از نخستین اقامت: دفتر بسته + شمارش معکوس + مسیر سه‌گام تا ثبت دل‌نوشته. */
function JournalTeaser({ r, onOpen }: { r: Reservation; onOpen: (code: string) => void }) {
  const now = useNow().getTime();
  const start = Date.parse(r.start);
  const end = Date.parse(r.end);
  // پایان زمان رزرو بی ثبت تخلیه ⇒ مرحلهٔ «دفتر»؛ ورود ثبت‌شده یا درون بازه ⇒ «اقامت»
  const over = now >= end;
  const staying = !over && (r.status === "checked_in" || now >= start);
  const days = daysUntil(r.start, now);
  const stage = over ? 2 : staying ? 1 : 0;
  const checkout = `${formatDayLabel(day(r.end))}، ساعت ${formatClock(r.end)}`;
  const steps = [
    {
      icon: "prayer" as const,
      title: "زیارت و اقامت",
      when: `${formatDayLabel(day(r.start))}، ساعت ${formatClock(r.start)}`,
    },
    { icon: "luggage" as const, title: "تخلیه و تحویل کلید", when: checkout },
    { icon: "feather" as const, title: "گشایش دفتر دل‌نوشته", when: "پس از تخلیه · پیامک و همین صفحه" },
  ];
  const unit = (
    <b>
      {r.unit_title} <bdi className="latin">{r.unit_code}</bdi>
    </b>
  );
  return (
    <article className="pt-journal" aria-labelledby="pt-journal-title" data-stage={stage}>
      <div className="pt-journal__art" aria-hidden="true">
        <div className="pt-journal__book">
          <span className="pt-journal__ribbon" />
          <span className="pt-journal__seal">
            <Icon name={stage === 2 ? "sparkle" : "lock"} size={16} />
          </span>
          <Icon name="feather" size={28} />
          <span className="pt-journal__lines">
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
      <div className="pt-journal__body">
        <span className="pt-journal__eyebrow">
          <Icon name="sparkle" size={14} /> دفتر دل‌نوشتهٔ شما
        </span>
        <h3 id="pt-journal-title">
          {stage === 2
            ? "سفرتان به پایان رسید؛ دفتر دل‌نوشته در آستانهٔ گشایش است"
            : staying
              ? "مهمان مهدیه هستید؛ دفتر دل‌نوشته پس از تخلیه گشوده می‌شود"
              : "دفتر دل‌نوشته پس از نخستین زیارت گشوده می‌شود"}
        </h3>
        <p className="pt-journal__lead">
          {stage === 2 ? (
            <>
              اقامت شما در {unit} به پایان رسیده است. به‌محض ثبت تخلیه از سوی پذیرش، این سفر به سابقه می‌پیوندد و
              می‌توانید خادمان را ارزیابی کنید و حال‌وهوای زیارتتان را بنویسید.
            </>
          ) : staying ? (
            <>
              هم‌اکنون در {unit} اقامت دارید. پس از تخلیه، سابقهٔ این سفر همین‌جا ثبت می‌شود و می‌توانید خادمان را
              ارزیابی کنید و حال‌وهوای زیارتتان را بنویسید.
            </>
          ) : (
            <>
              نخستین سفر شما به {unit} در راه است؛ پس از تخلیه، سابقهٔ آن و امکان ارزیابی خادمان و نوشتن حال‌وهوای زیارت
              همین‌جا باز می‌شود.
            </>
          )}
        </p>
        <div className="pt-journal__count" role="status">
          {stage === 2 ? (
            <>
              <strong>
                <Icon name="feather" size={20} />
              </strong>
              <span>
                <b>زیارتتان قبول باشد</b>
                <small>دفتر با ثبت تخلیه در پذیرش گشوده می‌شود</small>
              </span>
            </>
          ) : staying ? (
            <>
              <strong>
                <Icon name="prayer" size={20} />
              </strong>
              <span>
                <b>زیارتتان قبول؛ خوش آمدید</b>
                <small>گشایش دفتر پس از تخلیه · {checkout}</small>
              </span>
            </>
          ) : days <= 1 ? (
            <>
              <strong>{days <= 0 ? "امروز" : "فردا"}</strong>
              <span>
                <b>روز تشرّف</b>
                <small>تحویل کلید از ساعت {formatClock(r.start)}</small>
              </span>
            </>
          ) : (
            <>
              <strong>{faDigits(days)}</strong>
              <span>
                <b>روز تا زیارت</b>
                <small>{formatDayLabel(day(r.start))}</small>
              </span>
            </>
          )}
        </div>
        <ol className="pt-trail" data-stage={stage} aria-label="مسیر تا گشایش دفتر دل‌نوشته">
          {steps.map((st, i) => {
            const state = i < stage ? "done" : i === stage ? "current" : "next";
            return (
              <li
                key={st.title}
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
                className="pt-trail__step"
              >
                <span className="pt-trail__node" aria-hidden="true">
                  <Icon name={state === "done" ? "check" : st.icon} size={16} />
                </span>
                <span className="pt-trail__text">
                  <b>
                    {st.title}
                    <span className="sr-only">
                      {state === "done" ? " — انجام شد" : state === "current" ? " — مرحلهٔ کنونی" : ""}
                    </span>
                  </b>
                  <small>{st.when}</small>
                </span>
              </li>
            );
          })}
        </ol>
        <button type="button" className="btn btn-secondary" onClick={() => onOpen(r.code)}>
          <Icon name="ticket" size={18} />{" "}
          {staying ? "مشاهدهٔ اقامت جاری" : stage === 2 ? "جزئیات این سفر" : "مشاهدهٔ سفر پیش‌رو"}
        </button>
      </div>
    </article>
  );
}
