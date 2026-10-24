"use client";
import type { Certificate, Profile, Reservation } from "@/shared/api/schemas";
import { faDigits, formatMoment } from "@/shared/lib/fa";
import { Mark } from "@/shared/ui/Mark";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { arrivalLabel, groupShortCode, qrDataUri } from "./model";
import { spanLabel } from "./parts";

/**
 * «گواهی رسمی اقامت زائر» — چیدمان طراح، داده‌ها از خود سرور:
 * ورود/خروج دقیقاً همان رشتهٔ امضاشدهٔ ‎fields‎ است تا بازرس آفلاین بتواند همان را وارد کند؛
 * کد کوتاه HMAC سرور است (نه هش قابل‌جعل سمت مرورگر) و QR به نشانی استعلام برخط اشاره می‌کند.
 */
export function CertificateSheet({
  cert,
  reservation,
  profile,
  floorTitle,
  freeCancelHours,
  noShowGraceHours,
  noShowSuspensionDays,
}: {
  cert: Certificate;
  reservation: Reservation;
  profile: Profile | null;
  floorTitle: string | null;
  freeCancelHours: number;
  noShowGraceHours: number;
  noShowSuspensionDays: number;
}) {
  const field = (label: string) => cert.fields.find((f) => f.label === label)?.value ?? null;
  const short = groupShortCode(cert.short_code);
  const doc =
    profile?.id_document_type === "passport"
      ? `گذرنامه: ${profile.national_id_masked}`
      : profile
        ? `کد ملی: ${profile.national_id_masked}`
        : null;
  const arrival = arrivalLabel(reservation.expected_arrival);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cert.short_code);
      toast("کد کوتاه کپی شد.", "success");
    } catch {
      toast(`کد کوتاه: ${short}`, "info");
    }
  };

  return (
    <article className="cert" aria-labelledby="cert-title">
      <header className="cert__head">
        <span className="cert__emblem" aria-hidden="true">
          <Mark />
        </span>
        <div className="cert__titles">
          <p className="cert__basmala">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <h3 id="cert-title">گواهی رسمی اقامت زائر</h3>
          <p>موقوفهٔ زائرسرای مهدیه مشهد مقدس · جوار بارگاه منور رضوی</p>
        </div>
        <div className="cert__code">
          <span>شمارهٔ پیگیری رزرو:</span>
          <strong>
            <bdi dir="ltr">{cert.code}</bdi>
          </strong>
          <small>صدور: {cert.issued_on}</small>
        </div>
      </header>

      <dl className="cert__fields">
        <div>
          <dt>نام سرپرست زائران:</dt>
          <dd>{cert.holder}</dd>
        </div>
        {doc ? (
          <div>
            <dt>مدرک شناسایی:</dt>
            <dd>
              <bdi>{doc}</bdi>
            </dd>
          </div>
        ) : null}
        {profile ? (
          <div>
            <dt>شمارهٔ تماس همراه:</dt>
            <dd>
              <bdi className="latin" dir="ltr">
                {profile.phone_masked}
              </bdi>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>تعداد مهمانان:</dt>
          <dd>{faDigits(reservation.guests_count)} نفر</dd>
        </div>
        <div className="cert__wide">
          <dt>واحد و طبقهٔ اختصاص‌یافته:</dt>
          <dd>
            <bdi>{reservation.unit_code}</bdi> — {reservation.unit_title}
            {floorTitle ? ` (${floorTitle})` : ` (طبقهٔ ${faDigits(reservation.floor_number)})`}
          </dd>
        </div>
        <div>
          <dt>زمان آغاز پذیرش (ورود):</dt>
          <dd>{field("ورود") ?? formatMoment(reservation.start)}</dd>
        </div>
        <div>
          <dt>زمان پایان اقامت (خروج):</dt>
          <dd>{field("خروج") ?? formatMoment(reservation.end)}</dd>
        </div>
        <div className="cert__wide">
          <dt>مدت کل اقامت:</dt>
          <dd>{spanLabel(reservation.cells_count)}</dd>
        </div>
        {arrival || reservation.vehicle_plate ? (
          <div className="cert__wide cert__trip">
            <dt>هماهنگی ورود:</dt>
            <dd>
              {arrival ? <span>رسیدن تقریبی {arrival}</span> : null}
              {reservation.vehicle_plate ? (
                <span>
                  <Icon name="car" size={16} /> پلاک <bdi>{reservation.vehicle_plate}</bdi>
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="cert__verify">
        <figure className="cert__qr">
          <span className="cert__qr-tile">
            <img src={qrDataUri(cert.qr_svg)} alt={`QR استعلام برخط گواهی ${cert.code}`} width={148} height={148} />
          </span>
          <figcaption>اسکن جهت استعلام اصالت آنلاین</figcaption>
        </figure>
        <div className="cert__offline">
          <h4>
            <Icon name="cloud-off" size={18} /> استعلام آفلاین (بدون اینترنت)
          </h4>
          <p>در شرایط قطعی شبکه یا بازرسی بین‌راهی، کد کوتاه پایدار زیر را به مسئول پذیرش ارائه فرمایید:</p>
          <div className="cert__short">
            <span>کد کوتاه ۸ حرفی:</span>
            <strong>
              <bdi dir="ltr">{short}</bdi>
            </strong>
            <button type="button" className="btn btn-ghost btn-sm cert__copy" onClick={() => void copy()}>
              <Icon name="copy" size={16} /> کپی
            </button>
          </div>
          <small>
            امضاشده با کلید محرمانهٔ سامانه{" "}
            {/* پرانتزها بیرون از bdi (آینه‌ای در RTL) و کل عبارت نشکن ⇒ «HMAC-SHA256» هرگز دو تکه نمی‌شود */}
            <span className="cert__alg">
              (
              <bdi className="latin" dir="ltr">
                HMAC-SHA256
              </bdi>
              )
            </span>{" "}
            — بدون آن کلید قابل ساختن نیست.
          </small>
        </div>
      </div>

      <ul className="cert__rules">
        <li>
          <strong>مدارک الزامی:</strong> هنگام پذیرش، همراه داشتن اصل کارت ملی (یا اصل گذرنامه برای زائران خارجی) الزامی
          است.
        </li>
        <li>
          <strong>ساعت ورود و خروج:</strong> تحویل واحد از آغاز سانس و تخلیه تا پایان آن انجام می‌شود؛ اگر بیش از{" "}
          {faDigits(noShowGraceHours)} ساعت بدون اطلاع دیر کنید، «عدم حضور» ثبت و تا {faDigits(noShowSuspensionDays)}{" "}
          روز امکان رزرو نخواهید داشت.
        </li>
        <li>
          <strong>لغو رایگان:</strong>{" "}
          {reservation.free_cancel_until
            ? `امکان لغو بدون جریمه تا ${formatMoment(reservation.free_cancel_until)} (${faDigits(freeCancelHours)} ساعت پیش از ورود) فعال است.`
            : `لغو بدون جریمه تا ${faDigits(freeCancelHours)} ساعت پیش از ورود ممکن است.`}
        </li>
      </ul>
    </article>
  );
}
