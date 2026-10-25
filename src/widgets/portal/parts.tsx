"use client";
import { useState, type ReactNode } from "react";
import type { ReservationStatus } from "@/shared/api/schemas";
import { faDigits } from "@/shared/lib/fa";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { parsePlate } from "@/widgets/booking/model";
import { STATUS_TONE } from "./model";

/** سرتیتر بخش با نوار طلایی کناری (طراح: «سابقهٔ اقامت‌های پیشین…») و توضیح کناری. */
export function SectionHead({
  id,
  title,
  aside,
  icon,
}: {
  id: string;
  title: ReactNode;
  aside?: ReactNode;
  icon?: IconName;
}) {
  return (
    <header className="pt-head">
      <h2 id={id}>
        {icon ? <Icon name={icon} size={22} /> : null}
        {title}
      </h2>
      {aside ? <p>{aside}</p> : null}
    </header>
  );
}

export function StatusPill({ status, label }: { status: ReservationStatus | undefined; label: string }) {
  return (
    <span className="pt-pill" data-tone={STATUS_TONE[status ?? "confirmed"]}>
      {label}
    </span>
  );
}

/** کپی امن (HTTPS ⇒ ‎Clipboard API‎؛ وگرنه ‎execCommand‎) با بازخورد «کپی شد». */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && "clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ادامه با روش جایگزین */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "sr-only";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className ?? "pt-copy"}
      data-done={done || undefined}
      aria-label={`${done ? "کپی شد" : "کپی"} ${label}`}
      onClick={() => {
        void copyText(text).then((ok) => {
          if (!ok) {
            toast("کپی ممکن نشد؛ کد را دستی یادداشت کنید.", "warn");
            return;
          }
          setDone(true);
          toast(`${label} کپی شد.`, "success");
          setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      <Icon name={done ? "check" : "copy"} size={16} />
      <span aria-hidden="true">{done ? "کپی شد" : "کپی"}</span>
    </button>
  );
}

/** نمایش پلاک ثبت‌شده: قالب ایرانی ⇒ پلاک واقعی چپ‌به‌راست؛ قالب آزاد ⇒ برچسب ساده. */
export function PlateBadge({ text }: { text: string }) {
  const p = parsePlate(text);
  if (!p) {
    return (
      <bdi className="pt-plate pt-plate--free" dir="auto">
        {text}
      </bdi>
    );
  }
  return (
    <span className="pt-plate" dir="ltr" role="img" aria-label={`پلاک ${text}`}>
      <span className="pt-plate__flag" aria-hidden="true">
        <i />
        <b>I.R.</b>
        <b>IRAN</b>
      </span>
      {/* سه خانهٔ جدا (فلکس چپ‌به‌راست) ⇒ الگوریتم دوسویه رقم‌ها و حرف را جابه‌جا نمی‌کند */}
      <span className="pt-plate__main" aria-hidden="true">
        <b>{faDigits(p.two)}</b>
        <b>{p.letter}</b>
        <b>{faDigits(p.three)}</b>
      </span>
      <span className="pt-plate__region" aria-hidden="true">
        <small>ایران</small>
        {faDigits(p.region)}
      </span>
    </span>
  );
}

/** «۰۴:۲۱» از میلی‌ثانیه (منفی ⇒ صفر). */
/** خطای بارگذاری از سرور/شبکه — هرگز به‌جای «داده‌ای نیست» یا «وارد شوید» (گمراه‌کننده). */
export function LoadError({
  title,
  text,
  onRetry,
  busy,
}: {
  title: string;
  text: string;
  onRetry: () => void;
  busy: boolean;
}) {
  return (
    <article className="pt-stay pt-stay--empty pt-stay--error" role="alert" aria-busy={busy}>
      <span className="pt-stay__art" aria-hidden="true">
        <Icon name="cloud-off" size={28} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="pt-stay__cta">
        <button type="button" className="btn btn-primary btn-lg" onClick={onRetry} disabled={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="refresh" size={18} />} تلاش دوباره
        </button>
      </div>
    </article>
  );
}

export function mmss(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return faDigits(h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`);
}
