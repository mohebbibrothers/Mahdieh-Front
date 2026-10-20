#!/usr/bin/env node
/**
 * بسته‌بندی ‎dist/mahdieh-front‎ برای ‎front_deploy.sh‎ میزبان:
 *   ‎<out>/mahdieh-front.tar.gz‎        یک پوشهٔ بالایی به نام شناسهٔ انتشار، مالک ۰، بی‌پیوند
 *   ‎<out>/mahdieh-front.tar.gz.sha256‎ قالب ‎sha256sum -c‎
 *   ‎<out>/BUILD_INFO.json‎             رونوشت (آخرین دارایی انتشار؛ «mahdieh update» با آن صبر می‌کند)
 * استفاده: ‎node scripts/pack-bundle.mjs [--out release]‎
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist", "mahdieh-front");
const i = process.argv.indexOf("--out");
const OUT = path.resolve(ROOT, i > -1 ? process.argv[i + 1] : "release");
const NAME = "mahdieh-front.tar.gz";

const info = JSON.parse(readFileSync(path.join(DIST, "BUILD_INFO.json"), "utf8"));
if (!/^\d{14}-[0-9a-f]{7}$/.test(info.release)) throw new Error(`شناسهٔ انتشار نامعتبر: ${info.release}`);

const stage = mkdtempSync(path.join(tmpdir(), "mahdieh-pack-"));
try {
  cpSync(DIST, path.join(stage, info.release), { recursive: true, verbatimSymlinks: true });
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const tarball = path.join(OUT, NAME);
  // ترتیب ثابت و مالک ۰ ⇒ بستهٔ تکرارپذیر و بی‌اطلاعات کاربر ساخت.
  execFileSync(
    "tar",
    [
      "--sort=name",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "--mode=u+rw,go+r,go-w",
      "-czf",
      tarball,
      "-C",
      stage,
      info.release,
    ],
    { stdio: "inherit", env: { ...process.env, GZIP: "-9n" } },
  );
  const digest = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  writeFileSync(`${tarball}.sha256`, `${digest}  ${NAME}\n`);
  cpSync(path.join(DIST, "BUILD_INFO.json"), path.join(OUT, "BUILD_INFO.json"));
  console.log(`\u2714 pack: ${info.release} · ${digest.slice(0, 12)}… ⇒ ${path.relative(ROOT, OUT)}/`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
