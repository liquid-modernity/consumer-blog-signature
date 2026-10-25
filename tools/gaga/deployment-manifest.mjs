import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { sourceIdentity } from "./source-identity.mjs";
const source=sourceIdentity();
assert.equal(source.commit,process.env.GITHUB_SHA);
const digest=path=>createHash("sha256").update(readFileSync(path)).digest("hex");
const production=process.env.GAGA_PRODUCTION_QUALIFICATION==="1";
const content=JSON.parse(readFileSync("content/emdash/published.json"));
if(production){assert.equal(content.origin,"https://consumer-blog-signature-cms.ratriatra.workers.dev");assert.equal(content.documents.length,8);}
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
      sourceTree:source.tree,
      sourceSha256:source.sha256,
      qualificationRun:process.env.GITHUB_RUN_ID,
      planSha256:digest(".gaga/composition-plan.json"),
      productionExportSha256:digest("content/emdash/published.json"),
      contentReceiptSha256:digest("content/emdash/published-receipt.json"),
      cmsOrigin:content.origin,
      production,
      contentRevisions:content.documents.map(d=>({applicationId:d.applicationId,pin:d.pin,bodySha256:d.bodySha256})),
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
