"use client";
import { useEffect, useState } from "react";

/**
 * مقدار با تأخیر. مقایسه محتوایی است (کلید JSON)، نه با هویت شیء: شیءِ تازهٔ هر رندر نباید زمان‌سنج را
 * از نو بچیند یا پس از رسیدن، رندر بی‌پایان بسازد.
 */
export function useDebounced<T>(value: T, ms: number): T {
  const key = JSON.stringify(value);
  const [v, setV] = useState<{ key: string; value: T }>({ key, value });
  useEffect(() => {
    if (key === v.key) return;
    const t = setTimeout(() => setV({ key, value: JSON.parse(key) as T }), ms);
    return () => clearTimeout(t);
  }, [key, ms, v.key]);
  return v.value;
}
