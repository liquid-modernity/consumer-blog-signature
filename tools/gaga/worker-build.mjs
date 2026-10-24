import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import { sha256 } from "./snapshot.mjs";
const index = JSON.parse(readFileSync("dist/search-index.json", "utf8"));
assert.ok(
  index.artifacts.length > 0 && index.searchProof.status === "succeeded",
);
writeFileSync(
  ".gaga/worker-artifacts.json",
  JSON.stringify(index.artifacts) + "\n",
);
const bundle = await build({
  entryPoints: ["worker/index.mjs"],
  outfile: "worker/bundle.mjs",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  metafile: true,
});
assert.ok(
  Object.values(bundle.metafile.outputs).every((o) => !o.imports.length),
);
assert.ok(
  Object.keys(bundle.metafile.inputs).every(
    (p) =>
      !p.includes("arsenal") && !p.startsWith("node:") && !p.includes("ajv"),
  ),
);
writeFileSync(
  ".gaga/worker-bundle.json",
  JSON.stringify(
    {
      sha256: sha256(readFileSync("worker/bundle.mjs")),
      inputs: Object.keys(bundle.metafile.inputs),
      bytes: readFileSync("worker/bundle.mjs").length,
    },
    null,
    2,
  ) + "\n",
);
