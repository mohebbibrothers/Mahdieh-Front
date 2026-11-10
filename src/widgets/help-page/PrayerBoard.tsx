"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { prayerTimesQuery } from "@/shared/api/queries";
import type { PrayerKey } from "@/shared/api/schemas";
import { faDigits, formatClock, formatDayNumber, formatWeekday, tehranToday } from "@/shared/lib/fa";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { revealInRail, useScrollRail } from "@/shared/lib/use-scroll-rail";
import { Icon } from "@/shared/ui/Icon";
import { RailFrame } from "@/shared/ui/RailFrame";
import { nextSlot, pickToday, PRAYER_ICON, prayerHint, untilLabel } from "./model";

const SLOT_BADGE: Record<PrayerKey, string> = {
  fajr: "سحرگاه",
  sunrise: "آیین سنتی",
  dhuhr: "نیم‌روز",
  sunset: "آیین سنتی",
  maghrib: "شامگاه",
  midnight: "پاس شب",
};
/** برچسب طلوع و غروب در روزهایی که نقاره‌خانه خاموش است (محرم و صفر). */
const QUIET_BADGE: Partial<Record<PrayerKey, string>> = { sunrise: "آغاز روز", sunset: "پایان روز" };
const DAYS = 8;
const WEEK = 7;

/**
 * اوقات شرعی به افق حرم مطهر (محاسبهٔ بک‌اند) — روز جاری از ساعت تهران برگزیده می‌شود (کش ۳۰ دقیقه‌ای
 * ممکن است از دیروز آغاز شود)، وقت پیش‌رو با شمارش معکوس برجسته است و هفت روز پیش رو قابل انتخاب.
 */
