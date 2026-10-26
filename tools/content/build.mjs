import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
const digest = (b) => createHash("sha256").update(b).digest("hex");
function inventory(root, prefix = "dist") {
  const rows = [];
  for (const e of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const path = prefix + "/" + e.name;
    if (e.isDirectory()) rows.push(...inventory(root, path));
    else rows.push({ path, digest: digest(readFileSync(join(root, path))) });
  }
  return rows;
}
export function changedSurfaces(before, after) {
  const a = new Map(before.map((f) => [f.path, f.digest])),
    b = new Map(after.map((f) => [f.path, f.digest])),
    path = (x) => "/" + x.replace(/^dist\//, "").replace(/index\.html$/, "");
  return {
    current: [...a]
      .filter(([p, h]) => b.get(p) !== h)
      .map(([p]) => path(p))
      .filter((p) => p !== "/404.html")
      .sort(),
    proposed: [...b]
      .filter(([p, h]) => a.get(p) !== h)
      .map(([p]) => path(p))
      .filter((p) => p !== "/404.html")
      .sort(),
    removed: [...a.keys()]
      .filter((p) => !b.has(p))
      .map(path)
      .sort(),
    reason:
      "Exact artifact byte diff across all static output; full static build required, unchanged output is excluded from readback.",
  };
}
export async function proveContentBuild({
  source,
  projection,
  baseline,
  cache,
  origin,
}) {
  const root = mkdtempSync(join(cache, "private-content-build-"));
  try {
    const archive = execFileSync("git", ["archive", "HEAD"], {
      cwd: source,
      maxBuffer: 128 * 1024 * 1024,
    });
    execFileSync("tar", ["-x", "-C", root], { input: archive });
    const bytes = JSON.stringify(projection, null, 2) + "\n";
    writeFileSync(resolve(root, "content/emdash/published.json"), bytes);
    writeFileSync(
      resolve(root, "content/emdash/published-receipt.json"),
      JSON.stringify({
        status: "PASS",
        classification: "PROSPECTIVE_CONTENT_PREVIEW",
        exportSha256: digest(bytes),
      }),
    );
    const env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      CI: "true",
      GAGA_CONTENT_PREVIEW_QUALIFICATION: "1",
      PUBLIC_SITE_URL: origin,
      PUBLIC_BUILD_TIME: execFileSync(
        "git",
        ["show", "-s", "--format=%cI", "HEAD"],
        { cwd: source, encoding: "utf8" },
      ).trim(),
      PUBLIC_GIT_SHA: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: source,
        encoding: "utf8",
      }).trim(),
      ASTRO_TELEMETRY_DISABLED: "1",
      WRANGLER_SEND_METRICS: "false",
    };
    for (const args of [
      ["ci", "--ignore-scripts", "--no-audit", "--no-fund"],
      ["run", "build"],
    ]) {
      try {
        execFileSync("npm", args, {
          cwd: root,
          env,
          stdio: "pipe",
          timeout: 240000,
          maxBuffer: 32 * 1024 * 1024,
        });
      } catch {
        throw Error(
          "Private content build failed; no draft output or build log was published.",
        );
      }
    }
    const index = JSON.parse(
      readFileSync(join(root, "dist/search-index.json")),
    );
    if (index.searchProof.status !== "succeeded")
      throw Error("Built Search qualification failed.");
    const result = changedSurfaces(inventory(baseline), inventory(root));
    if (!result.current.length && !result.proposed.length)
      throw Error("Selected change produced no qualified public surface.");
    return result;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
