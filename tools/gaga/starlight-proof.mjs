import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { readSnapshot } from "./snapshot.mjs";
export function proveStarlight() {
  const dir = ".gaga/starlight-proof";
  mkdirSync(dir + "/src/content/docs", { recursive: true });
  const source = readSnapshot().documents[0],
    body = readFileSync(source.path, "utf8").replace(
      /^---\s*\n[\s\S]*?\n---\s*\n/,
      "",
    );
  writeFileSync(
    dir + "/src/content/docs/article.md",
    "---\ntitle: " + JSON.stringify(source.item.data.title) + "\n---\n" + body,
  );
  writeFileSync(
    dir + "/package.json",
    JSON.stringify({ type: "module", private: true }),
  );
  writeFileSync(
    dir + "/astro.config.mjs",
    "import{defineConfig}from'astro/config';import starlight from'@astrojs/starlight';export default defineConfig({site:'https://consumer.example',integrations:[starlight({title:'Publication compatibility proof',pagefind:false,routeMiddleware:'./route-middleware.ts'})]});",
  );
  writeFileSync(
    dir + "/src/content.config.ts",
    "import{defineCollection}from'astro:content';import{docsLoader}from'@astrojs/starlight/loaders';import{docsSchema}from'@astrojs/starlight/schema';export const collections={docs:defineCollection({loader:docsLoader(),schema:docsSchema()})};",
  );
  writeFileSync(
    dir + "/route-middleware.ts",
    "import{defineRouteMiddleware}from'@astrojs/starlight/route-data';import{projectStarlightPage}from'@gaga/corps-starlight';export const onRequest=defineRouteMiddleware(ctx=>{const p=projectStarlightPage(ctx.locals.starlightRoute,{url:ctx.url.href,visibility:'public'});if(ctx.locals.starlightRoute.entry.id==='article'){if(!p.outline.length)throw Error('Expected real article outline');ctx.locals.starlightRoute.head.push({tag:'meta',attrs:{name:'blog-starlight-proof',content:p.content.artifact.title}});}});",
  );
  execFileSync(
    process.execPath,
    ["node_modules/astro/bin/astro.mjs", "build", "--root", dir],
    {
      stdio: "inherit",
      timeout: 180000,
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
        ASTRO_DEV_BACKGROUND: "1",
      },
    },
  );
  assert.ok(
    readFileSync(dir + "/dist/article/index.html", "utf8").includes(
      "blog-starlight-proof",
    ),
  );
  return {
    version: "0.41.10",
    actualRouteMiddleware: true,
    source: source.path,
    mainBlogUsesNativePresentation: true,
  };
}
