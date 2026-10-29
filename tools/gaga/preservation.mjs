import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
// Admit only the semantic main correction qualified at this immutable source/run.
const approvedMain = Object.freeze({
  path: "src/components/gaga/PageFrame.astro",
  historicalInventorySha256: "0fc6f482051c2f35c08e943c0924fb60567316f3e094d10b917c937bca816d4b",
  historicalSha256: "a0fc326ac16811880529ab14bf909a50ea46b40ef0e24856448581e41a79ef0b",
  admittedSha256: "743156b9bf59f79dfae0648224bbe0ef50054fc18ac23f24ddbae21319dd12f8",
  sourceCommit: "fe2fa7a47de0dc38799fe63a3e646e7fd7e1cd9a",
  sourceTree: "fa53ad503ee0c4b742c03207d833c69373a1866e",
  qualification: "https://github.com/liquid-modernity/consumer-blog-signature/actions/runs/40752951927",
});
const historical = readFileSync("docs/UI-PRESERVATION.json");
assert.equal(
  createHash("sha256").update(historical).digest("hex"),
  approvedMain.historicalInventorySha256,
  "Historical UI inventory changed without admission",
);
const inventory = JSON.parse(historical);
assert.equal(inventory.files.filter(f => f.path === approvedMain.path).length, 1);
assert.equal(inventory.files.find(f => f.path === approvedMain.path).sha256AfterImportRename, approvedMain.historicalSha256);
for (const f of inventory.files) {
  const source = readFileSync(f.path, "utf8")
    .replaceAll("@gaga/engine-web", "@gaga/engine-runtime")
    .replaceAll("@gaga/engine/", "@gaga/engine-capabilities/");
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    f.path === approvedMain.path ? approvedMain.admittedSha256 : f.sha256AfterImportRename,
    "Unintended application UI/style/routing change: " + f.path,
  );
}
console.log(
  "Preserved application UI/style/routing:",
  inventory.files.length,
  "entries; one exact qualified main-landmark correction from",
  approvedMain.sourceCommit,
  approvedMain.qualification,
);
