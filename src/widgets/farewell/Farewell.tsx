import { Icon } from "@/shared/ui/Icon";
import { SHRINE_SVG } from "@/shared/ui/shrine.generated";

export function Farewell() {
  return (
    <section className="page-shell farewell reveal" aria-labelledby="farewell-title">
      <div className="farewell__art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SHRINE_SVG }} />
      <div>
        <h2 id="farewell-title">نیت، زیارت؛ خیال، آسوده.</h2>
        <p>هر وقت آمادهٔ سفر بودید، از پیدا کردن زمان مناسب شروع کنید.</p>
      </div>
      <a className="btn btn-on-brand" href="#quick-search">
        انتخاب زمان اقامت <Icon name="arrow-left" size={18} />
      </a>
    </section>
  );
}
