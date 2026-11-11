import type { DeskRow, DeskUnit } from "@/shared/api/desk";

/** یگانه حالت پنجره‌های پیشخوان — در هر لحظه حداکثر یک پنجره (بی پشته‌شدن مودال‌ها). */
export type DeskDialog =
  | { kind: "checkout"; row: DeskRow; unit: DeskUnit | null }
  | { kind: "housekeeping"; unit: DeskUnit }
  | { kind: "complete"; unit: DeskUnit }
  | { kind: "block"; unit: DeskUnit }
  | { kind: "unblock"; unit: DeskUnit }
  | { kind: "noshow"; row: DeskRow }
  | { kind: "cancel"; row: DeskRow }
  | { kind: "note"; row: DeskRow }
  | { kind: "move"; row: DeskRow }
  | { kind: "dossier"; row: DeskRow }
  | { kind: "waitlist" }
  | { kind: "export" }
  | { kind: "create"; unit: string | null }
  | { kind: "sop" }
  | { kind: "recovery" };

export type OpenDialog = (d: DeskDialog) => void;
