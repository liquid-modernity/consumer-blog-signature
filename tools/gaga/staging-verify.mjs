import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
const site = new URL(process.env.DEPLOYMENT_URL);
assert.equal(site.protocol, "https:");
assert.ok(site.hostname.startsWith("consumer-blog-signature-preview."));
assert.ok(site.hostname.endsWith(".workers.dev"));
assert.ok(!site.username && !site.password);
let response;
for (let i = 0; i < 12; i++) {
  try {
    response = await fetch(new URL("/api/search?q=Akal%20Imitasi", site), {
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 200) break;
  } catch {}
  await delay(1000);
}
assert.equal(response?.status, 200);
const search = await response.json();
assert.equal(search.status, "succeeded");
assert.ok(search.output.results.some((r) => r.title.includes("Dignity")));
const manifest = JSON.parse(readFileSync(".gaga/deployment-manifest.json"));
const checks = [];
for (const [route, path] of [
  ["/", "dist/index.html"],
  ["/search-index.json", "dist/search-index.json"],
]) {
  const res = await fetch(new URL(route, site), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, 200);
  const bytes = Buffer.from(await res.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.equal(digest, manifest.files.find((f) => f.path === path).sha256);
  checks.push({ route, sha256: digest });
}
const receipt = {
  status: "PASS",
  sourceCommit: manifest.sourceCommit,
  url: site.origin,
  anonymous: true,
  assets: checks,
  search: { status: search.status, ids: search.output.matchedArtifactIds },
  productionDeployment: false,
  publicationPerformed: false,
};
writeFileSync(
  process.env.GAGA_EVIDENCE_DIRECTORY + "/staging.json",
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
