// Loopback-only qualification fixture; never part of either production build.
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash from "emdash/astro";
import { sqlite } from "emdash/db";
import { fixturePlugin } from "./plugin.mjs";

if (!process.env.GAGA_AUTH_PROOF_DB) throw Error("Isolated proof database required");
export default defineConfig({
  root: new URL("./", import.meta.url),
  site: "http://127.0.0.1:4327",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      siteUrl: "http://127.0.0.1:4327",
      database: sqlite({ url: "file:" + process.env.GAGA_AUTH_PROOF_DB }),
      plugins: [fixturePlugin()],
    }),
  ],
  server: { host: "127.0.0.1", port: 4327 },
  devToolbar: { enabled: false },
  vite: { ssr: { noExternal: ["@astrojs/react"] } },
});
