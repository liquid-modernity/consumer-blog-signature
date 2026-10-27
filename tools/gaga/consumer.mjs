import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  defineQuery,
  executeSearchReference,
} from "@gaga/engine-capabilities/search";
import { startNative } from "./native.mjs";
import { proveStarlight } from "./starlight-proof.mjs";
import "./boundaries.mjs";
const index = JSON.parse(readFileSync("dist/search-index.json"));
assert.ok(index.artifacts.length >= 8);
assert.equal(index.searchProof.status, "succeeded");
const result = executeSearchReference({
  id: "registry-blog-proof",
  query: defineQuery({
    id: "query",
    text: "Akal Imitasi",
    filters: [],
    facets: [],
    scope: [],
    constraints: [],
    diagnostics: [],
  }),
  artifacts: index.artifacts,
  limitations: [],
  diagnostics: [],
});
assert.equal(result.status, "succeeded");
assert.ok(result.output.results.some((r) => r.title.includes("Dignity")));
const lock = JSON.parse(readFileSync("package-lock.json")),
  registry = [];
for (const [name, p] of Object.entries(lock.packages))
  if (name.startsWith("node_modules/@gaga/")) {
    const packageName = name.slice("node_modules/".length);
    const response = await fetch(
      "https://npm.cloudsmith.io/gaga/gaga/" +
        encodeURIComponent(packageName) +
        "/" +
        p.version,
      { signal: AbortSignal.timeout(20000) },
    );
    assert.equal(response.status, 200);
    const metadata = await response.json();
    const downloaded = await fetch(metadata.dist.tarball, {
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(downloaded.status, 200);
    const bytes = Buffer.from(await downloaded.arrayBuffer());
    assert.equal(
      "sha512-" + createHash("sha512").update(bytes).digest("base64"),
      p.integrity,
    );
    assert.equal(metadata.dist.integrity, p.integrity);
    const installed = JSON.parse(readFileSync(name + "/package.json"));
    for (const field of [
      "name",
      "version",
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
      "peerDependenciesMeta",
      "engines",
      "os",
      "cpu",
      "libc",
      "type",
      "exports",
    ])
      assert.deepEqual(
        installed[field] ?? null,
        metadata[field] ?? null,
        packageName + " " + field,
      );
    const admitted = JSON.parse(readFileSync("vendor/arsenal-consumer.json")).artifacts.find(a => a.name === packageName);
    if (admitted) {
      assert.equal(createHash("sha256").update(bytes).digest("hex"), admitted.sha256);
      assert.equal(createHash("sha512").update(bytes).digest("hex"), admitted.sha512);
      assert.equal(metadata.dist.tarball, p.resolved);
      for (const member of execFileSync("tar", ["-tzf", "-"], { input: bytes, encoding: "utf8" }).trim().split("\n")) {
        assert.ok(member.startsWith("package/") && !member.split("/").includes(".."));
        if (!member.endsWith("/")) assert.deepEqual(readFileSync(name + "/" + member.slice(8)), execFileSync("tar", ["-xOzf", "-", member], { input: bytes }), "Installed package differs: " + member);
      }
    }
    registry.push({
      name: packageName,
      version: p.version,
      resolved: p.resolved,
      artifactUrl: metadata.dist.tarball,
      verifiedAt: new Date().toISOString(),
      installedBytesVerified: Boolean(admitted),
      integrity: p.integrity,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      sha512: createHash("sha512").update(bytes).digest("hex"),
    });
  }
const starlight = proveStarlight();
const runtime = await startNative();
let body;
try {
  const response = await fetch(runtime.url + "/api/search?q=Akal%20Imitasi");
  assert.equal(response.status, 200);
  body = await response.json();
  assert.deepEqual(
    body.output.matchedArtifactIds,
    result.output.matchedArtifactIds,
  );
  assert.equal((await fetch(runtime.url + "/api/search?q=")).status, 400);
  assert.equal(
    (await fetch(runtime.url + "/api/search?q=Akal", { method: "POST" }))
      .status,
    405,
  );
} finally {
  await runtime.stop();
}
const receipt = {
  status: "PASS",
  sourceCommit: process.env.GITHUB_SHA ?? null,
  node: process.version,
  host: process.platform,
  registry,
  workspaceLinks: false,
  arsenal: JSON.parse(readFileSync("vendor/arsenal-consumer.json")),
  applicationId: "consumer-blog-signature",
  cms: JSON.parse(readFileSync(".gaga/preparation.json")),
  astro: "7.3.3",
  starlight,
  search: {
    status: body.status,
    matchedArtifactIds: body.output.matchedArtifactIds,
  },
  workerd: {
    version: "1.20261022.1",
    native: true,
    compatibilityDate: "2026-10-22",
    compatibilityFlags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
    outbound: false,
    bundle: JSON.parse(readFileSync(".gaga/worker-bundle.json")),
  },
  providerDeploymentVerified: false,
};
writeFileSync(
  ".gaga/consumer-receipt.json",
  JSON.stringify(receipt, null, 2) + "\n",
);
if (process.env.GAGA_EVIDENCE_DIRECTORY) {
  const dir = resolve(process.env.GAGA_EVIDENCE_DIRECTORY);
  mkdirSync(dir, { recursive: true });
  for (const name of [
    "composition-plan.json",
    "host-projection.json",
    "preparation.json",
    "consumer-receipt.json",
    "worker-bundle.json",
    "workerd.capnp",
    "workerd.log",
  ])
    cpSync(".gaga/" + name, dir + "/" + name);
  cpSync("worker/bundle.mjs", dir + "/worker-bundle.mjs");
}
console.log(JSON.stringify(receipt, null, 2));
