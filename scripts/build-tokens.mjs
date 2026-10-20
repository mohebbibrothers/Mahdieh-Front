// توکن‌های DTCG ⇒ CSS (‎:root روشن، [data-theme=dark] تیره، fallback بدون JS با prefers-color-scheme).
// رنگ‌ها به OKLCH تبدیل می‌شوند (DS-03). ‎--check: فقط مقایسه، برای CI.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = new URL("../tokens/mahdieh.tokens.json", import.meta.url);
const OUT = new URL("../src/shared/styles/tokens.css", import.meta.url);

export function hexToOklch(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`رنگ نامعتبر: ${hex}`);
  const n = parseInt(m[1], 16);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => lin(c / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  const alpha = m[2] ? parseInt(m[2], 16) / 255 : 1;
  const fmt = (v, d) => Number(v.toFixed(d)).toString();
  const body = `${fmt(L * 100, 2)}% ${fmt(C, 4)} ${C < 0.0005 ? 0 : fmt(H, 2)}`;
  return alpha < 1 ? `oklch(${body} / ${fmt(alpha, 3)})` : `oklch(${body})`;
}

export function render(tokens) {
  const vars = (group) =>
    Object.entries(group)
      .map(([k, v]) => `  --c-${k}: ${hexToOklch(v.$value)};`)
      .join("\n");
  const { light, dark } = tokens.color;
  const names = Object.keys(light);
  const missing = names.filter((k) => !(k in dark));
  if (missing.length) throw new Error(`رنگ تیره ندارد: ${missing.join(", ")}`);
  const dims = (prefix, group) =>
    Object.entries(group)
      .filter(([k]) => !k.startsWith("$"))
      .map(([k, v]) => `  --${prefix}-${k}: ${v.$value};`)
      .join("\n");
  const ease = (v) => `cubic-bezier(${v.$value.join(", ")})`;
  const m = tokens.motion;
  return `/* ⚠ تولید خودکار از tokens/mahdieh.tokens.json با scripts/build-tokens.mjs — دستی ویرایش نکنید. */
:root {
  color-scheme: light;
${vars(light)}
}
:root[data-theme="dark"] {
  color-scheme: dark;
${vars(dark)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
${vars(dark).replaceAll("\n  ", "\n    ").replace(/^ {2}/, "    ")}
  }
}
@theme inline {
${names.map((k) => `  --color-${k}: var(--c-${k});`).join("\n")}
${dims("text", tokens.font.size)}
${dims("radius", tokens.radius)}
  --font-sans: ${tokens.font.family.sans.$value.join(", ")};
  --ease-out: ${ease(m.easing.out)};
  --ease-spring: ${ease(m.easing.spring)};
  --duration-fast: ${m.duration.fast.$value};
  --duration-base: ${m.duration.base.$value};
  --duration-slow: ${m.duration.slow.$value};
  --container-site: ${tokens.layout.container.$value};
  --spacing-gutter: ${tokens.layout.gutter.$value};
  --spacing-header: ${tokens.layout.header.$value};
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const css = render(JSON.parse(readFileSync(SRC, "utf8")));
  if (process.argv.includes("--check")) {
    if (readFileSync(OUT, "utf8") !== css) {
      console.error("tokens.css با منبع توکن‌ها هم‌خوان نیست: pnpm gen");
      process.exit(1);
    }
  } else writeFileSync(OUT, css);
}
