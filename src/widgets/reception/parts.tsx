"use client";
import type { ReactNode } from "react";
import type { DeskRow, KeyLocation } from "@/shared/api/desk";
import { cx } from "@/shared/lib/cx";
import { Icon, type IconName } from "@/shared/ui/Icon";
import { KEY_SHORT, KEY_TONE, LANE_TONE, type Tone } from "./model";

export function Pill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: IconName }) {
  return (
    <span className="rc-pill" data-tone={tone}>
      {icon ? <Icon name={icon} size={14} /> : <span className="rc-pill__dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export function LanePill({ row }: { row: DeskRow }) {
  return <Pill tone={LANE_TONE[row.desk.lane]}>{row.desk.lane_label}</Pill>;
}

export function KeySlot({
  code,
  location,
  title,
  onClick,
}: {
  code: string;
  location: KeyLocation;
  title: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <bdi className="rc-slot__code latin">{code}</bdi>
      <span className="rc-slot__tag">
        {KEY_SHORT[location]}
        {location === "cabinet" ? (
          <span className="rc-slot__tick" aria-hidden="true">
            {" ✓"}
          </span>
        ) : null}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className="rc-slot" data-key={KEY_TONE[location]} onClick={onClick} title={title}>
      {body}
      <span className="sr-only">{title}</span>
    </button>
  ) : (
    <span className="rc-slot" data-key={KEY_TONE[location]} title={title}>
      {body}
    </span>
  );
}

export function UnitBadge({ code, size = "md" }: { code: string; size?: "sm" | "md" | "lg" }) {
  return (
    <bdi className={cx("rc-badge latin", `rc-badge--${size}`)} dir="ltr">
      {code}
    </bdi>
  );
}

/** ردیف «برچسب: مقدار» درون کارت‌ها و پرونده‌ها. */
export function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cx("rc-info", wide && "rc-info--wide")}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Latin({ children }: { children: ReactNode }) {
  return (
    <bdi className="latin" dir="ltr">
      {children}
    </bdi>
  );
}

export function SectionHead({
  eyebrow,
  title,
  id,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  id: string;
  aside?: ReactNode;
}) {
  return (
    <div className="rc-head">
      <div>
        <p className="rc-eyebrow">{eyebrow}</p>
        <h2 className="rc-title" id={id}>
          {title}
        </h2>
      </div>
      {aside ? <div className="rc-head__aside">{aside}</div> : null}
    </div>
  );
}

/** متن «اطلاعیه» درون پنجره‌ها (زمینهٔ رنگی بر پایهٔ لحن). */
export function Notice({ tone, icon, children }: { tone: Tone; icon: IconName; children: ReactNode }) {
  return (
    <div className="rc-notice" data-tone={tone}>
      <Icon name={icon} size={18} />
      <div>{children}</div>
    </div>
  );
}
