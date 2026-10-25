// Compile-only local Worker fixture. No production resources or deployment operations.
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";
import baseline from "./astro.cloudflare.config.mjs";
import { studioPlugin } from "./editorial/plugin.mjs";
export default defineConfig({
  root: new URL("./studio/", import.meta.url),
  site: "http://localhost:4322",
  output: "server",
  outDir: new URL("./dist-editorial-cloudflare/", import.meta.url),
  adapter: cloudflare({
    configPath: fileURLToPath(
      new URL("./studio/wrangler.jsonc", import.meta.url),
    ),
    imageService: "passthrough",
  }),
  vite: baseline.vite,
  integrations: [
    react(),
    emdash({
      siteUrl: "http://localhost:4322",
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [studioPlugin()],
    }),
  ],
  devToolbar: { enabled: false },
});