export function PrayerBoard() {
  const pt = useQuery(prayerTimesQuery(DAYS));
  const now = useHydratedNow(30_000);
  const [picked, setPicked] = useState<string | null>(null);
  const [attachDays, dayEdges, stepDays] = useScrollRail<HTMLDivElement>();
  const days = pt.data?.days ?? [];
  const todayIso = now ? tehranToday(new Date(now)) : null;
  const from = todayIso ? pickToday(days, todayIso) : 0;
  const week = days.slice(from, from + WEEK);
  const selected = week.find((d) => d.date === picked) ?? week[0];
  const next = now ? nextSlot(days, now) : null;
  const nextDay = next ? days[next[0]] : undefined;
  const nextAt = next && nextDay ? nextDay.slots[next[1]] : undefined;
  const today = week[0];
  const sunrise = today?.slots.find((s) => s.key === "sunrise");
  const sunset = today?.slots.find((s) => s.key === "sunset");

  return (
    <section className="hp-band hp-prayer" id="prayer" aria-labelledby="hp-prayer-title">
      <div className="hp-shell">
        <header className="hp-lead">
          <span className="hp-lead__badge">
            <Icon name="prayer" size={16} />
            <span>برنامهٔ تشرف و نماز جماعت</span>
          </span>
          <h2 id="hp-prayer-title" className="hp-lead__title">
            اوقات شرعی به افق مشهد و آیین‌های حرم
          </h2>
          <p className="hp-lead__desc">
            وقت‌های اذان و طلوع و غروب به افق حرم مطهر رضوی، و زمان آیین کهن نقاره‌خانه — برای هماهنگی رفت‌وآمد میان
            زائرسرا و حرم.
          </p>
        </header>

        <div className="hp-prayer__deck">
          <div className="hp-prayer__head">
            <p className="hp-prayer__live">
              <span className="hp-live" aria-hidden="true" />
              <span>
                <span className="hp-prayer__place">افق شرعی {pt.data?.city ?? "مشهد مقدس"} (حرم مطهر رضوی)</span>
                {selected ? (
                  <span className="hp-prayer__date">
                    <span className="hp-prayer__sep">{" · "}</span>
                    <bdi>{selected.label}</bdi>
                    <span className="hp-prayer__hijri">
                      {" · "}
                      <bdi>{selected.hijri}</bdi>
                    </span>
                  </span>
                ) : null}
              </span>
            </p>
            {nextAt && now ? (
              <p className="hp-prayer__next" role="timer" aria-live="off">
                <Icon name="clock" size={16} />
                <span>
                  تا {nextAt.label}: <strong>{faDigits(untilLabel(Date.parse(nextAt.at) - now))}</strong>
                </span>
              </p>
            ) : null}
          </div>

          {week.length > 1 ? (
            <RailFrame edges={dayEdges} onStep={stepDays} className="hp-days-frame">
              <div
                ref={attachDays}
                className="hp-days"
                role="group"
                aria-label="انتخاب روز"
                data-float-scroll=""
                tabIndex={0}
              >
                {week.map((d, i) => {
                  const name = i === 0 ? "امروز" : i === 1 ? "فردا" : formatWeekday(d.date);
                  const num = formatDayNumber(d.date);
                  return (
                    <button
                      key={d.date}
                      type="button"
                      className="hp-day"
                      aria-pressed={d.date === selected?.date}
                      onClick={(e) => {
                        setPicked(d.date);
                        revealInRail(e.currentTarget);
                      }}
                    >
                      {/* نام دسترس‌پذیر = همان متن دیدنی + بقیهٔ تاریخ (فرمان صوتی «امروز ۱۹» هم کار می‌کند) */}
                      <span className="hp-day__name">{name}</span>
                      <span className="hp-day__num">{num}</span>
                      <span className="sr-only">
                        {i < 2 ? `، ${d.label}` : ` ${d.label.replace(/^\S+\s+\S+\s*/, "")}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </RailFrame>
          ) : null}

          <ol className="hp-slots" aria-busy={pt.isPending || undefined} aria-label="وقت‌های شرعی روز">
            {selected
              ? selected.slots.map((s, i) => {
                  const isNext = nextDay?.date === selected.date && next?.[1] === i;
                  const past = now !== null && Date.parse(s.at) <= now;
                  const ritual = (s.key === "sunrise" || s.key === "sunset") && selected.naqqareh;
                  const badge = ritual ? SLOT_BADGE[s.key] : (QUIET_BADGE[s.key] ?? SLOT_BADGE[s.key]);
                  return (
                    <li
                      key={s.key}
                      className="hp-slot"
                      data-next={isNext || undefined}
                      data-past={past || undefined}
                      data-ritual={ritual || undefined}
                    >
                      <span className="hp-slot__badge">{isNext ? "نوبت بعدی" : badge}</span>
                      <Icon name={PRAYER_ICON[s.key]} size={24} className="hp-slot__icon" />
                      <h3 className="hp-slot__title">{s.label}</h3>
                      <p className="hp-slot__time">
                        <time dateTime={s.at}>{formatClock(s.at)}</time>
                      </p>
                      <p className="hp-slot__sub">{prayerHint(s.key, selected.naqqareh)}</p>
                    </li>
                  );
                })
              : pt.isError
                ? null
                : [0, 1, 2, 3, 4, 5].map((i) => <li key={i} className="hp-slot hp-skel" aria-hidden="true" />)}
          </ol>
          {pt.isError ? (
            <p className="hp-prayer__error" role="alert">
              اوقات شرعی در دسترس نیست.{" "}
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => void pt.refetch()}>
                <Icon name="refresh" size={16} /> تلاش دوباره
              </button>
            </p>
          ) : null}
        </div>

        <div className="hp-rituals">
          <article className="hp-ritual reveal">
            <span className="hp-ritual__icon" aria-hidden="true">
              <Icon name="drum" size={24} />
            </span>
            <div>
              <h3 className="hp-ritual__title">{pt.data?.naqqareh.title ?? "آیین نقاره‌خانهٔ حرم"}</h3>
              <p className="hp-ritual__text">{pt.data?.naqqareh.text ?? "…"}</p>
              {today && !today.naqqareh ? (
                <div className="hp-ritual__today" data-silent="">
                  <p className="hp-ritual__today-title">نقاره‌خانه در این روزها خاموش است</p>
                  <p className="hp-ritual__silent">
                    <bdi className="hp-ritual__hijri">{today.hijri}</bdi>
                    در ماه‌های محرم و صفر، به احترام ایام عزاداری، نقاره نواخته نمی‌شود.
                  </p>
                </div>
              ) : sunrise && sunset ? (
                <div className="hp-ritual__today">
                  <p className="hp-ritual__today-title">نوای نقاره در امروز</p>
                  <ul className="hp-ritual__times">
                    <li className="hp-ritual__time">
                      <Icon name="sunrise" size={20} />
                      <span className="hp-ritual__time-label">پیش از طلوع</span>
                      <time dateTime={sunrise.at}>
                        <bdi>{formatClock(sunrise.at)}</bdi>
                      </time>
                    </li>
                    <li className="hp-ritual__time">
                      <Icon name="sunset" size={20} />
                      <span className="hp-ritual__time-label">پیش از غروب</span>
                      <time dateTime={sunset.at}>
                        <bdi>{formatClock(sunset.at)}</bdi>
                      </time>
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          </article>
          <article className="hp-ritual reveal">
            <span className="hp-ritual__icon" aria-hidden="true">
              <Icon name="compass" size={24} />
            </span>
            <div>
              <h3 className="hp-ritual__title">روش محاسبه</h3>
              <p className="hp-ritual__text">
                {pt.data ? `${pt.data.method}؛ ${pt.data.note}` : "محاسبهٔ نجومی به افق حرم مطهر."}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
