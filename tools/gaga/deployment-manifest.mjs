import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
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
      files: files
        .sort()
        .map((path) => ({
          path,
          sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
        })),
    },
    null,
    2,
  ) + "\n",
);
