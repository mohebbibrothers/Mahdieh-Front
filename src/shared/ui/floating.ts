"use client";
import { type RefObject, useLayoutEffect, useRef } from "react";

const EDGE = 12;
const GAP = 8;
/** کمینهٔ ارتفاع سودمند؛ کمتر از این ⇒ سمت دیگر (بالا/پایین) را می‌آزماییم. */
const COMFORT = 200;
/** ارتفاع کمینهٔ پنجره حتی در تنگ‌ترین حالت (بیش از این، بُرش ناحیهٔ امن کار را تمام می‌کند). */
const FLOOR = 120;

export type FloatAlign = "start" | "center" | "stretch";

export type FloatOptions = {
  /** «start» = لبهٔ راست هم‌تراز (راست‌به‌چپ)؛ «center» = میان کنترل؛ «stretch» = هم‌پهنای کنترل */
  align?: FloatAlign | undefined;
  /** کمینهٔ پهنا در حالت stretch (فهرست‌های باریکِ نوار ابزار گوشی/تبلت) */
  minWidth?: number | undefined;
  /** سقف ارتفاع */
  max?: number | undefined;
  /** رسانه‌ای که در آن پنجره «برگهٔ پایینی» است و جای‌گذاری را به CSS می‌سپارد (مثلاً ‎(max-width: 620px)‎) */
  sheet?: string | null | undefined;
  /** کنترل زیر سرصفحه/نوار پایین رفت یا از صفحه بیرون شد ⇒ بستن (رفتار فهرست بومی سیستم‌عامل) */
  onHidden?: (() => void) | undefined;
  /** تغییر محتوا (مثلاً شمار نتایج جست‌وجو) ⇒ جای‌گذاری دوباره */
  dep?: unknown;
};

type Area = { top: number; bottom: number; vw: number; vh: number };

/**
 * «ناحیهٔ امن» دید: میان پایین‌ترین نوار چسبان بالا (سرصفحه) و بالاترین نوار ثابت پایین (نوار میان‌بُر
 * گوشی، نوار دعوت، کشوی انتخاب تقویم). هر عنصری با ‎data-float-guard‎ در این حساب می‌آید؛ نواری که خود
 * کنترل درونش است (منوی تم در سرصفحه) و کنترل‌های درون پنجرهٔ مودال (که روی همه‌چیز است) مستثنا هستند.
 */
export function safeArea(anchor: Element): Area {
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = document.documentElement.clientWidth;
  let top = 0;
  let bottom = vh;
  if (!anchor.closest("dialog[open]")) {
    for (const g of document.querySelectorAll<HTMLElement>("[data-float-guard]")) {
      if (g.contains(anchor)) continue;
      const r = g.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || getComputedStyle(g).visibility === "hidden") continue;
      if (r.top < vh / 2) top = Math.max(top, r.bottom);
      else bottom = Math.min(bottom, r.top);
    }
  }
  return { top, bottom, vw, vh };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * جای‌گذاری یک پنجرهٔ شناورِ «لایهٔ بالایی» کنار کنترل، درون ناحیهٔ امن. اگر پایین جا نباشد رو به بالا
 * باز می‌شود؛ ارتفاع به فضای واقعی محدود می‌شود و هر تکه‌ای که باز هم به نوارها برسد بُرش می‌خورد (هرگز
 * روی سرصفحه یا نوار پایین نمی‌رود). خروجی «hidden» یعنی کنترل دیگر دیده نمی‌شود.
 */
export function placeFloat(
  anchor: Element,
  el: HTMLElement,
  o: FloatOptions & { cssMax?: number } = {},
): "top" | "bottom" | "hidden" {
  const a = safeArea(anchor);
  const r = anchor.getBoundingClientRect();
  if (r.bottom <= a.top + 4 || r.top >= a.bottom - 4 || r.right <= 0 || r.left >= a.vw) return "hidden";
  const s = el.style;
  const align = o.align ?? "start";
  const room = a.vw - EDGE * 2;

  if (align === "stretch") s.width = `${Math.round(Math.min(room, Math.max(r.width, o.minWidth ?? 0)))}px`;
  const w = Math.min(el.offsetWidth, room);
  const left = clamp(align === "center" ? r.left + r.width / 2 - w / 2 : r.right - w, EDGE, a.vw - EDGE - w);

  const below = a.bottom - r.bottom - GAP - EDGE;
  const above = r.top - a.top - GAP - EDGE;
  const cssMax = o.cssMax ?? Infinity;
  // scrollHeight = بلندی کامل محتوا حتی وقتی سقف ارتفاع خورده (بی دست‌کاری سقف ⇒ پیمایش درونی نمی‌پرد)
  // پوستهٔ دارای پیمایشگر درونی (‎data-float-scroll‎) ⇒ بخش پنهانِ پیمایشگر هم به بلندی دلخواه افزوده می‌شود.
  const inner = el.querySelector<HTMLElement>("[data-float-scroll]");
  const hidden = inner ? inner.scrollHeight - inner.clientHeight : 0;
  const want = Math.min(el.scrollHeight + hidden, o.max ?? Infinity, cssMax);
  // سمتی که کل پنجره در آن جا شود (اول پایین)؛ وگرنه سمت بزرگ‌تر — مگر پایین دست‌کم جای «راحت» داشته باشد.
  const up = below >= want ? false : above >= want ? true : below < COMFORT && above > below;
  const maxH = Math.max(FLOOR, Math.min(o.max ?? Infinity, cssMax, up ? above : below));
  const h = Math.min(want, maxH);
  const top = up ? r.top - GAP - h : r.bottom + GAP;

  s.left = `${Math.round(left)}px`;
  s.top = `${Math.round(top)}px`;
  s.right = "auto";
  s.bottom = "auto";
  s.maxHeight = `${Math.round(maxH)}px`;
  const clipTop = Math.max(0, a.top - top);
  const clipBottom = Math.max(0, top + h - a.bottom);
  s.clipPath = clipTop || clipBottom ? `inset(${Math.ceil(clipTop)}px 0 ${Math.ceil(clipBottom)}px 0)` : "";
  el.dataset.side = up ? "top" : "bottom";
  return up ? "top" : "bottom";
}

