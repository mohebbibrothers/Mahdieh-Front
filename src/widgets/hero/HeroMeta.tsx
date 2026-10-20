"use client";
import { useQuery } from "@tanstack/react-query";
import { propertyQuery } from "@/shared/api/queries";
import { faDigits } from "@/shared/lib/fa";

/** شمارش‌ها از ‎/property‎ (مقدار ایستای اولیه = ساختمان فعلی، بدون پرش چیدمان). */
export function HeroMeta() {
  const property = useQuery(propertyQuery);
  const units = property.data?.flatMap((f) => f.units) ?? [];
  const floors = property.data ? property.data.length : 3;
  const suites = property.data ? units.filter((u) => u.unit_type === "suite").length : 2;
  const rooms = property.data ? units.filter((u) => u.unit_type === "large_room").length : 3;
  return (
    <dl className="hero-meta">
      <div>
        <dt>طبقه</dt>
        <dd>{faDigits(floors)}</dd>
      </div>
      <div>
        <dt>سوئیت</dt>
        <dd>{faDigits(suites)}</dd>
      </div>
      <div>
        <dt>اتاق بزرگ</dt>
        <dd>{faDigits(rooms)}</dd>
      </div>
    </dl>
  );
}
