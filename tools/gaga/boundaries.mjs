import assert from "node:assert/strict";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
const pkg = JSON.parse(readFileSync("package.json")),
  lock = JSON.parse(readFileSync("package-lock.json"));
for (const [name, version] of Object.entries(pkg.dependencies))
  if (name.startsWith("@gaga/")) {
    assert.match(version, /^\d+\.\d+\.\d+$/, "GAGA dependencies must use exact public versions");
    const p = lock.packages["node_modules/" + name];
    assert.ok(
      p && !p.link && !lstatSync("node_modules/" + name).isSymbolicLink(),
    );
    assert.ok(p.resolved.startsWith("https://npm.cloudsmith.io/gaga/gaga/"));
  }
for (const record of [
  "vendor/arsenal-foundation.json",
  "vendor/arsenal-dev1.json",
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
const arsenalAdmission = JSON.parse(readFileSync("vendor/arsenal-consumer.json"));
assert.equal(arsenalAdmission.distribution, "public-registry");
assert.equal(arsenalAdmission.registry, "https://npm.cloudsmith.io/gaga/gaga/");
for (const a of arsenalAdmission.artifacts) {
  assert.equal(pkg.dependencies[a.name], a.version);
  const p = lock.packages["node_modules/" + a.name];
  assert.equal(p.version, a.version);
  assert.equal(p.integrity, "sha512-" + Buffer.from(a.sha512, "hex").toString("base64"), "Published Arsenal differs from admitted stable artifact");
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
  "Public Engine/Corps/Arsenal registry packages; stable artifact integrity; no workspace/private imports",
);
