#!/usr/bin/env node
/**
 * سرور پیش‌نمایش «همان رفتار جنگو» برای خروجی ‎dist/mahdieh-front‎ (آزمون e2e و بازبینی محلی):
 * - صفحه‌ها از routes.json با nonce تازه در هر پاسخ + همان CSP سخت‌گیر بک‌اند (بدون unsafe-inline).
 * - ‎/_next/static/‎ تغییرناپذیر یک‌ساله؛ بقیهٔ public پنج دقیقه؛ br/gz از پیش فشرده.
 * - ‎/api/‎ اختیاری به ‎MAHDIEH_DEV_BACKEND‎ پروکسی می‌شود (در e2e، Playwright آن را شبیه‌سازی می‌کند).
 * استفاده: ‎node scripts/serve-static.mjs [--port 4173] [--host 0.0.0.0]‎
 */
import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "dist", "mahdieh-front");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const PORT = Number(arg("port", process.env.PORT ?? 4173));
const HOST = arg("host", "127.0.0.1");
const BACKEND = process.env.MAHDIEH_DEV_BACKEND;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

const routesFile = JSON.parse(await readFile(path.join(ROOT, "routes.json"), "utf8"));
const info = JSON.parse(await readFile(path.join(ROOT, "BUILD_INFO.json"), "utf8"));

const csp = (nonce) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

async function sendPage(res, file, status = 200) {
  const nonce = randomBytes(16).toString("base64");
  const html = (await readFile(path.join(ROOT, "pages", file), "utf8")).replaceAll(routesFile.nonce_placeholder, nonce);
  res.writeHead(status, {
    "content-type": TYPES[".html"],
    "cache-control": "no-cache",
    "content-security-policy": csp(nonce),
    "x-content-type-options": "nosniff",
    "referrer-policy": "same-origin",
    "x-mahdieh-front": info.release,
  });
  res.end(html);
}

async function sendAsset(req, res, rel) {
  const abs = path.join(ROOT, "public", rel);
  if (!abs.startsWith(path.join(ROOT, "public"))) return false;
  let st;
  try {
    st = await stat(abs);
  } catch {
    return false;
  }
  if (!st.isFile()) return false;
  const accept = String(req.headers["accept-encoding"] ?? "");
  let file = abs;
  let encoding;
  for (const [enc, ext] of [
    ["br", ".br"],
    ["gzip", ".gz"],
  ]) {
    if (!accept.includes(enc)) continue;
    try {
      await stat(abs + ext);
      file = abs + ext;
      encoding = enc;
      break;
    } catch {
      /* نسخهٔ فشرده نیست */
    }
  }
  const immutable = rel.startsWith("_next/static/");
  res.writeHead(200, {
    "content-type": TYPES[path.extname(abs)] ?? "application/octet-stream",
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=300",
    "x-content-type-options": "nosniff",
    vary: "Accept-Encoding",
    ...(encoding ? { "content-encoding": encoding } : {}),
  });
  createReadStream(file).pipe(res);
  return true;
}

function proxy(req, res) {
  const target = new URL(req.url, BACKEND);
  const upstream = http.request(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers);
    r.pipe(res);
  });
  upstream.on("error", () => {
    res.writeHead(502, { "content-type": "application/json" });
    res.end('{"detail":"backend unavailable"}');
  });
  req.pipe(upstream);
}

/** هم‌ارز الگوهای پویای جنگو (بی نگهبان: «پیدا نشد» را خود صفحه از پاسخ ۴۰۴ API نشان می‌دهد). */
const dynamicRoutes = Object.entries(routesFile.dynamic ?? {}).map(([pattern, file]) => [
  new RegExp(`^${pattern.replace(/\[[a-z_]+\]/g, "[A-Za-z0-9_-]{1,32}")}$`),
  file,
]);
function matchDynamic(pathname) {
  return dynamicRoutes.find(([re]) => re.test(pathname))?.[1];
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://local");
    if (url.pathname.startsWith("/api/")) {
      if (BACKEND) return proxy(req, res);
      res.writeHead(503, { "content-type": "application/json" });
      return res.end('{"detail":"no backend configured"}');
    }
    if (url.pathname === "/health/live/") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", front: info.release }));
    }
    const page = routesFile.routes[url.pathname] ?? matchDynamic(url.pathname);
    if (page) return await sendPage(res, page);
    if (await sendAsset(req, res, decodeURIComponent(url.pathname.slice(1)))) return;
    return await sendPage(res, routesFile.not_found, 404);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end();
  }
});

server.listen(PORT, HOST, () => console.log(`mahdieh-front ${info.release} ⇒ http://${HOST}:${PORT}`));
