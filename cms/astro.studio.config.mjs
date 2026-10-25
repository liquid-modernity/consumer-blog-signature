// Deliberately isolated local CMS: no production bindings, credentials or migration paths.
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { studioPlugin } from "./editorial/plugin.mjs";
export default defineConfig({
  root: new URL("./studio/", import.meta.url),
  site: "http://localhost:4322",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      siteUrl: "http://localhost:4322",
      database: sqlite({ url: "file:./.data/editorial-studio-v1.db" }),
      storage: local({
        directory: "./.data/editorial-uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
      plugins: [studioPlugin()],
    }),
  ],
  server: { host: "127.0.0.1", port: 4322 },
  devToolbar: { enabled: false },
  vite: {
    server: {
      fs: {
        allow: [
          "./studio/",
          "./editorial/",
          "./node_modules/",
          "../editorial/",
          "../node_modules/",
        ].map((p) => fileURLToPath(new URL(p, import.meta.url))),
        deny: [
          "**/.env",
          "**/.env.*",
          "**/.data/**",
          "**/.astro/sessions/**",
          "**/*.{crt,pem}",
          "**/.git/**",
        ],
      },
    },
    ssr: { noExternal: ["@astrojs/react"] },
    build: { cssMinify: "esbuild" },
  },
});
