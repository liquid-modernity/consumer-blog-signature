import {readFileSync} from 'node:fs';
import {defineConfig} from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import {d1,r2} from '@emdash-cms/cloudflare';
const production=JSON.parse(readFileSync(new URL('./production.json',import.meta.url)));
export default defineConfig({
  site:production.origin,
  output:'server',
  outDir:'./dist-cloudflare',
  adapter:cloudflare({configPath:'./wrangler.jsonc',imageService:'passthrough'}),
  // Keep Kysely class initialization in one SSR bundle; split chunks fail in workerd.
  vite:{environments:{ssr:{build:{rolldownOptions:{output:{codeSplitting:false}}}}}},
  integrations:[react(),emdash({siteUrl:production.origin,database:d1({binding:production.bindings.database}),storage:r2({binding:production.bindings.media})})],
  devToolbar:{enabled:false}
});
