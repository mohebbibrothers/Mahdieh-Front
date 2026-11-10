"use client";
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react";
import {
  centerOn,
  clampView,
  DOUBLE_TAP_SCALE,
  fitSize,
  IDENTITY,
  isZoomed,
  panBy,
  STEP,
  viewportRect,
  zoomAt,
  type Box,
  type Point,
  type View,
} from "./zoom";

export type ZoomHandle = {
  /** بزرگ/کوچک‌نمایی نسبت به مرکز صحنه (‎k > 1‎ بزرگ‌تر) */
  zoomBy: (k: number) => void;
  reset: () => void;
};

type Gesture = {
  view: View;
  ratio: number;
  pct: number;
  pointers: Map<number, Point>;
  down: { x: number; y: number; t: number; moved: boolean } | null;
  last: Point;
  lastT: number;
  vel: Point;
  pinch: { d0: number; s0: number; mid: Point } | null;
  tap: { x: number; y: number; t: number } | null;
  raf: number;
  mapDrag: boolean;
};

const gesture = (): Gesture => ({
  view: IDENTITY,
  ratio: 0,
  pct: 100,
  pointers: new Map(),
  down: null,
  last: { x: 0, y: 0 },
  lastT: 0,
  vel: { x: 0, y: 0 },
  pinch: null,
  tap: null,
  raf: 0,
  mapDrag: false,
});

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
/** کشیدن کوتاه‌تر از این ⇒ لمس (نه جابه‌جایی) */
const TAP_SLOP = 6;
/** کشیدن افقی بیش از این در اندازهٔ عادی ⇒ تصویر بعدی/قبلی */
const SWIPE = 60;
const KEY_PAN = 80;

/**
 * صحنهٔ بزرگ‌نمایی گالری: کشیدن (با لختی)، نیشگون دوانگشتی، چرخ موشواره به سمت نشانگر، دوبار-لمس،
 * صفحه‌کلید و نقشهٔ کوچک ناوبری. جابه‌جایی همیشه به لبه‌های واقعی تصویر محدود است، پس همهٔ گوشه‌ها
 * دیدنی‌اند و هیچ‌گاه فضای خالی بیرون تصویر دیده نمی‌شود.
 *
 * تبدیل‌ها با CSSOM (‎el.style.transform‎) اعمال می‌شوند، نه ویژگی ‎style‎ — سیاست CSP سایت ویژگی
 * ‎style‎ را ممنوع کرده است. حالت لحظه‌ای ژست در ‎ref‎ است تا هر حرکت انگشت رندر React نسازد؛ والد فقط
 * با تغییر درصد بزرگ‌نمایی باخبر می‌شود.
 */
