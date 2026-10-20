import { AccountButton } from "@/features/session/AccountButton";
import { AccountDialog } from "@/features/session/AccountDialog";
import { EasyToggle } from "@/features/easy-mode/EasyToggle";
import { ThemeMenu } from "@/features/theme/ThemeMenu";
import { SITE } from "@/shared/config/site";
import { Mark } from "@/shared/ui/Mark";
import { MobileMenu } from "./MobileMenu";
import { NAV } from "@/shared/config/nav";

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="site-header">
      <div className="page-shell header-inner">
        <a className="brand-lockup" href={SITE.routes.home} aria-label={`${SITE.name}، ${SITE.tagline} — صفحهٔ نخست`}>
          <Mark />
          <span className="brand-words">
            <span className="brand-type">{SITE.name}</span>
            <span className="brand-sub">{SITE.tagline}</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="ناوبری اصلی">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <AccountButton />
          <ThemeMenu />
          <EasyToggle />
          <MobileMenu current={current} />
        </div>
      </div>
      <AccountDialog />
    </header>
  );
}
