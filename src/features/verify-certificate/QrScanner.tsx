"use client";
import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "@/shared/ui/Icon";
import { parseCertificateToken } from "./parse-token";

/** ‎BarcodeDetector‎ (Chrome/Edge/Android/Safari 17+) — در ‎lib.dom‎ تایپ ندارد. */
type Detector = { detect: (src: CanvasImageSource | ImageBitmap) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = {
  new (o: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
};
type Source = HTMLVideoElement | ImageBitmap | HTMLImageElement;
type Decode = (src: Source) => Promise<string | null>;
type Decoder = { frame: Decode; still: Decode };
type Status = "starting" | "scanning" | "found" | "denied" | "nocamera" | "insecure" | "error";

const FRAME_MS = 110; // ≈ ۹ فریم در ثانیه — باتری و گرمای گوشی

/** یک «برش» از منبع: کسری از مرکز (۱ = کل تصویر) با بزرگ‌ترین ضلع ‎max‎ پیکسل. */
type Crop = { frac: number; max: number };
/** فریم دوربین: نوبتی مرکز کادر با وضوح بالا (QR دور/کوچک) و کل فریم (QR نزدیک/کج). */
const FRAME_CROPS: Crop[] = [
  { frac: 0.72, max: 760 },
  { frac: 1, max: 900 },
];
/** عکس گالری: از درشت به ریز — QR کوچکِ گوشهٔ عکس گوشی هم با وضوح کافی خوانده شود. */
const STILL_CROPS: Crop[] = [
  { frac: 1, max: 1400 },
  { frac: 1, max: 900 },
  { frac: 0.6, max: 1200 },
  { frac: 1, max: 520 },
  { frac: 0.4, max: 900 },
];

const sizeOf = (src: Source) =>
  src instanceof HTMLVideoElement
    ? [src.videoWidth, src.videoHeight]
    : src instanceof HTMLImageElement
      ? [src.naturalWidth, src.naturalHeight]
      : [src.width, src.height];

/**
 * رمزگشای QR دولایه: ‎BarcodeDetector‎ بومی (سریع، سخت‌افزاری) و ‎jsQR‎ (بارگذاری تنبل) روی چند برش و
 * مقیاس. ‎jsQR‎ تصویر را خودش به سیاه/سفید تطبیقی می‌برد و هر دو حالت معمولی/وارونه را می‌آزماید.
 */
async function createDecoder(): Promise<Decoder> {
  let native: Detector | null = null;
  const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      const formats = (await Native.getSupportedFormats?.()) ?? ["qr_code"];
      if (formats.includes("qr_code")) native = new Native({ formats: ["qr_code"] });
    } catch {
      native = null; // پشتیبانی ناقص ⇒ فقط jsQR
    }
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const viaNative = async (src: Source) => {
    if (!native) return null;
    try {
      return (await native.detect(src))[0]?.rawValue ?? null;
    } catch {
      return null;
    }
  };
  const viaJsQR = (src: Source, { frac, max }: Crop) => {
    const [w = 0, h = 0] = sizeOf(src);
    if (!ctx || !w || !h) return null;
    const sw = Math.round(frac === 1 ? w : Math.min(w, h) * frac);
    const sh = Math.round(frac === 1 ? h : Math.min(w, h) * frac);
    const k = Math.min(1, max / Math.max(sw, sh));
    canvas.width = Math.max(1, Math.round(sw * k));
    canvas.height = Math.max(1, Math.round(sh * k));
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  };

  let tick = 0;
  return {
    frame: async (src) => {
      const found = await viaNative(src);
      if (found) return found;
      tick = (tick + 1) % FRAME_CROPS.length;
      return viaJsQR(src, FRAME_CROPS[tick]!);
    },
    still: async (src) => {
      const found = await viaNative(src);
      if (found) return found;
      for (const crop of STILL_CROPS) {
        const text = viaJsQR(src, crop);
        if (text) return text;
        await new Promise((r) => setTimeout(r, 0)); // رابط کاربری روان بماند
      }
      return null;
    },
  };
}

/** بارگذاری عکس: ‎createImageBitmap‎ (با چرخش EXIF)؛ اگر نشد (مثلاً HEIC در برخی مرورگرها) ⇒ ‎<img>‎. */
async function loadImage(file: File): Promise<{ src: ImageBitmap | HTMLImageElement; done: () => void }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { src: bitmap, done: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch (e) {
      URL.revokeObjectURL(url);
      throw e;
    }
    return { src: img, done: () => URL.revokeObjectURL(url) };
  }
}

