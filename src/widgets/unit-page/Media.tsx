"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { unitPlan, unitPlan2d } from "@/entities/unit/unit";
import type { UnitDetail, UnitPhoto } from "@/shared/api/schemas";
import { faDigits } from "@/shared/lib/fa";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon, type IconName } from "@/shared/ui/Icon";
import type { MediaView } from "./model";
import { MAX_SCALE, MIN_SCALE, STEP } from "./zoom";
import { ZoomStage, type ZoomHandle } from "./ZoomStage";

type Photo = UnitPhoto & { src: string };

const TABS: Array<{ view: MediaView; label: string; icon: IconName }> = [
  { view: "space", label: "نمای فضا", icon: "cube" },
  { view: "plan", label: "پلان شماتیک", icon: "plan" },
  { view: "photos", label: "تصاویر", icon: "image" },
];

const CAPTION: Record<MediaView, string> = {
  space: "نمای مفهومی؛ چیدمان و ابعاد واقعی تأیید نشده‌اند؛ از این تصویر، تعداد تخت یا متراژ قابل نتیجه‌گیری نیست.",
  plan: "پلان مفهومی، بدون مقیاس؛ نه نقشهٔ واقعی. جای در، پنجره و چیدمان فقط برای معرفی بصری است.",
  photos: "تصویر ثبت‌شده برای این واحد در پنل مدیریت؛ متن جایگزین و ترتیب از دادهٔ همان تصویر می‌آیند.",
};

/**
 * رسانهٔ واحد: «نمای فضا» (تصویرسازی ایزومتریک طراح)، «پلان شماتیک» و — فقط اگر مدیریت عکس ثبت
 * کرده باشد — «تصاویر» با گالری تمام‌صفحه (ورق‌زدن با صفحه‌کلید، بزرگ‌نمایی، بندانگشتی‌ها).
 * عکس خراب ⇒ کنار گذاشته می‌شود و پیام آرام؛ هیچ‌گاه کادر خالی.
 */
