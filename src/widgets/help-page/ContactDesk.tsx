"use client";
import Link from "next/link";
import { VerifyCertificateButton } from "@/features/verify-certificate/VerifyCertificate";
import type { Help } from "@/shared/api/schemas";
import { copyText } from "@/shared/lib/clipboard";
import { destHref } from "@/shared/config/destinations";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";

async function copy(text: string, done: string) {
  if (await copyText(text)) toast(done, "success");
  else toast("کپی خودکار ممکن نشد؛ متن را دستی انتخاب کنید.", "warn");
}

/**
 * «ارتباط با پذیرش» (‎#contact-desk‎؛ مقصد «اطلاعات تماس» کل سایت) — تلفن و نشانی از تنظیمات زندهٔ
 * سرور؛ تا تنظیم نشده‌اند، راه جایگزین درست (پرتال) نشان داده می‌شود — هرگز شمارهٔ ساختگی.
 */
export function ContactDesk({ help }: { help: Help | undefined }) {
  const contact = help?.contact;
  const phone = contact?.phone ?? "";
  const address = contact?.address ?? "";
  const portal = destHref("portal");
  const maps = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  return (
    <section className="hp-band hp-contact" id="contact-desk" aria-labelledby="hp-contact-title">
      <div className="hp-shell">
        <header className="hp-lead">
          <h2 id="hp-contact-title" className="hp-lead__title">
            ارتباط مستقیم با پذیرش مهدیه
          </h2>
          <p className="hp-lead__desc">
            پاسخ پرسش خود را نیافتید یا هماهنگی ویژه‌ای لازم دارید؟ خادمان پذیرش زائرسرا در خدمت شما هستند.
          </p>
        </header>
        <div className="hp-desk">
          <article className="hp-desk__card hp-desk__card--accent reveal">
            <div className="hp-desk__top">
              <span className="hp-desk__icon" aria-hidden="true">
                <Icon name="phone" size={20} />
              </span>
              {phone ? (
                <span className="hp-desk__pill">
                  <span className="hp-live" aria-hidden="true" />
                  پاسخگوی زائران
                </span>
              ) : null}
            </div>
            <h3 className="hp-desk__title">تلفن پذیرش زائرسرا</h3>
            <p className="hp-desk__detail">
              {phone
                ? "هماهنگی ساعت رسیدن، اعلام تأخیر، جابه‌جایی یا هر پرسشی که پاسخش را در راهنما نیافتید."
                : "شمارهٔ تماس پذیرش به‌زودی همین‌جا اعلام می‌شود. تا آن زمان، رزرو، لغو و پیام به خادمان از پرتال زائر انجام می‌شود."}
            </p>
            {phone ? (
              <div className="hp-desk__row">
                <a className="hp-desk__btn" href={`tel:${phone}`}>
                  <Icon name="phone" size={18} />
                  <span>
                    تماس: <bdi dir="ltr">{contact?.phone_display || phone}</bdi>
                  </span>
                </a>
                <button
                  type="button"
                  className="hp-desk__copy"
                  aria-label="کپی شمارهٔ پذیرش"
                  onClick={() => void copy(phone, "شمارهٔ پذیرش کپی شد.")}
                >
                  <Icon name="copy" size={16} />
                  <span>کپی</span>
                </button>
              </div>
            ) : portal ? (
              <Link className="hp-desk__btn" href={portal}>
                <Icon name="ticket" size={18} />
                <span>پرتال زائر</span>
              </Link>
            ) : null}
          </article>

          <article className="hp-desk__card reveal">
            <span className="hp-desk__icon" aria-hidden="true">
              <Icon name="map-pin" size={20} />
            </span>
            <h3 className="hp-desk__title">نشانی زائرسرا</h3>
            <p className="hp-desk__detail">
              {address || "نشانی دقیق زائرسرا پس از ثبت رزرو در کارت رزرو و پیامک تأیید برای شما فرستاده می‌شود."}
            </p>
            {address ? (
              <div className="hp-desk__row">
                {maps ? (
                  <a className="hp-desk__btn" href={maps} target="_blank" rel="noopener noreferrer">
                    <Icon name="compass" size={18} />
                    <span>مسیریابی روی نقشه</span>
                    <span className="sr-only"> (در پنجرهٔ تازه)</span>
                  </a>
                ) : null}
                <button
                  type="button"
                  className="hp-desk__copy"
                  aria-label="کپی نشانی زائرسرا"
                  onClick={() => void copy(address, "نشانی زائرسرا کپی شد.")}
                >
                  <Icon name="copy" size={16} />
                  <span>کپی</span>
                </button>
              </div>
            ) : null}
          </article>

          <article className="hp-desk__card reveal">
            <span className="hp-desk__icon" aria-hidden="true">
              <Icon name="certificate" size={20} />
            </span>
            <h3 className="hp-desk__title">پرتال زائر و استعلام گواهی</h3>
            <p className="hp-desk__detail">
              رزروهای جاری و پیشین، نوبت انتظار، پیام به خادمان، و استعلام اصالت گواهی اقامت با کد هشت‌نویسه‌ای یا کارت
              QR.
            </p>
            <div className="hp-desk__row hp-desk__row--stack">
              {portal ? (
                <Link className="hp-desk__btn" href={portal}>
                  <Icon name="ticket" size={18} />
                  <span>ورود به پرتال زائر</span>
                </Link>
              ) : null}
              <VerifyCertificateButton className="hp-desk__copy hp-desk__verify" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