const MESSAGES: Record<Exclude<Status, "starting" | "scanning" | "found">, { title: string; body: string }> = {
  denied: {
    title: "اجازهٔ دوربین داده نشد",
    body: "از نماد قفل یا تنظیمات کنار نشانی مرورگر، دسترسی «دوربین» را برای این سایت روشن و دوباره تلاش کنید؛ یا عکس QR را انتخاب کنید.",
  },
  nocamera: {
    title: "دوربینی در دسترس نیست",
    body: "این دستگاه دوربین ندارد یا برنامهٔ دیگری از آن استفاده می‌کند. عکس QR را انتخاب کنید یا نشانی زیر آن را بچسبانید.",
  },
  insecure: {
    title: "دوربین فقط روی اتصال امن کار می‌کند",
    body: "سایت را با نشانی ‎https‎ باز کنید، یا عکس QR را انتخاب کنید.",
  },
  error: {
    title: "دوربین روشن نشد",
    body: "یک بار دیگر تلاش کنید؛ اگر باز هم نشد، عکس QR را انتخاب کنید یا نشانی زیر آن را بچسبانید.",
  },
};

/**
 * اسکن QR گواهی داخل خود سایت — دوربین پشتی، منظره‌یاب با گوشه‌های متحرک و خط اسکن، چراغ‌قوه (اگر
 * دستگاه پشتیبانی کند)، و انتخاب عکس QR از گالری. فقط QRهایی پذیرفته می‌شوند که پیوند گواهی مهدیه باشند.
 * با بسته‌شدن پنجره یا تعویض زبانه، جریان دوربین فوراً قطع می‌شود (چراغ دوربین خاموش).
 */
