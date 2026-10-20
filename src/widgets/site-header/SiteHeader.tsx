import { AccountButton } from "@/features/session/AccountButton";
import { EasyToggle } from "@/features/easy-mode/EasyToggle";
import { ThemeMenu } from "@/features/theme/ThemeMenu";
import { SITE } from "@/shared/config/site";
import { Mark } from "@/shared/ui/Mark";
import { MobileMenu } from "./MobileMenu";
import { NAV } from "@/shared/config/nav";

export function SiteHeader({ current = "/" }: { current?: string }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand-lockup" href={SITE.routes.home} aria-label={`${SITE.name} — صفحهٔ نخست`}>
          <Mark />
          <span className="brand-words">
            <span className="brand-type">{SITE.name}</span>
            <span className="brand-sub">{SITE.tagline}</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="ناوبری اصلی">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === current ? "page" : undefined}>
              <span className="nav-full">{item.label}</span>
              <span className="nav-short" aria-hidden="true">
                {item.short}
              </span>
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <AccountButton />
          <EasyToggle />
          <ThemeMenu />
          <MobileMenu current={current} />
        </div>
      </div>
    </header>
  );
}
