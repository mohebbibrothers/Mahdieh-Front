"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { pastStaysQuery } from "@/shared/api/portal";
import { feedbackToken } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { durationLabel, faDigits, formatDayMonth, formatYear, tehranToday } from "@/shared/lib/fa";
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

/** سابقهٔ اقامت‌های پیشین (طراح: جدول وسط‌چین؛ موبایل: کارت به‌جای اسکرول افقی). */
export function PastStays({ onOpen }: { onOpen: (code: string) => void }) {
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
          <Icon name="pencil" size={14} /> ثبت نظر و دل‌نوشته
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
    case "closed":
      return <span className="pt-soft">مهلت نظرسنجی گذشته</span>;
    case "none":
      return <span className="pt-soft">—</span>;
  }
}
