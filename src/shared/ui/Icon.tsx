import sprite from "./icons.sprite.svg";
import type { IconName } from "./icon-names";
import { cx } from "@/shared/lib/cx";

/** نشانی هش‌دار اسپرایت ⇒ کش دائمی؛ هر آیکون فقط یک ‎<use>‎ است (صفر بایت JS). */
const SPRITE = (sprite as { src: string }).src;

export type { IconName };

export function Icon({
  name,
  size = 20,
  className,
  label,
}: {
  name: IconName;
  size?: 14 | 16 | 18 | 20 | 22 | 24 | 28;
  className?: string;
  /** اگر آیکون معنا دارد و متن کنارش نیست. */
  label?: string;
}) {
  return (
    <svg
      className={cx("icon", className)}
      width={size}
      height={size}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      <use href={`${SPRITE}#${name}`} />
    </svg>
  );
}
