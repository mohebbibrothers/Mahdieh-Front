"use client";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { setEasyMode, useEasyMode } from "./easy-mode";

export function EasyToggle() {
  const on = useEasyMode();
  return (
    <button
      type="button"
      className="icon-button easy-toggle"
      aria-pressed={on}
      aria-label="حالت آسان: نوشته‌های بزرگ‌تر و نمای ساده"
      title="حالت آسان: نوشته‌های بزرگ‌تر و نمای ساده"
      onClick={() => {
        setEasyMode(!on);
        toast(on ? "حالت آسان خاموش شد." : "حالت آسان روشن شد؛ نوشته‌ها بزرگ‌تر و نما ساده‌تر است.", "success");
      }}
    >
      <Icon name="accessibility" size={20} />
    </button>
  );
}
