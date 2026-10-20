// openapi/mahdieh.yaml (طرح بک‌اند، drf-spectacular) ⇒ src/shared/api/schema.d.ts
// به‌روزرسانی طرح: از مخزن بک‌اند «manage.py spectacular --file» و کپی در openapi/.
import openapiTS, { astToString } from "openapi-typescript";
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("../openapi/mahdieh.yaml", import.meta.url);
const out = new URL("../src/shared/api/schema.d.ts", import.meta.url);
const ast = await openapiTS(src, { exportType: true, enum: false, alphabetize: true });
const code = `// ⚠ تولید خودکار از openapi/mahdieh.yaml با scripts/gen-api.mjs — دستی ویرایش نکنید.\n${astToString(ast)}`;
if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== code) {
    console.error("schema.d.ts کهنه است: pnpm gen");
    process.exit(1);
  }
} else writeFileSync(out, code);
