import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const inventory = JSON.parse(readFileSync("docs/UI-PRESERVATION.json"));
for (const f of inventory.files) {
  const source = readFileSync(f.path, "utf8")
    .replaceAll("@gaga/engine-web", "@gaga/engine-runtime")
    .replaceAll("@gaga/engine/", "@gaga/engine-capabilities/");
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    f.sha256AfterImportRename,
    "Unintended application UI/style/routing change: " + f.path,
  );
}
console.log(
  "Unchanged application markup, style, interactions and route configuration:",
  inventory.files.length,
  "files",
);
