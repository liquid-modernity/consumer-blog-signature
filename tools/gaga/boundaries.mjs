import assert from "node:assert/strict";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
const pkg = JSON.parse(readFileSync("package.json")),
  lock = JSON.parse(readFileSync("package-lock.json"));
for (const [name, version] of Object.entries(pkg.dependencies))
  if (name.startsWith("@gaga/")) {
    assert.ok(!version.startsWith("npm:") && !version.startsWith("workspace:"));
    const p = lock.packages["node_modules/" + name];
    assert.ok(
      p && !p.link && !lstatSync("node_modules/" + name).isSymbolicLink(),
    );
    if (!name.startsWith("@gaga/arsenal"))
      assert.ok(p.resolved.startsWith("https://npm.cloudsmith.io/gaga/gaga/"));
  }
for (const record of [
  "vendor/arsenal-foundation.json",
  "vendor/arsenal-consumer.json",
])
  for (const a of JSON.parse(readFileSync(record)).artifacts) {
    const bytes = readFileSync(
      "vendor/" +
        (a.file ??
          a.filename ??
          a.name.split("/")[1] + "-" + a.version + ".tgz"),
    );
    for (const hash of ["sha256", "sha512"])
      assert.equal(createHash(hash).update(bytes).digest("hex"), a[hash]);
  }
function walk(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const p = root + "/" + entry.name;
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|mjs|js|astro|mdx)$/.test(p)) {
      const s = readFileSync(p, "utf8");
      for (const m of s.matchAll(
        /(?:from\s*|import\s*\()\s*['"](@gaga\/[^'"]+)['"]/g,
      )) {
        const spec = m[1],
          name = spec.split("/").slice(0, 2).join("/"),
          sub = "." + spec.slice(name.length),
          manifest = JSON.parse(
            readFileSync("node_modules/" + name + "/package.json"),
          );
        assert.ok(
          pkg.dependencies[name] || pkg.devDependencies[name],
          "Undeclared GAGA dependency",
        );
        assert.ok(
          Object.hasOwn(manifest.exports, sub),
          "Private/absent import: " + spec,
        );
      }
      assert.ok(
        !/gaga-(?:engine|corps|arsenal)\/(?:packages|src)|(?:\.\.\/){2,}.*gaga-(?:engine|corps)/.test(
          s,
        ),
        "Sibling/private source reference: " + p,
      );
    }
  }
}
walk("src");
walk("tools/gaga");
console.log(
  "Public Engine/Corps registry packages; exact admitted Arsenal artifacts; no workspace/private imports",
);
