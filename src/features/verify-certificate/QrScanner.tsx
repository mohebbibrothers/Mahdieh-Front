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
type Decode = (src: HTMLVideoElement | ImageBitmap) => Promise<string | null>;
type Status = "starting" | "scanning" | "found" | "denied" | "nocamera" | "insecure" | "error";

const FRAME_MS = 125; // ≈ ۸ فریم در ثانیه — باتری و گرمای گوشی
const MAX_SIDE = 640; // کوچک‌سازی پیش از ‎jsQR‎

/** رمزگشای QR: بومی اگر باشد، وگرنه ‎jsQR‎ (بارگذاری تنبل، فقط وقتی دوربین/عکس لازم شد). */
async function createDecoder(): Promise<Decode> {
  const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      const formats = (await Native.getSupportedFormats?.()) ?? ["qr_code"];
      if (formats.includes("qr_code")) {
        const det = new Native({ formats: ["qr_code"] });
        return async (src) => (await det.detect(src))[0]?.rawValue ?? null;
      }
    } catch {
      /* پشتیبانی ناقص ⇒ jsQR */
    }
  }
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (src) => {
    const w = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
    const h = src instanceof HTMLVideoElement ? src.videoHeight : src.height;
    if (!ctx || !w || !h) return null;
    const k = Math.min(1, MAX_SIDE / Math.max(w, h));
    canvas.width = Math.round(w * k);
    canvas.height = Math.round(h * k);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  };
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
export function QrScanner({ onDetect, onPaste }: { onDetect: (text: string) => void; onPaste: () => void }) {
  const hintId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const decoderRef = useRef<Promise<Decode> | null>(null);
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
          if (acceptRef.current(await (await decoder())(video))) return;
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
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorch(caps.torch ? false : null);
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
      const bitmap = await createImageBitmap(file);
      const text = await (await decoder())(bitmap);
      bitmap.close();
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
          ? "QR گواهی خوانده شد؛ در حال بررسی امضا…"
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
        <label className={cx("btn btn-ghost btn-sm qr-scan__file", fileBusy && "is-busy")}>
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
