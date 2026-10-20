import { MARK_SVG } from "./mark.generated";
import { cx } from "@/shared/lib/cx";

/** نشان مهدیه (currentColor + ‎--mark-accent‎). */
export function Mark({ className }: { className?: string }) {
  return <span className={cx("brand-mark", className)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: MARK_SVG }} />;
}