export function UnitMedia({
  unit,
  photos: all,
  onFeature,
}: {
  unit: UnitDetail;
  photos: Photo[];
  onFeature: (code: string) => void;
}) {
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  const photos = all.filter((p) => !broken.has(p.id));
  const [picked, setPicked] = useState<MediaView | null>(null);
  const view: MediaView =
    picked === "photos" && !photos.length ? "space" : (picked ?? (photos.length ? "photos" : "space"));
  const [index, setIndex] = useState(0);
  const at = photos.length ? ((index % photos.length) + photos.length) % photos.length : 0;
  const photo = photos[at];
  const [gallery, setGallery] = useState(false);
  const hasBath = unit.features.some((f) => f.code === "private-bath");

  const step = (d: number) => setIndex((i) => i + d);
  const fail = (id: number) => setBroken((s) => new Set([...s, id]));

  const onTabsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = TABS.filter((t) => t.view !== "photos" || photos.length);
    const i = tabs.findIndex((t) => t.view === view);
    // راست‌به‌چپ: ArrowLeft ⇒ بعدی
    const next = e.key === "ArrowLeft" ? i + 1 : e.key === "ArrowRight" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const t = tabs[(next + tabs.length) % tabs.length];
    if (!t) return;
    setPicked(t.view);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${t.view}"]`)?.focus();
  };

  return (
    <figure className="ud-media" aria-labelledby="ud-media-caption">
      <div className="ud-media__bar">
        <div className="ud-media__tabs" role="tablist" aria-label="نمای واحد" onKeyDown={onTabsKey}>
          {TABS.filter((t) => t.view !== "photos" || photos.length).map((t) => (
            <button
              key={t.view}
              type="button"
              role="tab"
              data-view={t.view}
              aria-selected={view === t.view}
              aria-controls="ud-media-stage"
              tabIndex={view === t.view ? 0 : -1}
              onClick={() => setPicked(t.view)}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
              {t.view === "photos" ? <span className="ud-media__n">{faDigits(photos.length)}</span> : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="icon-button ud-icon-btn"
          onClick={() => setGallery(true)}
          aria-haspopup="dialog"
        >
          <Icon name="expand" size={18} />
          <span className="sr-only">نمایش بزرگ</span>
        </button>
      </div>

      <div
        id="ud-media-stage"
        role="tabpanel"
        className="ud-media__stage"
        data-view={view}
        data-tone={unit.code === "B2" || unit.code === "B3" ? "cool" : undefined}
      >
        {view === "photos" && photo ? (
          <>
            <img
              key={photo.id}
              className="ud-media__photo"
              src={photo.src}
              alt={photo.alt_text || `تصویر ثبت‌شده برای ${unit.title}`}
              decoding="async"
              onError={() => fail(photo.id)}
            />
            {photos.length > 1 ? (
              <div className="ud-media__pager">
                <button type="button" className="icon-button ud-icon-btn" onClick={() => step(-1)}>
                  <Icon name="arrow-right" size={18} />
                  <span className="sr-only">تصویر قبلی</span>
                </button>
                <span aria-live="polite">
                  {faDigits(at + 1)} از {faDigits(photos.length)}
                </span>
                <button type="button" className="icon-button ud-icon-btn" onClick={() => step(1)}>
                  <Icon name="arrow-left" size={18} />
                  <span className="sr-only">تصویر بعدی</span>
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <img
              key={view}
              className="ud-media__art"
              src={view === "plan" ? unitPlan2d(unit.unit_type) : unitPlan(unit.unit_type, unit.code)}
              alt=""
              width={700}
              height={view === "plan" ? 460 : 440}
            />
            <bdi className="ud-media__code latin" aria-hidden="true">
              {unit.code}
            </bdi>
            <span className="ud-media__badge">
              <Icon name="plan" size={14} /> تصویرسازی مفهومی
            </span>
            {hasBath && view === "space" ? (
              <button type="button" className="ud-media__pin" onClick={() => onFeature("private-bath")}>
                <Icon name="shower" size={18} />
                <span className="sr-only">سرویس بهداشتی اختصاصی — توضیح</span>
              </button>
            ) : null}
          </>
        )}
        {broken.size && view !== "photos" && all.length ? (
          <p className="ud-media__error" role="status">
            {photos.length ? "یکی از تصاویر بارگذاری نشد و کنار گذاشته شد." : "تصاویر ثبت‌شده بارگذاری نشدند."}
            <button type="button" onClick={() => setBroken(new Set())}>
              تلاش دوباره
            </button>
          </p>
        ) : null}
      </div>
      <figcaption id="ud-media-caption">
        <Icon name="info" size={16} />
        <span>{CAPTION[view]}</span>
      </figcaption>

      <Gallery
        open={gallery}
        onOpenChange={setGallery}
        unit={unit}
        view={view}
        photos={photos}
        index={at}
        onStep={step}
        onSelect={setIndex}
        onFail={fail}
      />
    </figure>
  );
}

function Gallery({
  open,
  onOpenChange,
  unit,
  view,
  photos,
  index,
  onStep,
  onSelect,
  onFail,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  unit: UnitDetail;
  view: MediaView;
  photos: Photo[];
  index: number;
  onStep: (d: number) => void;
  onSelect: (i: number) => void;
  onFail: (id: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const zoomRef = useRef<ZoomHandle>(null);
  const photo = view === "photos" ? photos[index] : undefined;
  const many = Boolean(photo) && photos.length > 1;
  // تصویر تازه ⇒ صحنهٔ تازه (کلید ‎src‎) و درصد بزرگ‌نمایی از نو
  const step = (d: number) => {
    setScale(1);
    onStep(d);
  };
  const select = (i: number) => {
    setScale(1);
    onSelect(i);
  };
  const src = photo ? photo.src : view === "plan" ? unitPlan2d(unit.unit_type) : unitPlan(unit.unit_type, unit.code);
  const pct = Math.round(scale * 100);
  const label = photo
    ? photo.alt_text || `تصویر ثبت‌شده برای ${unit.title}`
    : view === "plan"
      ? "پلان مفهومی، بدون مقیاس؛ نه نقشهٔ واقعی"
      : "نمای مفهومی؛ چیدمان و ابعاد واقعی تأیید نشده‌اند";
  return (
    <AppDialog
      isOpen={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setScale(1);
      }}
      size="xl"
      className="ud-gallery"
      title={unit.title}
      subtitle={
        <>
          <bdi className="latin">{unit.code}</bdi> ·{" "}
          {photo ? "تصاویر ثبت‌شده" : view === "plan" ? "پلان شماتیک" : "نمای فضا"}
        </>
      }
      closeLabel="بستن نمایش بزرگ"
      actions={
        <div className="ud-gallery__tools">
          {many ? (
            <div className="ud-gallery__nav">
              <button type="button" className="icon-button ud-icon-btn" onClick={() => step(-1)}>
                <Icon name="arrow-right" size={18} />
                <span className="sr-only">تصویر قبلی</span>
              </button>
              <button type="button" className="icon-button ud-icon-btn" onClick={() => step(1)}>
                <Icon name="arrow-left" size={18} />
                <span className="sr-only">تصویر بعدی</span>
              </button>
            </div>
          ) : null}
          <p aria-live="polite">
            {many ? `${faDigits(index + 1)} از ${faDigits(photos.length)} · ` : ""}
            {label}
          </p>
          <div className="ud-gallery__zoom" role="group" aria-label="بزرگ‌نمایی">
            <button
              type="button"
              className="icon-button ud-icon-btn"
              disabled={scale <= MIN_SCALE}
              onClick={() => zoomRef.current?.zoomBy(1 / STEP)}
            >
              <Icon name="minus" size={18} />
              <span className="sr-only">کوچک‌نمایی</span>
            </button>
            <button
              type="button"
              className="ud-gallery__pct"
              disabled={scale <= MIN_SCALE}
              onClick={() => zoomRef.current?.reset()}
              title="بازگشت به اندازهٔ عادی"
            >
              <bdi>{faDigits(pct)}٪</bdi>
              <span className="sr-only">، بازگشت به اندازهٔ عادی</span>
            </button>
            <button
              type="button"
              className="icon-button ud-icon-btn"
              disabled={scale >= MAX_SCALE}
              onClick={() => zoomRef.current?.zoomBy(STEP)}
            >
              <Icon name="plus" size={18} />
              <span className="sr-only">بزرگ‌نمایی</span>
            </button>
          </div>
        </div>
      }
    >
      <ZoomStage
        key={src}
        ref={zoomRef}
        src={src}
        alt={label}
        width={photo ? undefined : 700}
        height={photo ? undefined : 460}
        hint="ud-zoom-hint"
        onError={photo ? () => onFail(photo.id) : undefined}
        onScale={setScale}
        onPage={many ? step : null}
      />
      <p id="ud-zoom-hint" className="sr-only">
        برای بزرگ‌نمایی دوبار بزنید، از چرخ موشواره یا کلیدهای به‌اضافه و منها استفاده کنید؛ در حالت بزرگ‌نمایی با کشیدن
        یا کلیدهای جهت جابه‌جا شوید و کلید صفر اندازه را عادی می‌کند.
        {many ? " در اندازهٔ عادی، کشیدن افقی یا کلیدهای جهت تصویر بعدی و قبلی را نشان می‌دهد." : ""}
      </p>
      {many ? (
        <ul className="ud-gallery__thumbs" aria-label="همهٔ تصاویر">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button type="button" aria-current={i === index || undefined} onClick={() => select(i)}>
                <img src={p.src} alt="" loading="lazy" />
                <span className="sr-only">
                  تصویر {faDigits(i + 1)}: {p.alt_text || unit.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </AppDialog>
  );
}
