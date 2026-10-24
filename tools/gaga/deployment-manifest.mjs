import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const browser = JSON.parse(readFileSync(".gaga/browser-results.json")).stats;
assert.equal(browser.expected, 4);
assert.equal(browser.unexpected, 0);
assert.equal(browser.skipped, 0);
assert.equal(browser.flaky, 0);
const consumer = JSON.parse(readFileSync(".gaga/consumer-receipt.json"));
assert.equal(consumer.status, "PASS");
assert.equal(consumer.sourceCommit, process.env.GITHUB_SHA);
const audit = JSON.parse(
  readFileSync(process.env.GAGA_EVIDENCE_DIRECTORY + "/audit.json"),
);
assert.equal(audit.metadata.vulnerabilities.total, 0);
const files = ["worker/bundle.mjs", "wrangler.jsonc"];
function walk(path) {
  for (const p of readdirSync(path, { withFileTypes: true }))
    p.isDirectory()
      ? walk(path + "/" + p.name)
      : files.push(path + "/" + p.name);
}
walk("dist");
writeFileSync(
  ".gaga/deployment-manifest.json",
  JSON.stringify(
    {
      sourceCommit: process.env.GITHUB_SHA,
      qualification: {
        browserPassed: browser.expected,
        browserFailed: browser.unexpected,
        consumer: consumer.status,
        auditVulnerabilities: audit.metadata.vulnerabilities.total,
      },
      files: files.sort().map((path) => ({
        path,
        sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
      })),
    },
    null,
    2,
  ) + "\n",
);
