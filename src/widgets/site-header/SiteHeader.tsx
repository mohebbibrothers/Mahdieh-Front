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
              {/* طراح: ۹۰۱–۱۲۰۰ برچسب کوتاه در یک خط؛ دیگری با display:none از درخت دسترسی هم بیرون است. */}
              <span className="nav-label">{item.label}</span>
              <span className="nav-label-short">{item.short}</span>
            </a>
          ))}
        </nav>
        {/* ترتیب DOM = ترتیب دیداری راست‌به‌چپ = ترتیب Tab: ابزارهای نمایش، سپس حساب در لبهٔ چپ
            (≤۹۰۰ حساب پنهان است و دکمهٔ فهرست همان لبه را می‌گیرد). بدون CSS order تا ترتیب
            کانونی صفحه‌کلید با چشم یکی بماند. */}
        <div className="nav-actions">
          <EasyToggle />
          <ThemeMenu />
          <AccountButton />
          <MobileMenu current={current} />
        </div>
      </div>
      <AccountDialog />
    </header>
  );
}
