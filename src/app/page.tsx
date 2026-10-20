import { SessionLayer } from "@/features/session/SessionLayer";
import { AccountBanners, OccasionBanner, OfflineBanner } from "@/widgets/banners/Banners";
import { Farewell } from "@/widgets/farewell/Farewell";
import { Guidance } from "@/widgets/guidance/Guidance";
import { Hero } from "@/widgets/hero/Hero";
import { HowItWorks } from "@/widgets/how-it-works/HowItWorks";
import { MobileDock } from "@/widgets/mobile-dock/MobileDock";
import { QuickSearch } from "@/widgets/quick-search/QuickSearch";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import { UnitDialog } from "@/widgets/unit-dialog/UnitDialog";
import { UnitRail } from "@/widgets/unit-rail/UnitRail";
import { WeekCalendar } from "@/widgets/week-calendar/WeekCalendar";

/** P-01 صفحهٔ نخست. */
export default function HomePage() {
  return (
    <>
      <SiteHeader current="/" />
      <OfflineBanner />
      <AccountBanners />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <QuickSearch />
        <OccasionBanner />
        <WeekCalendar />
        <UnitRail />
        <HowItWorks />
        <Guidance />
        <Farewell />
      </main>
      <SiteFooter />
      <MobileDock />
      <UnitDialog />
      <SessionLayer />
    </>
  );
}
