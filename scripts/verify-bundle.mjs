#!/usr/bin/env node
/**
 * دروازهٔ پیش از انتشار: بسته را همان‌طور می‌سنجد که ‎front_deploy.sh‎ روی میزبان می‌سنجد،
 * به‌علاوهٔ ممیزی CSP خروجی — بستهٔ ناسالم هرگز به «edge» نمی‌رسد.
 *   ۱ sha256 بسته با ‎.sha256‎
 *   ۲ ساختار: یک پوشهٔ بالایی = شناسهٔ انتشار؛ بی‌مسیر مطلق/«..»؛ بی‌پیوند و پروندهٔ ویژه
 *   ۳ BUILD_INFO: app، release = نام پوشه، commit (و ‎--commit‎ اگر داده شد)، هش تک‌تک پرونده‌ها
 *      و هیچ پروندهٔ اضافه/گم‌شده
 *   ۴ routes.json: نسخهٔ ۱، صفحهٔ «/» و ۴۰۴ موجود
 *   ۵ CSP: هر <script>/<style> با nonce جانگهدار؛ صفر style=، صفر on*=، صفر نشانی بیرونی
 * استفاده: ‎node scripts/verify-bundle.mjs release/mahdieh-front.tar.gz [--commit SHA]‎
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tarball = path.resolve(process.argv[2] ?? "release/mahdieh-front.tar.gz");
const ci = process.argv.indexOf("--commit");
const expectCommit = ci > -1 ? process.argv[ci + 1] : undefined;
const errors = [];
const fail = (msg) => errors.push(msg);
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// ۱ اثرانگشت
const sumFile = `${tarball}.sha256`;
if (!existsSync(sumFile)) fail("پروندهٔ .sha256 نیست");
else {
  const [digest, name] = readFileSync(sumFile, "utf8").trim().split(/\s+/);
  if (name !== path.basename(tarball)) fail(`نام در .sha256 (${name}) با بسته نمی‌خواند`);
  if (digest !== sha256(readFileSync(tarball))) fail("sha256 بسته نمی‌خواند");
}

// ۲ ساختار (همان قواعد front_deploy.sh)
const listing = execFileSync("tar", ["-tvzf", tarball], { encoding: "utf8" }).trim().split("\n");
const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" }).trim().split("\n");
if (entries.some((e) => e.startsWith("/") || /(^|\/)\.\.(\/|$)/.test(e))) fail("مسیر مطلق یا «..» در بسته");
if (listing.some((l) => /^[lhcbp]/.test(l))) fail("پیوند نمادین/سخت یا پروندهٔ ویژه در بسته");
const tops = [...new Set(entries.map((e) => e.split("/")[0]))];
if (tops.length !== 1 || !/^\d{14}-[0-9a-f]{7}$/.test(tops[0] ?? "")) fail(`پوشهٔ بالایی نامعتبر: ${tops.join(", ")}`);

const work = mkdtempSync(path.join(tmpdir(), "mahdieh-verify-"));
try {
  execFileSync("tar", ["-xzf", tarball, "-C", work, "--no-same-owner"]);
  const root = path.join(work, tops[0] ?? "");
  const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
      const abs = path.join(dir, n);
      return statSync(abs).isDirectory() ? walk(abs) : [path.relative(root, abs).split(path.sep).join("/")];
    });

  // ۳ BUILD_INFO و یکپارچگی تک‌تک پرونده‌ها
  const info = JSON.parse(readFileSync(path.join(root, "BUILD_INFO.json"), "utf8"));
  if (info.app !== "mahdieh-front") fail(`app نادرست: ${info.app}`);
  if (info.release !== tops[0]) fail(`release در BUILD_INFO (${info.release}) ≠ نام پوشه`);
  if (!/^[0-9a-f]{40}$/.test(info.commit ?? "")) fail("commit در BUILD_INFO نامعتبر");
  if (expectCommit && info.commit !== expectCommit) fail(`commit ${info.commit} ≠ ${expectCommit}`);
  if (info.release?.slice(-7) !== info.commit?.slice(0, 7)) fail("پسوند شناسهٔ انتشار با commit نمی‌خواند");
  const files = info.files ?? {};
  const onDisk = walk(root).filter((f) => f !== "BUILD_INFO.json");
  for (const f of onDisk) {
    if (!(f in files)) fail(`پروندهٔ ثبت‌نشده: ${f}`);
    else if (sha256(readFileSync(path.join(root, f))) !== files[f]) fail(`هش نمی‌خواند: ${f}`);
  }
  for (const f of Object.keys(files)) if (!onDisk.includes(f)) fail(`پروندهٔ گم‌شده: ${f}`);

  // ۴ قرارداد routes.json
  const routes = JSON.parse(readFileSync(path.join(root, "routes.json"), "utf8"));
  if (routes.version !== 1) fail(`نسخهٔ routes.json: ${routes.version}`);
  if (!routes.routes?.["/"]) fail("مسیر «/» در routes.json نیست");
  for (const page of [...Object.values(routes.routes ?? {}), routes.not_found]) {
    if (!existsSync(path.join(root, "pages", page))) fail(`صفحهٔ گم‌شده: pages/${page}`);
  }

  // ۵ ممیزی CSP همهٔ صفحه‌ها
  const ph = routes.nonce_placeholder;
  for (const page of readdirSync(path.join(root, "pages")).filter((n) => n.endsWith(".html"))) {
    const html = readFileSync(path.join(root, "pages", page), "utf8");
    const tags = html.match(/<(script|style)\b[^>]*>/g) ?? [];
    const bare = tags.filter((t) => !t.includes(`nonce="${ph}"`));
    if (bare.length) fail(`${page}: ${bare.length} تگ script/style بی‌nonce — ${bare[0]}`);
    if (/\sstyle\s*=\s*["']/.test(html)) fail(`${page}: ویژگی style= (نقض CSP)`);
    const handler = html.match(/\son[a-z]+\s*=\s*["']/);
    if (handler) fail(`${page}: رویداد درون‌خطی ${handler[0].trim()}`);
    const external = html.match(/\s(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+/);
    if (external) fail(`${page}: منبع بیرونی ${external[0].trim()}`);
  }

  if (errors.length) {
    console.error(`\u2718 verify-bundle: ${errors.length} ایراد`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\u2714 verify-bundle: ${info.release} · ${onDisk.length} پرونده · CSP پاک`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
