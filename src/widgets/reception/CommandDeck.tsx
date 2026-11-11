"use client";
import type { Desk } from "@/shared/api/desk";
import { faDigits, formatClock } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { Icon } from "@/shared/ui/Icon";
import { Popover } from "@/shared/ui/Popover";
import { freshSeconds } from "./model";
import { KeySlot } from "./parts";
import type { OpenDialog } from "./types";

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return faDigits(`${m}:${String(s).padStart(2, "0")}`);
}

/**
 * عرشهٔ فرماندهی شیفت: سرتیتر، سه کنش اصلی (شیوه‌نامه، صف انتظار، خروجی دفتر)، نوار خادم کشیک
 * (نام، نقش، شیفت با ساعت زنده، سطح امنیتی و پنجرهٔ تأیید تازه) و قفسهٔ افقی کلیدهای ۵ واحد.
 */
export function CommandDeck({
  desk,
  open,
  onKey,
  onLogout,
}: {
  desk: Desk;
  open: OpenDialog;
  onKey: (code: string) => void;
  onLogout: () => void;
}) {
  const now = useClock();
  const fresh = now ? freshSeconds(desk.mfa.step_up_valid_until, now) : 0;
  const queue = desk.waitlist.waiting + desk.waitlist.offered;
  const lowCodes = desk.mfa.recovery_codes_remaining <= 3;

  return (
    <section className="rc-deck" aria-labelledby="rc-hero-title">
      <div className="rc-deck__main">
        <div className="rc-deck__copy">
          <p className="rc-eyebrow">سامانهٔ انتظامات و پذیرش حضوری زائرسرا · مشهد مقدس</p>
          <h1 id="rc-hero-title" className="rc-deck__title">
            <span>پیشخوان خادمان؛</span> <em>تحویل کلید و میزبانی رضوی.</em>
          </h1>
          <p className="rc-deck__sub">
            مدیریت برخط {faDigits(desk.units.length)} واحد اقامتی، اسکن گواهی زائر، تطبیق مدارک، تحویل کلید و ثبت حضور و
            غیاب شیفت — <bdi>{desk.day_label}</bdi>.
          </p>
        </div>
        <div className="rc-deck__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => open({ kind: "sop" })}
            aria-haspopup="dialog"
          >
            <Icon name="certificate" size={18} /> <span>شیوه‌نامه و مقررات کشیک</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => open({ kind: "waitlist" })}
            aria-haspopup="dialog"
          >
            <Icon name="users" size={18} />
            <span>صف انتظار {queue ? <>({faDigits(queue)} نفر)</> : "(خالی)"}</span>
            {desk.waitlist.expiring_soon ? (
              <span
                className="rc-dot-alert"
                aria-label={`${faDigits(desk.waitlist.expiring_soon)} پیشنهاد رو به انقضا`}
              />
            ) : null}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => open({ kind: "export" })}
            aria-haspopup="dialog"
          >
            <Icon name="download" size={18} /> <span>خروجی دفتر آمار شیفت</span>
          </button>
        </div>
      </div>

      <div className="rc-strip">
        <Popover
          anchor="desk-officer"
          label="خادم کشیک و امنیت نشست"
          className="rc-officer-pop"
          trigger={(p) => (
            <button type="button" {...p} className={`rc-officer ${p.className}`}>
              <span className="rc-officer__avatar" aria-hidden="true">
                {desk.officer.initials}
              </span>
              <span className="rc-officer__meta">
                <strong>{desk.officer.display_name}</strong>
                <span>
                  {desk.officer.role_label} · {desk.shift.label} · گیت ورودی
                </span>
              </span>
              <Icon name="chevron-down" size={16} />
            </button>
          )}
        >
          {(close) => (
            <div className="rc-officer-menu">
              <p className="popover__title">امنیت نشست خادم</p>
              <div className="rc-officer-menu__id">
                <span className="rc-officer__avatar" aria-hidden="true">
                  {desk.officer.initials}
                </span>
                <span className="rc-officer-menu__who">
                  <strong>{desk.officer.display_name}</strong>
                  <span>
                    {desk.officer.role_label} · {desk.shift.label}
                  </span>
                </span>
              </div>
              <dl className="rc-officer-menu__facts">
                <div>
                  <dt>
                    <Icon name="shield-check" size={16} /> روش تأیید
                  </dt>
                  <dd>
                    {desk.mfa.method === "recovery" ? (
                      "کد بازیابی"
                    ) : (
                      <>
                        برنامهٔ تأیید <bdi className="latin">TOTP</bdi>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Icon name="clock" size={16} /> تأیید تازه
                  </dt>
                  <dd>
                    {fresh > 0 ? (
                      <span className="rc-officer-menu__badge" data-tone="ok">
                        <bdi>{mmss(fresh)}</bdi> باقی‌مانده
                      </span>
                    ) : (
                      <span className="rc-officer-menu__badge">منقضی</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Icon name="key" size={16} /> کدهای بازیابی
                  </dt>
                  <dd>
                    <span className="rc-officer-menu__badge" data-tone={lowCodes ? "warn" : "ok"}>
                      {faDigits(desk.mfa.recovery_codes_remaining)} کد
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="rc-officer-menu__hint">
                {lowCodes
                  ? "کدهای بازیابی رو به پایان است؛ پیش از گم‌شدن گوشی، کدهای تازه بسازید."
                  : fresh > 0
                    ? "تا پایان این زمان، کارهای حساس بی‌پرسش دوباره انجام می‌شوند."
                    : "برای کارهای حساس (نمایش شماره، خروجی کامل) کد ۶ رقمی پرسیده می‌شود."}
              </p>
              <div className="rc-officer-menu__sep" role="separator" />
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  close();
                  open({ kind: "recovery" });
                }}
              >
                <Icon name="refresh" size={16} /> ساخت کدهای بازیابی تازه
              </button>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  close();
                  onLogout();
                }}
              >
                <Icon name="log-out" size={16} /> پایان شیفت و خروج از حساب
              </button>
            </div>
          )}
        </Popover>

        <div className="rc-strip__chips">
          <span className="rc-chip">
            <Icon name="clock" size={16} />
            <span>
              {desk.shift.label} · {desk.shift.hours_label}
              {now ? (
                <>
                  {" "}
                  · <bdi className="rc-chip__clock">{formatClock(new Date(now).toISOString())}</bdi>
                </>
              ) : null}
            </span>
          </span>
          <span className="rc-chip" data-tone={fresh > 0 ? "brand" : "neutral"}>
            <Icon name="shield-check" size={16} />
            <span>{fresh > 0 ? <>سطح ۲ امنیتی · تأیید تازه {mmss(fresh)}</> : "سطح ۲ امنیتی (TOTP فعال)"}</span>
          </span>
        </div>

        <div className="rc-cabinet" role="group" aria-label="قفسهٔ کلیدهای فیزیکی واحدها">
          <span className="rc-cabinet__caption">
            <Icon name="key" size={16} /> قفسهٔ کلیدهای {faDigits(desk.units.length)} واحد:
          </span>
          <div className="rc-cabinet__track">
            {desk.units.map((u) => (
              <KeySlot
                key={u.code}
                code={u.code}
                location={u.key_location}
                title={`کلید ${u.title} (${u.code}): ${u.key_label}`}
                onClick={() => onKey(u.code)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