export function ZoomStage({
  src,
  alt,
  width,
  height,
  hint,
  onError,
  onScale,
  onPage,
  ref,
}: {
  src: string;
  alt: string;
  width?: number | undefined;
  height?: number | undefined;
  /** متن راهنمای صفحه‌خوان (شناسهٔ ‎aria-describedby‎) */
  hint: string;
  onError?: (() => void) | undefined;
  onScale: (s: number) => void;
  /** ورق زدن تصویر با کشیدن افقی یا کلیدهای جهت در اندازهٔ عادی؛ ‎null‎ ⇒ تک‌تصویر */
  onPage: ((dir: 1 | -1) => void) | null;
  ref?: Ref<ZoomHandle>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const g = useRef<Gesture>(gesture());

  const measure = (): { stage: Box; fit: Box } => {
    const el = stageRef.current;
    const stage = el ? { w: el.clientWidth, h: el.clientHeight } : { w: 0, h: 0 };
    return { stage, fit: fitSize(stage, g.current.ratio) };
  };

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const apply = (next: View, animate: boolean) => {
    const st = g.current;
    st.view = next;
    const img = imgRef.current;
    const el = stageRef.current;
    if (img) {
      img.dataset.anim = animate ? "on" : "off";
      img.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.s})`;
    }
    if (el) el.dataset.zoomed = String(isZoomed(next));
    const frame = frameRef.current;
    if (frame) {
      const { stage, fit } = measure();
      const r = viewportRect(next, stage, fit);
      frame.style.left = `${r.left * 100}%`;
      frame.style.top = `${r.top * 100}%`;
      frame.style.width = `${r.width * 100}%`;
      frame.style.height = `${r.height * 100}%`;
    }
    const pct = Math.round(next.s * 100);
    if (pct !== st.pct) {
      st.pct = pct;
      onScale(next.s);
    }
  };

  const stopInertia = () => {
    cancelAnimationFrame(g.current.raf);
    g.current.raf = 0;
  };

  const zoomBy = (k: number) => {
    stopInertia();
    const { stage, fit } = measure();
    apply(zoomAt(g.current.view, g.current.view.s * k, { x: 0, y: 0 }, stage, fit), true);
  };
  const reset = () => {
    stopInertia();
    apply(IDENTITY, true);
  };
  useImperativeHandle(ref, () => ({ zoomBy, reset }));

  const onWheel = useEffectEvent((e: WheelEvent) => {
    e.preventDefault();
    stopInertia();
    // نیشگون پد لمسی (ctrlKey) گام‌های ریز می‌دهد ⇒ ضریب بزرگ‌تر
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
    const { stage, fit } = measure();
    apply(zoomAt(g.current.view, g.current.view.s * k, local(e), stage, fit), false);
  });
  const onResize = useEffectEvent(() => {
    const { stage, fit } = measure();
    apply(clampView(g.current.view, stage, fit), false);
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const st = g.current;
    const wheel = (e: WheelEvent) => onWheel(e);
    // چرخ باید غیرغیرفعال باشد تا ‎preventDefault‎ اسکرول پنجره را نگیرد
    el.addEventListener("wheel", wheel, { passive: false });
    const ro = new ResizeObserver(() => onResize());
    ro.observe(el);
    return () => {
      el.removeEventListener("wheel", wheel);
      ro.disconnect();
      cancelAnimationFrame(st.raf);
    };
  }, []);

  const inertia = () => {
    const st = g.current;
    let { x: vx, y: vy } = st.vel;
    if (Math.hypot(vx, vy) < 0.25) return;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(32, now - prev);
      prev = now;
      const decay = 0.95 ** (dt / 16);
      vx *= decay;
      vy *= decay;
      const { stage, fit } = measure();
      apply(panBy(st.view, vx * dt, vy * dt, stage, fit), false);
      st.raf = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    st.raf = requestAnimationFrame(step);
  };

  const toggleAt = (p: Point) => {
    const { stage, fit } = measure();
    const v = g.current.view;
    apply(isZoomed(v) ? IDENTITY : zoomAt(v, DOUBLE_TAP_SCALE, p, stage, fit), true);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const st = g.current;
    stopInertia();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    st.pointers.set(e.pointerId, p);
    if (st.pointers.size === 1) {
      st.down = { x: p.x, y: p.y, t: e.timeStamp, moved: false };
      st.last = p;
      st.lastT = e.timeStamp;
      st.vel = { x: 0, y: 0 };
      if (isZoomed(st.view)) e.currentTarget.dataset.drag = "true";
    } else if (st.pointers.size === 2) {
      const [a, b] = [...st.pointers.values()] as [Point, Point];
      st.pinch = { d0: Math.max(1, dist(a, b)), s0: st.view.s, mid: mid(a, b) };
      if (st.down) st.down.moved = true;
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const st = g.current;
    if (!st.pointers.has(e.pointerId)) return;
    const p = local(e);
    st.pointers.set(e.pointerId, p);
    const { stage, fit } = measure();
    if (st.pinch && st.pointers.size >= 2) {
      const [a, b] = [...st.pointers.values()] as [Point, Point];
      const m = mid(a, b);
      let v = zoomAt(st.view, (st.pinch.s0 * dist(a, b)) / st.pinch.d0, m, stage, fit);
      v = panBy(v, m.x - st.pinch.mid.x, m.y - st.pinch.mid.y, stage, fit);
      st.pinch.mid = m;
      apply(v, false);
      return;
    }
    const dx = p.x - st.last.x;
    const dy = p.y - st.last.y;
    st.last = p;
    if (st.down && dist(p, st.down) > TAP_SLOP) st.down.moved = true;
    if (isZoomed(st.view)) {
      const dt = Math.max(1, e.timeStamp - st.lastT);
      st.vel = { x: dx / dt, y: dy / dt };
      st.lastT = e.timeStamp;
      apply(panBy(st.view, dx, dy, stage, fit), false);
    }
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const st = g.current;
    if (!st.pointers.delete(e.pointerId)) return;
    if (st.pointers.size === 1) {
      // از نیشگون به کشیدن تک‌انگشتی بی‌پرش
      st.pinch = null;
      st.last = [...st.pointers.values()][0] ?? st.last;
      st.lastT = e.timeStamp;
      st.vel = { x: 0, y: 0 };
      return;
    }
    if (st.pointers.size > 0) return;
    st.pinch = null;
    delete e.currentTarget.dataset.drag;
    const d = st.down;
    st.down = null;
    if (!d || e.type === "pointercancel") return;
    const p = local(e);
    if (!d.moved && e.timeStamp - d.t < 300) {
      const prev = st.tap;
      if (prev && e.timeStamp - prev.t < 320 && dist(p, prev) < 30) {
        st.tap = null;
        toggleAt(p);
      } else st.tap = { x: p.x, y: p.y, t: e.timeStamp };
      return;
    }
    if (isZoomed(st.view)) {
      // انگشت پیش از رهاشدن ایستاده بود ⇒ بی لختی
      if (e.timeStamp - st.lastT < 90) inertia();
      return;
    }
    const sx = p.x - d.x;
    const sy = p.y - d.y;
    if (onPage && Math.abs(sx) > SWIPE && Math.abs(sx) > Math.abs(sy) * 1.4) onPage(sx > 0 ? 1 : -1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const st = g.current;
    const zoomed = isZoomed(st.view);
    const { stage, fit } = measure();
    const pan = (dx: number, dy: number) => apply(panBy(st.view, dx, dy, stage, fit), true);
    switch (e.key) {
      case "+":
      case "=":
        zoomBy(STEP);
        break;
      case "-":
      case "_":
        zoomBy(1 / STEP);
        break;
      case "0":
        reset();
        break;
      case "ArrowLeft":
        if (zoomed) pan(KEY_PAN, 0);
        else if (onPage) onPage(1);
        else return;
        break;
      case "ArrowRight":
        if (zoomed) pan(-KEY_PAN, 0);
        else if (onPage) onPage(-1);
        else return;
        break;
      case "ArrowUp":
        if (!zoomed) return;
        pan(0, KEY_PAN);
        break;
      case "ArrowDown":
        if (!zoomed) return;
        pan(0, -KEY_PAN);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  /** نقشهٔ کوچک: لمس/کشیدن ⇒ همان نقطه وسط صحنه. */
  const mapTo = (e: PointerEvent<HTMLDivElement>, animate: boolean) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const w = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const { stage, fit } = measure();
    apply(centerOn(g.current.view, u, w, stage, fit), animate);
  };

  return (
    <div
      ref={stageRef}
      className="ud-gallery__stage ud-zoom"
      role="group"
      aria-roledescription="نمای قابل بزرگ‌نمایی"
      aria-label={alt}
      aria-describedby={hint}
      tabIndex={0}
      data-zoomed="false"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <img
        ref={imgRef}
        className="ud-zoom__img"
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        decoding="async"
        onError={onError}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          g.current.ratio = w > 0 && h > 0 ? w / h : 0;
          if (mapRef.current && g.current.ratio) mapRef.current.style.aspectRatio = String(g.current.ratio);
          const { stage, fit } = measure();
          apply(clampView(g.current.view, stage, fit), false);
        }}
      />
      <div
        ref={mapRef}
        className="ud-zoom__map"
        aria-hidden="true"
        onPointerDown={(e) => {
          e.stopPropagation();
          stopInertia();
          e.currentTarget.setPointerCapture(e.pointerId);
          g.current.mapDrag = true;
          mapTo(e, true);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (g.current.mapDrag) mapTo(e, false);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          g.current.mapDrag = false;
        }}
        onPointerCancel={(e) => {
          e.stopPropagation();
          g.current.mapDrag = false;
        }}
      >
        <img src={src} alt="" draggable={false} />
        <span ref={frameRef} className="ud-zoom__frame" />
      </div>
    </div>
  );
}
