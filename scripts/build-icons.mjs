// assets/icons/*.svg ⇒ src/shared/ui/icons.sprite.svg (اسپرایت <symbol> با نام هش‌دار ⇒ کش دائمی، صفر بایت JS)
// assets/building.svg ⇒ src/widgets/hero/building.generated.ts (نشانه‌گذاری بهینهٔ درون‌خطی)
// assets/mark.svg ⇒ src/shared/ui/mark.generated.ts
// ‎--check: فقط مقایسه (CI).
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { optimize } from "svgo";

const root = new URL("..", import.meta.url);
const check = process.argv.includes("--check");
const outputs = new Map();

const keep = {
  name: "preset-default",
  params: {
    overrides: {
      cleanupIds: false,
      removeHiddenElems: false, // لایه‌های room-wash عمداً نامرئی‌اند و با CSS رنگ می‌گیرند
      removeUnknownsAndDefaults: { keepDataAttrs: true, keepRoleAttr: true, keepAriaAttrs: true },
      inlineStyles: false,
      minifyStyles: false,
      mergePaths: false,
      collapseGroups: false,
      moveGroupAttrsToElems: false,
    },
  },
};

// ── اسپرایت آیکون‌ها ──
const dir = new URL("assets/icons/", root);
const names = readdirSync(dir)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.slice(0, -4))
  .sort();
const symbols = names.map((name) => {
  const svg = optimize(readFileSync(new URL(`${name}.svg`, dir), "utf8"), {
    multipass: true,
    plugins: [keep, "removeXMLNS"],
  }).data;
  const attrs = /<svg([^>]*)>/.exec(svg)[1];
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const pick = (a) => (new RegExp(`${a}="([^"]*)"`).exec(attrs) ?? [])[1];
  const presentation = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"]
    .map((a) => (pick(a) ? ` ${a}="${pick(a)}"` : ""))
    .join("");
  return `<symbol id="${name}" viewBox="${pick("viewBox") ?? "0 0 24 24"}"${presentation}>${inner}</symbol>`;
});
outputs.set(
  "src/shared/ui/icons.sprite.svg",
  `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`,
);
outputs.set(
  "src/shared/ui/icon-names.ts",
  `// ⚠ تولید خودکار با scripts/build-icons.mjs — دستی ویرایش نکنید.\nexport const ICON_NAMES = ${JSON.stringify(names)} as const;\nexport type IconName = (typeof ICON_NAMES)[number];\n`,
);

// ── ساختمان و نشان ──
const inline = (file, exportName, out, transform = (s) => s) => {
  const svg = optimize(readFileSync(new URL(file, root), "utf8"), {
    multipass: true,
    floatPrecision: 1,
    plugins: [keep, "removeXMLNS", { name: "removeTitle" }],
  }).data;
  outputs.set(
    out,
    `// ⚠ تولید خودکار از ${file} با scripts/build-icons.mjs — دستی ویرایش نکنید.\nexport const ${exportName} = ${JSON.stringify(transform(svg))};\n`,
  );
};
// عنوان‌های <title> برچسب پویا (aria-label) جایشان را می‌گیرند؛ ویژگی‌های فرمان‌پذیری را
// اسکریپت سمت کاربر پس از دریافت وضعیت تنظیم می‌کند.
inline("assets/building.svg", "BUILDING_SVG", "src/widgets/hero/building.generated.ts", (s) =>
  s.replace('<svg class="building-svg"', '<svg class="building-svg" focusable="false"'),
);
inline("assets/mark.svg", "MARK_SVG", "src/shared/ui/mark.generated.ts", (s) =>
  s.replace(/<svg /, '<svg focusable="false" '),
);
inline("assets/shrine.svg", "SHRINE_SVG", "src/shared/ui/shrine.generated.ts", (s) =>
  s.replace(/<svg /, '<svg focusable="false" '),
);

let stale = false;
for (const [rel, content] of outputs) {
  const url = new URL(rel, root);
  if (check) {
    if (!existsSync(url) || readFileSync(url, "utf8") !== content) {
      console.error(`کهنه است: ${rel} — pnpm gen`);
      stale = true;
    }
  } else writeFileSync(url, content);
}
if (stale) process.exit(1);
