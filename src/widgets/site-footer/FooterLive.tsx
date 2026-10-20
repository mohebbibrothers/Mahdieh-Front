"use client";
import { useQuery } from "@tanstack/react-query";
import { configQuery } from "@/shared/api/queries";
import { faDigits, formatYear, tehranToday } from "@/shared/lib/fa";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { Icon } from "@/shared/ui/Icon";

/** نشانی و تلفن پذیرش از تنظیمات زندهٔ سایت (بدون نشانی/مسافت ساختگی). */
export function FooterContact() {
  const config = useQuery(configQuery);
  const site = config.data?.site;
  return (
    <>
      <p className="footer-location">
        <Icon name="map-pin" size={18} />
        <span>{site?.support_address || "مشهد، خراسان رضوی"}</span>
      </p>
      {site?.support_phone ? (
        <p className="footer-location">
          <Icon name="phone" size={18} />
          <a href={`tel:${site.support_phone}`} dir="ltr">
            <bdi>{faDigits(site.support_phone)}</bdi>
          </a>
        </p>
      ) : (
        <p className="footer-location contact-note">تلفن پذیرش پس از صدور رزرو در گواهی اقامت درج می‌شود.</p>
      )}
    </>
  );
}

export function FooterYear() {
  const hydrated = useHydrated();
  return <>{hydrated ? formatYear(tehranToday()) : "۱۴۰۵"}</>;
}
