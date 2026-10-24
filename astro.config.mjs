import {readFileSync} from 'node:fs';
const projection=JSON.parse(readFileSync(new URL('./.gaga/host-projection.json',import.meta.url)));
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { rehypeTaskListAccessibility } from '@gaga/engine-capabilities/content/task-list-accessibility';
import { remarkObsidianBridge } from './src/lib/remark-obsidian.mjs';

export default defineConfig({
  devToolbar: {
    enabled: false
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  site: projection.site,
  outDir: './'+projection.outputs.find(output=>output.target==='pages').directory,
  trailingSlash: 'never',
  markdown: {
    remarkPlugins: [remarkObsidianBridge],
    rehypePlugins: [rehypeTaskListAccessibility]
  },
  integrations: [mdx()],
  vite: {
    server: {
      allowedHosts: true
    },
    build: {
      cssMinify: 'esbuild'
    },
    optimizeDeps: {
      include: [
        '@gaga/engine-runtime/runtime/return-navigation',
        '@gaga/engine-runtime/runtime/events',
        '@gaga/engine-runtime/runtime/storage',
        '@gaga/engine-runtime/runtime/motion',
        '@gaga/engine-runtime/runtime/toc-spy',
        '@gaga/engine-runtime/runtime/left-rail',
        '@gaga/engine-runtime/runtime/right-rail',
        '@gaga/engine-runtime/runtime/reader-preferences',
        '@gaga/engine-runtime/runtime/i18n',
        '@gaga/engine-runtime/runtime/keyboard',
        '@gaga/engine-runtime/runtime/focus-mode',
        '@gaga/engine-runtime/runtime/outline-peek',
        '@gaga/engine-runtime/runtime/surface-coordinator',
        '@gaga/engine-runtime/runtime/quick-actions-state',
        '@gaga/engine-runtime/runtime/share',
        '@gaga/engine-runtime/runtime/service-worker',
        '@gaga/engine-runtime/runtime/sfx',
        '@gaga/engine-runtime/runtime/reading-continuity',
        '@gaga/engine-runtime/runtime/commands',
        '@gaga/engine-runtime/reader'
      ]
    }
  }
});
