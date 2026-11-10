"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { prayerTimesQuery } from "@/shared/api/queries";
import type { PrayerKey } from "@/shared/api/schemas";
import { faDigits, formatClock, formatDayNumber, formatWeekday, tehranToday } from "@/shared/lib/fa";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { Icon } from "@/shared/ui/Icon";
import { nextSlot, pickToday, PRAYER_HINT, PRAYER_ICON, untilLabel } from "./model";

const SLOT_BADGE: Record<PrayerKey, string> = {
  fajr: "سحرگاه",
  sunrise: "آیین سنتی",
  dhuhr: "نیم‌روز",
  sunset: "آیین سنتی",
  maghrib: "شامگاه",
  midnight: "پاس شب",
};
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
                افق شرعی {pt.data?.city ?? "مشهد مقدس"} (حرم مطهر رضوی)
                {selected ? (
                  <>
                    {" · "}
                    <bdi>{selected.label}</bdi>
                  </>
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
            <div className="hp-days" role="group" aria-label="انتخاب روز" data-float-scroll="" tabIndex={0}>
              {week.map((d, i) => {
                const name = i === 0 ? "امروز" : i === 1 ? "فردا" : formatWeekday(d.date);
                const num = formatDayNumber(d.date);
                return (
                  <button
                    key={d.date}
                    type="button"
                    className="hp-day"
                    aria-pressed={d.date === selected?.date}
                    onClick={() => setPicked(d.date)}
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
          ) : null}

          <ol className="hp-slots" aria-busy={pt.isPending || undefined} aria-label="وقت‌های شرعی روز">
            {selected
              ? selected.slots.map((s, i) => {
                  const isNext = nextDay?.date === selected.date && next?.[1] === i;
                  const past = now !== null && Date.parse(s.at) <= now;
                  return (
                    <li
                      key={s.key}
                      className="hp-slot"
                      data-next={isNext || undefined}
                      data-past={past || undefined}
                      data-ritual={s.key === "sunrise" || s.key === "sunset" || undefined}
                    >
                      <span className="hp-slot__badge">{isNext ? "نوبت بعدی" : SLOT_BADGE[s.key]}</span>
                      <Icon name={PRAYER_ICON[s.key]} size={24} className="hp-slot__icon" />
                      <h3 className="hp-slot__title">{s.label}</h3>
                      <p className="hp-slot__time">
                        <time dateTime={s.at}>{formatClock(s.at)}</time>
                      </p>
                      <p className="hp-slot__sub">{PRAYER_HINT[s.key]}</p>
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
              {sunrise && sunset ? (
                <p className="hp-ritual__today">
                  امروز: پیش از طلوع{" "}
                  <time dateTime={sunrise.at}>
                    <bdi>{formatClock(sunrise.at)}</bdi>
                  </time>{" "}
                  و پیش از غروب{" "}
                  <time dateTime={sunset.at}>
                    <bdi>{formatClock(sunset.at)}</bdi>
                  </time>
                </p>
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
