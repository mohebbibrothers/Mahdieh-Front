import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

/** قواعد معماری (REACT-07): لایه‌ها فقط به پایین‌تر از خود وابسته‌اند. */
const layers = ["app", "widgets", "features", "entities", "shared"];
const layerRules = layers.slice(1).map((layer, index) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: layers.slice(0, index + 1).map((upper) => ({
          group: [`@/${upper}/*`, `@/${upper}`],
          message: `لایهٔ «${layer}» نباید به لایهٔ بالاتر «${upper}» وابسته باشد.`,
        })),
      },
    ],
  },
}));

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "src/shared/api/schema.d.ts",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      // CSP بدون unsafe-inline: هیچ style= در JSX (ویژگی‌های پویا با data-* و متغیر CSS از راه کلاس).
      "react/forbid-dom-props": [
        "error",
        { forbid: [{ propName: "style", message: "CSP: به‌جای style از کلاس/data-* استفاده کنید." }] },
      ],
      "react/forbid-component-props": ["error", { forbid: [{ propName: "style", message: "CSP: style ممنوع است." }] }],
      // next/image روی <img> خروجی style="color:transparent" می‌گذارد (نقض CSP) و در خروجی ایستا بهینه‌سازی هم ندارد ⇒ <img> با width/height صریح.
      "@next/next/no-img-element": "off",
    },
  },
  ...layerRules,
  {
    files: ["scripts/**/*.mjs", "*.config.{mjs,ts}", "e2e/**/*.ts"],
    rules: { "no-console": "off" },
  },
  {
    // fixtureهای Playwright پارامتر «use» دارند؛ ربطی به Hookهای React ندارد.
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
);
