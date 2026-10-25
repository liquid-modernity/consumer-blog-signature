import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
function sources(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((f) =>
    f.isDirectory()
      ? sources(path + "/" + f.name)
      : /\.(mjs|tsx?|astro)$/.test(f.name)
        ? [path + "/" + f.name]
        : [],
  );
}
test("application and studio use only public EmDash extension imports, never installed core paths", () => {
  for (const file of [
    "cms/astro.studio.config.mjs",
    "cms/astro.studio.cloudflare.config.mjs",
    ...sources("cms/editorial"),
    ...sources("cms/src"),
    ...sources("editorial"),
    ...sources("src"),
  ]) {
    const code = readFileSync(file, "utf8");
    assert.doesNotMatch(
      code,
      /(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*(?:emdash\/(?:internal|src|dist)\b|node_modules\/[^'"]*emdash|@emdash-cms\/[^'"]+\/(?:src|dist)\b)/,
      file,
    );
  }
});
test("isolated studio has no Cloudflare bindings, production CMS source or deployment command", () => {
  const c = readFileSync("cms/astro.studio.config.mjs", "utf8");
  assert.match(c, /localhost:4322/);
  assert.match(c, /editorial-studio-v1\.db/);
  assert.doesNotMatch(
    c,
    /production\.json|wrangler\.json|@astrojs\/cloudflare|process\.env\.(?:CMS_|CLOUDFLARE_)/,
  );
  assert.match(
    readFileSync("cms/studio/package.json", "utf8"),
    /"private":\s*true/,
  );
});
test("preview admits only its explicit loopback origin and never takes HTML from a message", () => {
  const c = readFileSync("src/pages/editorial-preview.astro", "utf8");
  assert.match(c, /!import\.meta\.env\.DEV/);
  assert.match(c, /event\.origin!==studio/);
  assert.match(c, /event\.source!==window\.parent/);
  assert.doesNotMatch(c, /\.innerHTML|event\.data\.html/);
});
