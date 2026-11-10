"use client";
import type { Help } from "@/shared/api/schemas";
import { Icon } from "@/shared/ui/Icon";
import { groupRules } from "./model";

/** «قواعد اقامت امروز» — جدول زندهٔ ‎rules‎ بک‌اند در سه گروه، با نسخهٔ چاپی مرتب همین صفحه. */
export function RulesBoard({ help }: { help: Help | undefined }) {
  const groups = help ? groupRules(help.rules) : [];
  return (
    <section className="hp-band hp-rules" id="rules-board" aria-labelledby="hp-rules-title">
      <div className="hp-shell">
        <header className="hp-lead">
          <span className="hp-lead__badge">
            <span className="hp-live" aria-hidden="true" />
            <span>
              به‌روز با سامانه{help ? " · " : ""}
              {help ? <bdi>{help.today}</bdi> : null}
            </span>
          </span>
          <h2 id="hp-rules-title" className="hp-lead__title">
            قواعد اقامت، همین امروز
          </h2>
          <p className="hp-lead__desc">
            {help?.note ?? "عددهای این تابلو مستقیم از تنظیمات زندهٔ سامانه خوانده می‌شوند."}
          </p>
        </header>
        <div className="hp-rules__grid" aria-busy={!help || undefined}>
          {help
            ? groups.map((g) => (
                <section key={g.title} className="hp-rules__group reveal" aria-label={g.title}>
                  <h3 className="hp-rules__group-title">
                    <Icon name={g.icon} size={18} />
                    <span>{g.title}</span>
                  </h3>
                  <dl className="hp-rules__list">
                    {g.rules.map((r) => (
                      <div key={r.key} className="hp-rule">
                        <dt>{r.label}</dt>
                        <dd>
                          <bdi>{r.value}</bdi>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            : [0, 1, 2].map((i) => <div key={i} className="hp-rules__group hp-skel" aria-hidden="true" />)}
        </div>
        <div className="hp-rules__actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Icon name="printer" size={18} />
            نسخهٔ چاپی راهنما
          </button>
          <p className="hp-rules__hint">
            برگی مرتب با همهٔ پرسش‌ها و پاسخ‌ها، قواعد امروز و راه‌های تماس — مناسب همراه داشتن در سفر.
          </p>
        </div>
      </div>
    </section>
  );
}
