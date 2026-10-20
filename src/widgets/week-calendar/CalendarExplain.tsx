"use client";
import { useState } from "react";
import { STATUS_ICON } from "@/entities/slot/timeline";
import type { Policies } from "@/shared/api/policies";
import { durationLabel, faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";

/** «راهنمای انتخاب زمان» طراح — با اعداد زندهٔ سیاست‌های بک‌اند به‌جای متن ثابت. */
export function CalendarExplain({ policies }: { policies: Policies }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="section-link" onClick={() => setOpen(true)}>
        راهنمای انتخاب زمان <Icon name="arrow-left" size={16} />
      </button>
      <AppDialog
        isOpen={open}
        onOpenChange={setOpen}
        title="خواندن زمان‌های آزاد"
        subtitle="چهار نکته برای انتخاب درست زمان اقامت"
        actions={
          <a className="btn btn-primary" href="#quick-search" onClick={() => setOpen(false)}>
            جست‌وجوی زمان دلخواه <Icon name="arrow-left" size={18} />
          </a>
        }
      >
        <ol className="explain-list">
          <li>
            <span className="explain-list__icon" aria-hidden="true">
              <Icon name="sun" size={18} />
            </span>
            <div>
              <h3>هر خانه، یک نیم‌روز</h3>
              <p>
                روز از <bdi>۰۸:۰۰</bdi> تا <bdi>۲۰:۰۰</bdi> و شب از <bdi>۲۰:۰۰</bdi> تا <bdi>۰۸:۰۰</bdi> صبح بعد است.
                روی هر خانه بزنید تا همان واحد و زمان باز شود.
              </p>
            </div>
          </li>
          <li>
            <span className="explain-list__icon" aria-hidden="true">
              <Icon name="calendar-check" size={18} />
            </span>
            <div>
              <h3>مدت اقامت باید پیوسته آزاد باشد</h3>
              <p>
                اقامت از {durationLabel(policies.minCells)} تا {durationLabel(policies.maxCells)} است. آزادبودن یک
                نیم‌روز به معنی آزادبودن کل سفر نیست؛ پس از انتخاب تاریخ، مدت و نفرات، سامانه کل بازه را می‌سنجد و اگر
                جا نبود، نزدیک‌ترین زمان آزاد را پیشنهاد می‌کند.
              </p>
            </div>
          </li>
          <li>
            <span className="explain-list__icon" aria-hidden="true">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <h3>بازهٔ ثبت آنلاین</h3>
              <p>
                رزرو تا {faDigits(policies.horizonDays)} روز آینده باز است و باید دست‌کم{" "}
                {faDigits(policies.minLeadHours)} ساعت پیش از شروع ثبت شود؛ سانس‌های نزدیک‌تر «رزرو بسته» نشان داده
                می‌شوند. لغو تا {faDigits(policies.cancelFreeHours)} ساعت پیش از ورود آزاد است.
              </p>
            </div>
          </li>
          <li>
            <span className="explain-list__icon" aria-hidden="true">
              <Icon name="accessibility" size={18} />
            </span>
            <div>
              <h3>بدون تکیه بر رنگ</h3>
              <ul className="explain-legend">
                <li>
                  <Icon name={STATUS_ICON.free} size={14} /> تیک: آزاد
                </li>
                <li>
                  <Icon name={STATUS_ICON.occupied} size={14} /> قفل و هاشور: رزروشده
                </li>
                <li>
                  <Icon name={STATUS_ICON.buffer} size={14} /> جارو: نظافت
                </li>
                <li>
                  <Icon name={STATUS_ICON.blocked} size={14} /> آچار: تعمیر
                </li>
                <li>
                  <Icon name="clock" size={14} /> ساعت و نقطه‌چین: رزرو آنلاین بسته
                </li>
              </ul>
            </div>
          </li>
        </ol>
      </AppDialog>
    </>
  );
}