/** نزدیک‌ترین نیای پیمایش‌پذیر عمودی (بدنهٔ پنجرهٔ مودال، …)؛ نبود ⇒ خود صفحه. */
function scrollParent(node: Element): Element | null {
  for (let n = node.parentElement; n && n !== document.body; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

/**
 * «جا باز کردن» هنگام باز شدن: اگر پنجره زیر کنترل کامل جا نمی‌شود، صفحه (یا بدنهٔ مودال) همان‌قدر بالا
 * می‌رود که جا شود — به شرط آن‌که خود کنترل زیر سرصفحه نرود. لپ‌تاپ‌های کم‌ارتفاع (۱۳۶۶×۶۰۰) ⇒ تقویم کامل
 * زیر دکمه، نه بریده و نه روی منو.
 */
function makeRoom(anchor: Element, el: HTMLElement, cssMax: number, max: number | undefined) {
  const a = safeArea(anchor);
  const r = anchor.getBoundingClientRect();
  const inner = el.querySelector<HTMLElement>("[data-float-scroll]");
  const want = Math.min(
    el.scrollHeight + (inner ? inner.scrollHeight - inner.clientHeight : 0),
    max ?? Infinity,
    cssMax,
  );
  const below = a.bottom - r.bottom - GAP - EDGE;
  if (below >= want) return;
  const room = r.top - a.top - GAP * 2;
  const shift = Math.min(want - below, room);
  if (shift <= 8) return;
  const sp = scrollParent(anchor);
  if (sp) sp.scrollBy({ top: shift, behavior: "instant" });
  else window.scrollBy({ top: shift, behavior: "instant" });
}

function clearFloat(el: HTMLElement) {
  const s = el.style;
  for (const p of ["left", "top", "right", "bottom", "width", "maxHeight", "clipPath"] as const) s[p] = "";
  delete el.dataset.side;
}

/**
 * هوک مشترک همهٔ پنجره‌های شناور سایت (فهرست‌های انتخاب، جست‌وجوی ملیت، تقویم و ساعت، منوی تم):
 * با پیمایش هر ظرفی، تغییر اندازه، صفحه‌کلید مجازی و تغییر محتوا همراه کنترل می‌ماند. CSSOM ⇒ سازگار با CSP.
 */
export function useFloating(
  open: boolean,
  anchorRef: RefObject<Element | null>,
  floatRef: RefObject<HTMLElement | null>,
  opts: FloatOptions = {},
) {
  const latest = useRef(opts);
  useLayoutEffect(() => {
    latest.current = opts;
  });
  const { align, minWidth, max, sheet, dep } = opts;
  useLayoutEffect(() => {
    const el = floatRef.current;
    if (!open || !el) return;
    let frame = 0;
    // سقف ارتفاعِ خود CSS (مثلاً ‎min(70dvh, 560px)‎) یک بار و پیش از سقف درون‌خطی خوانده می‌شود.
    el.style.maxHeight = "";
    const cssMax = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
    const run = () => {
      frame = 0;
      const anchor = anchorRef.current;
      if (!anchor || !el.isConnected) return;
      const isSheet = Boolean(sheet && window.matchMedia(sheet).matches);
      if (isSheet) {
        clearFloat(el);
        el.dataset.sheet = "";
        return;
      }
      delete el.dataset.sheet;
      const res = placeFloat(anchor, el, { align, minWidth, max, cssMax });
      if (res === "hidden") latest.current.onHidden?.();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    if (anchorRef.current && !(sheet && window.matchMedia(sheet).matches)) {
      makeRoom(anchorRef.current, el, cssMax, max);
    }
    run();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    // پیمایش درون خود پنجره (فهرست بلند) جای آن را عوض نمی‌کند.
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && el.contains(e.target)) return;
      run();
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [open, anchorRef, floatRef, align, minWidth, max, sheet, dep]);
}

/** باز/بسته کردن پنجرهٔ ‎popover="manual"‎ همگام با وضعیت React — پیش از ‎useFloating‎ صدا زده شود. */
export function useTopLayer(open: boolean, ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== "function") return;
    if (open && !el.matches(":popover-open")) el.showPopover();
    if (!open && el.matches(":popover-open")) el.hidePopover();
  }, [open, ref]);
}
