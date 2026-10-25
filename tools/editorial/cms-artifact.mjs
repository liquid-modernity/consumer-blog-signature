import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";
const sha = (b) => createHash("sha256").update(b).digest("hex"),
  excluded = new Set([
    "content/emdash/published.json",
    "content/emdash/published-receipt.json",
    "cms/editorial/admission.json",
    "cms/editorial/migration-receipt.json",
  ]);
export function controllerInputs() {
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter((x) => x && !excluded.has(x))
    .map((path) => ({ path, sha256: sha(readFileSync(path)) }));
  return { sha256: sha(JSON.stringify(files)), files, excluded: [...excluded] };
}
export function cmsFiles() {
  const list = [];
  function walk(dir) {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, f.name);
      if (f.isDirectory()) walk(path);
      else {
        assert.ok(f.isFile());
        list.push({
          path: relative(process.cwd(), path),
          sha256: sha(readFileSync(path)),
        });
      }
    }
  }
  walk("cms/dist-cloudflare");
  return list.sort((a, b) => a.path.localeCompare(b.path));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  const manifest = {
    status: "PASS",
    sourceCommit: process.env.GITHUB_SHA,
    qualificationRun: process.env.GITHUB_RUN_ID,
    planSha256: sha(readFileSync("cms/editorial/migration-plan.json")),
    sourceSetSha256: JSON.parse(
      readFileSync("cms/editorial/migration-plan.json"),
    ).sourceSetSha256,
    controllerInputs: controllerInputs(),
    files: cmsFiles(),
  };
  for (const name of [
    "cutover-rehearsal.json",
    "local-browser-proof.json",
    "schema-migration-proof.json",
  ])
    assert.equal(
      JSON.parse(readFileSync(".gaga/editorial/" + name)).status,
      "PASS",
    );
  writeFileSync(
    ".gaga/cms-qualified.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: "PASS",
      files: manifest.files.length,
      controllerInputsSha256: manifest.controllerInputs.sha256,
    }),
  );
}
