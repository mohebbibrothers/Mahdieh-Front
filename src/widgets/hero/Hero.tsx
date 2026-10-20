import { Icon } from "@/shared/ui/Icon";
import { BuildingModel } from "./BuildingModel";
import { BUILDING_SVG } from "./building.generated";
import { HeroMeta } from "./HeroMeta";
import { HeroAbout } from "./HeroAbout";

/**
 * قهرمان صفحه: متن ایستا (LCP سریع، بی‌نیاز به JS) + ساختمان تعاملی.
 * SVG ساختمان در سرور (زمان ساخت) رندر و به‌صورت children به جزیرهٔ کلاینت داده می‌شود ⇒
 * در بستهٔ JS نمی‌آید؛ کلاینت فقط ویژگی‌های data-* و برچسب‌ها را به‌روز می‌کند.
 */
export function Hero() {
  return (
    <div className="hero-shell">
      <section className="container hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow__rule" aria-hidden="true" />
            زائرسرای مهدیه، مشهد مقدس
          </p>
          <h1 id="hero-title" className="hero-title">
            <span className="hero-title__line">سفری برای دل؛</span>
            <span className="hero-title__emphasis">اقامتی با آرامش.</span>
          </h1>
          <p className="hero-description">
            برای زیارت بیایید، برای اقامت آسوده باشید. در مهدیه مهمان ما هستید؛ اقامت رایگان زائران امام رضا (ع)، در
            خانه‌ای سه‌طبقه با پنج واحد اقامتی.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href="#quick-search">
              اقامتتان را پیدا کنید
              <Icon name="arrow-left" size={18} />
            </a>
            <HeroAbout />
          </div>
          <p className="hero-reassurance">
            <Icon name="heart-hand" size={18} />
            بدون پرداخت؛ با احترام به آرامش و حریم خصوصی شما
          </p>
          <HeroMeta />
        </div>
        <BuildingModel>
          <div className="building-svg-host" dangerouslySetInnerHTML={{ __html: BUILDING_SVG }} />
        </BuildingModel>
      </section>
    </div>
  );
}
