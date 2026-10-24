import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  composeApplication,
  normalizeApplication,
  stableStringify,
} from "@gaga/arsenal";
import { searchCapabilityId } from "@gaga/engine-capabilities/search";
import { root, verifySnapshot, sha256 } from "./snapshot.mjs";
const declaration = readFileSync(resolve(root, "gaga.app.json"), "utf8"),
  d = JSON.parse(declaration);
const names = [
  "@gaga/engine-contracts",
  "@gaga/engine-capabilities",
  "astro",
  "@astrojs/starlight",
  ...d.integrations.map((i) => i.package),
];
const installed = Object.fromEntries(
  names.map((name) => {
    const p = JSON.parse(
      readFileSync(resolve(root, "node_modules", name, "package.json")),
    );
    return [name, { version: p.version, dependencies: p.dependencies ?? {} }];
  }),
);
const result = composeApplication(declaration, {
  installed,
  capabilities: [searchCapabilityId],
  runtimes: ["build", "edge"],
  bindings: [],
});
assert.equal(result.ok, true, JSON.stringify(result));
assert.equal(
  stableStringify(normalizeApplication(declaration).value),
  stableStringify(
    normalizeApplication(stableStringify(result.value.declaration)).value,
  ),
);
mkdirSync(resolve(root, ".gaga"), { recursive: true });
writeFileSync(
  resolve(root, ".gaga/composition-plan.json"),
  stableStringify(result.value) + "\n",
);
writeFileSync(
  resolve(root, ".gaga/host-projection.json"),
  stableStringify(result.value.hostProjection) + "\n",
);
const wrangler = JSON.parse(
  readFileSync(resolve(root, "wrangler.jsonc"), "utf8"),
);
assert.equal(
  wrangler.assets.directory.replace(/^\.\//, ""),
  result.value.hostProjection.outputs.find((o) => o.target === "pages")
    .directory,
);
assert.equal(
  wrangler.main,
  result.value.hostProjection.outputs.find((o) => o.target === "api")
    .directory + "/bundle.mjs",
);
const { snapshot } = await verifySnapshot();
writeFileSync(
  resolve(root, ".gaga/preparation.json"),
  JSON.stringify(
    {
      schema: "consumer.preparation/v1",
      declarationSha256: sha256(declaration),
      planSha256: sha256(stableStringify(result.value)),
      cmsMode: snapshot.mode,
      editorialDocuments: snapshot.documents.length,
      liveProviderVerified: false,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Application admitted; deterministic plan persisted; pinned CMS bodies verified:",
  snapshot.documents.length,
);
