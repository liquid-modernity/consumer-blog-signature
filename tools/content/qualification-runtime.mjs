import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

assert.equal(process.version, "v22.23.4");
assert.equal(process.platform, "linux");
assert.equal(process.arch, "x64");
const root = resolve(import.meta.dirname, "../.."), out = process.env.GAGA_EVIDENCE_DIRECTORY;
assert.ok(out && !resolve(out).startsWith(root + "/"));
const npm = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
assert.match(npm, /^10\./);
const workerd = Object.fromEntries(["", "cms/"].map(prefix => {
  const p = resolve(root, prefix + "node_modules/workerd");
  return [prefix ? "cms" : "publication", {
    packageVersion: JSON.parse(readFileSync(resolve(p, "package.json"))).version,
    nativeVersion: execFileSync(resolve(p, "bin/workerd"), ["--version"], { encoding: "utf8" }).trim(),
  }];
}));
const evidence = {
  source: process.env.GITHUB_SHA, node: process.version, npm,
  runner: { os: process.env.RUNNER_OS, architecture: process.env.RUNNER_ARCH, image: process.env.ImageOS, version: process.env.ImageVersion },
  workerd,
  emdash: JSON.parse(readFileSync(resolve(root, "cms/node_modules/emdash/package.json"))).version,
};
assert.equal(evidence.emdash, "1.3.1");
assert.ok(evidence.runner.image && evidence.runner.version);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, "qualification-environment.json"), JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify(evidence));
