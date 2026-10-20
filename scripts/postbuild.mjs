#!/usr/bin/env node
/**
 * پس‌ساخت خروجی ایستا (ADR-0022) ⇒ ‎dist/mahdieh-front/‎ آمادهٔ استقرار پشت جنگو:
 *
 *   pages/        فقط HTML؛ هر <script> و <style> نشانهٔ ‎nonce="__CSP_NONCE__"‎ می‌گیرد و جنگو در هر
 *                 پاسخ nonce تازهٔ CSP را جایگزین می‌کند (بدون unsafe-inline).
 *   public/       همهٔ دارایی‌ها (‎_next/static‎ هش‌دار و تغییرناپذیر، برند، مانیفست، RSC) + نسخه‌های br/gz.
 *   routes.json   نقشهٔ «مسیر ⇒ فایل صفحه» تا جنگو بداند کدام مسیرها مال فرانت است.
 *   BUILD_INFO.json  شناسهٔ انتشار، کامیت، زمان ساخت و چکیدهٔ هر فایل.
 *
 * دروازه‌های سخت (شکست ساخت): هر ویژگی ‎style=‎ در HTML، هر <script>/<style> بی‌نشانه، نبودِ صفحهٔ اصلی.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");
const DIST = path.join(ROOT, "dist", "mahdieh-front");
const NONCE = "__CSP_NONCE__";
const COMPRESSIBLE = new Set([".js", ".css", ".svg", ".txt", ".json", ".webmanifest", ".html", ".ico"]);

const fail = (msg) => {
  console.error(`\u2716 postbuild: ${msg}`);
  process.exit(1);
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return files.flat();
}

/** به هر تگ آغازین <script>/<style> که nonce ندارد، nonce می‌دهد. */
export function addNonce(html) {
  return html.replace(/<(script|style)\b([^>]*)>/gi, (tag, name, attrs) =>
    /\snonce=/i.test(attrs) ? tag : `<${name} nonce="${NONCE}"${attrs}>`,
  );
}

/** خطاهای CSP یک سند HTML (خالی ⇒ سالم). */
export function cspProblems(html) {
  const problems = [];
  const styleAttr = html.match(/<[a-z][^>]*\sstyle\s*=\s*["'][^>]*>/gi);
  if (styleAttr) problems.push(`${styleAttr.length} ویژگی style= (نمونه: ${styleAttr[0].slice(0, 120)})`);
  const bare = html.match(/<(script|style)\b(?![^>]*\snonce=)[^>]*>/gi);
  if (bare) problems.push(`${bare.length} تگ بی‌nonce (نمونه: ${bare[0].slice(0, 120)})`);
  if (/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ""))) {
    problems.push("دستگیرهٔ رویداد درون‌خطی (on*=)");
  }
  if (/javascript:/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ""))) problems.push("پیوند javascript:");
  return problems;
}

/** مسیر URL صفحه از مسیر فایل HTML (trailingSlash: ‎/x/index.html ⇒ /x/‎). */
function routeOf(rel) {
  const posix = rel.split(path.sep).join("/");
  if (posix === "index.html") return "/";
  if (posix.endsWith("/index.html")) return `/${posix.slice(0, -"index.html".length)}`;
  return `/${posix.replace(/\.html$/, "")}`;
}

function gitSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function main() {
  try {
    await stat(path.join(OUT, "index.html"));
  } catch {
    fail("out/index.html پیدا نشد؛ ابتدا next build (output: export).");
  }
  await rm(DIST, { recursive: true, force: true });
  await mkdir(path.join(DIST, "pages"), { recursive: true });
  await mkdir(path.join(DIST, "public"), { recursive: true });

  const files = await walk(OUT);
  const routes = {};
  const manifest = {};
  const problems = [];
  let compressed = 0;

  for (const abs of files) {
    const rel = path.relative(OUT, abs);
    const ext = path.extname(abs).toLowerCase();
    if (ext === ".html") {
      const html = addNonce(await readFile(abs, "utf8"));
      const issues = cspProblems(html);
      if (issues.length) problems.push(`${rel}: ${issues.join("؛ ")}`);
      const dest = path.join(DIST, "pages", rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, html);
      // ‎404.html‎ و ‎_not-found‎ صفحهٔ خطای فرانت‌اند، نه مسیر عمومی.
      if (!rel.startsWith("_not-found") && rel !== "404.html" && !rel.startsWith(`404${path.sep}`)) {
        routes[routeOf(rel)] = rel.split(path.sep).join("/");
      }
      manifest[`pages/${rel.split(path.sep).join("/")}`] = createHash("sha256").update(html).digest("hex");
      continue;
    }
    const dest = path.join(DIST, "public", rel);
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(abs, dest);
    const buf = await readFile(abs);
    manifest[`public/${rel.split(path.sep).join("/")}`] = createHash("sha256").update(buf).digest("hex");
    if (COMPRESSIBLE.has(ext) && buf.length > 1024) {
      const br = brotliCompressSync(buf, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
      });
      const gz = gzipSync(buf, { level: 9 });
      // نسخه‌های فشرده هم در فهرست هش‌اند: سرور ترجیحاً همین‌ها را می‌دهد، پس دست‌کاری‌شان
      // نباید از راستی‌آزمایی میزبان پنهان بماند.
      const key = `public/${rel.split(path.sep).join("/")}`;
      const digest = (b) => createHash("sha256").update(b).digest("hex");
      if (br.length < buf.length * 0.95) {
        await writeFile(`${dest}.br`, br);
        manifest[`${key}.br`] = digest(br);
      }
      if (gz.length < buf.length * 0.95) {
        await writeFile(`${dest}.gz`, gz);
        manifest[`${key}.gz`] = digest(gz);
      }
      compressed += 1;
    }
  }

  if (problems.length) fail(`نقض CSP در HTML:\n  - ${problems.join("\n  - ")}`);
  if (!routes["/"]) fail("مسیر / در خروجی نیست.");
  try {
    await stat(path.join(DIST, "pages", "404.html"));
  } catch {
    fail("pages/404.html ساخته نشد.");
  }

  const sha = gitSha();
  // هم‌قالب بک‌اند (‎mahdieh_cli: «YYYYMMDDHHMMSS-کامیت»، built_at بی‌میلی‌ثانیه).
  const builtAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const release = process.env.MAHDIEH_RELEASE || `${builtAt.replace(/[-:TZ]/g, "")}-${sha.slice(0, 7)}`;
  if (!/^\d{14}-[0-9a-f]{7}$/.test(release)) throw new Error(`شناسهٔ انتشار نامعتبر: ${release}`);
  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  const nextPkg = JSON.parse(await readFile(path.join(ROOT, "node_modules", "next", "package.json"), "utf8"));

  const routesJson = `${JSON.stringify({ version: 1, nonce_placeholder: NONCE, not_found: "404.html", routes }, null, 2)}\n`;
  await writeFile(path.join(DIST, "routes.json"), routesJson);
  manifest["routes.json"] = createHash("sha256").update(routesJson).digest("hex");
  await writeFile(
    path.join(DIST, "BUILD_INFO.json"),
    `${JSON.stringify(
      {
        app: "mahdieh-front",
        release,
        commit: sha,
        built_at: builtAt,
        version: pkg.version,
        next: nextPkg.version,
        node: process.version,
        files: manifest,
      },
      null,
      2,
    )}\n`,
  );

  const pages = Object.keys(routes).length;
  console.log(
    `\u2714 postbuild: ${release} · ${pages} مسیر · ${Object.keys(manifest).length} فایل · ${compressed} فشرده‌شده ⇒ ${path.relative(ROOT, DIST)}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