export function QrScanner({
  onDetect,
  onPaste,
  checking = false,
}: {
  onDetect: (text: string) => void;
  onPaste: () => void;
  checking?: boolean;
}) {
  const hintId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const decoderRef = useRef<Promise<Decoder> | null>(null);
  const onDetectRef = useRef(onDetect);
  const [status, setStatus] = useState<Status>("starting");
  const [attempt, setAttempt] = useState(0);
  const [torch, setTorch] = useState<boolean | null>(null); // null ⇒ پشتیبانی نمی‌شود
  const [mirror, setMirror] = useState(false);
  const [foreign, setForeign] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  const decoder = () => (decoderRef.current ??= createDecoder());

  const stop = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  /** متن خوانده‌شده ⇒ اگر گواهی مهدیه است: پایان؛ وگرنه هشدار کوتاه و ادامهٔ اسکن. */
  const accept = (text: string | null): boolean => {
    if (!text) return false;
    if (!parseCertificateToken(text)) {
      setForeign(true);
      return false;
    }
    stop();
    setStatus("found");
    navigator.vibrate?.(60);
    onDetectRef.current(text);
    return true;
  };
  const acceptRef = useRef(accept);
  useEffect(() => {
    acceptRef.current = accept;
  });

  useEffect(() => {
    let cancelled = false;
    const loop = async () => {
      const video = videoRef.current;
      if (cancelled || !video || !streamRef.current) return;
      if (video.readyState >= 2) {
        try {
          if (acceptRef.current(await (await decoder()).frame(video))) return;
        } catch {
          /* فریم ناقص — فریم بعد */
        }
      }
      if (!cancelled) timerRef.current = window.setTimeout(() => void loop(), FRAME_MS);
    };
    const start = async () => {
      if (!window.isSecureContext) return setStatus("insecure");
      if (!navigator.mediaDevices?.getUserMedia) return setStatus("nocamera");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
          torch?: boolean;
          focusMode?: string[];
        };
        setTorch(caps.torch ? false : null);
        // فوکوس خودکار پیوسته (اندروید): QR نزدیک کاغذ تار نماند
        if (caps.focusMode?.includes("continuous")) {
          void track
            ?.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] })
            .catch(() => undefined);
        }
        setMirror(track?.getSettings().facingMode === "user");
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("scanning");
        void decoder(); // آماده‌سازی رمزگشا هم‌زمان با نخستین فریم
        void loop();
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError"
              ? "nocamera"
              : "error",
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      stop();
    };
    // ‎decoder/stop‎ فقط به ‎ref‎ها دست می‌زنند؛ ‎attempt‎ = «تلاش دوباره».
  }, [attempt]);

  useEffect(() => {
    if (!foreign) return;
    const t = window.setTimeout(() => setForeign(false), 2600);
    return () => window.clearTimeout(t);
  }, [foreign]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || torch === null) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch {
      setTorch(null);
    }
  };

  const fromFile = async (file: File | undefined) => {
    if (!file) return;
    setFileBusy(true);
    try {
      const image = await loadImage(file);
      let text: string | null;
      try {
        text = await (await decoder()).still(image.src);
      } finally {
        image.done();
      }
      if (!text) setStatusMessage("در این عکس QR خوانا پیدا نشد. عکس واضح‌تر و نزدیک‌تری انتخاب کنید.");
      else if (!acceptRef.current(text)) setStatusMessage("این QR متعلق به گواهی اقامت مهدیه نیست.");
    } catch {
      setStatusMessage("این پرونده تصویر خوانا نیست.");
    } finally {
      setFileBusy(false);
    }
  };
  const restart = () => {
    setStatusMessage(null);
    setStatus("starting");
    setAttempt((a) => a + 1);
  };

  const failure = status in MESSAGES ? MESSAGES[status as keyof typeof MESSAGES] : null;

  return (
    <div className="qr-scan" data-status={status}>
      <div className="qr-scan__viewport">
        <video
          ref={videoRef}
          className={cx("qr-scan__video", mirror && "qr-scan__video--mirror")}
          playsInline
          muted
          aria-hidden="true"
        />
        {failure ? (
          <div className="qr-scan__state" role="alert">
            <Icon name={status === "denied" ? "lock" : "camera"} size={28} />
            <strong>{failure.title}</strong>
            <p>{failure.body}</p>
            <div className="qr-scan__state-actions">
              {status === "denied" || status === "error" ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={restart}>
                  <Icon name="refresh" size={16} /> تلاش دوباره
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost btn-sm" onClick={onPaste}>
                <Icon name="link" size={16} /> چسباندن نشانی
              </button>
            </div>
          </div>
        ) : (
          <div className="qr-scan__frame" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            {status === "scanning" ? <span className="qr-scan__line" /> : null}
            {status === "found" ? (
              <span className="qr-scan__ok">
                <Icon name="check" size={28} />
              </span>
            ) : null}
            {status === "starting" ? <span className="spinner qr-scan__spinner" /> : null}
          </div>
        )}
        {torch !== null && status === "scanning" ? (
          <button
            type="button"
            className="qr-scan__torch"
            aria-pressed={torch}
            aria-label={torch ? "خاموش کردن چراغ‌قوه" : "روشن کردن چراغ‌قوه"}
            onClick={() => void toggleTorch()}
          >
            <Icon name="flashlight" size={20} />
          </button>
        ) : null}
      </div>

      <p className="qr-scan__hint" id={hintId} role="status" data-tone={foreign || statusMessage ? "warn" : undefined}>
        {status === "found"
          ? checking
            ? "QR گواهی خوانده شد؛ در حال بررسی امضا روی سرور مهدیه…"
            : "QR گواهی خوانده شد؛ نتیجهٔ بررسی را پایین ببینید."
          : statusMessage
            ? statusMessage
            : foreign
              ? "این QR متعلق به گواهی اقامت مهدیه نیست."
              : status === "starting"
                ? "در حال روشن کردن دوربین…"
                : status === "scanning"
                  ? "QR پایین گواهی را درون کادر نگه دارید؛ خودکار خوانده می‌شود."
                  : "\u00a0"}
      </p>

      <div className="qr-scan__actions">
        {status === "found" ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={restart}>
            <Icon name="scan" size={16} /> اسکن گواهی دیگر
          </button>
        ) : null}
        <label className={cx("btn btn-secondary btn-sm qr-scan__file", fileBusy && "is-busy")}>
          <Icon name="image" size={16} />
          {fileBusy ? "در حال خواندن عکس…" : "انتخاب عکس QR"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            aria-describedby={hintId}
            onChange={(e) => {
              void fromFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
