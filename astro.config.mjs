import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { rehypeTaskListAccessibility } from '@gaga/engine/content/task-list-accessibility';
import { remarkObsidianBridge } from './src/lib/remark-obsidian.mjs';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  site: process.env.PUBLIC_SITE_URL || 'https://example.com',
  trailingSlash: 'never',
  markdown: {
    remarkPlugins: [remarkObsidianBridge],
    rehypePlugins: [rehypeTaskListAccessibility]
  },
  integrations: [mdx()],
  vite: {
    build: {
      cssMinify: 'esbuild'
    },
    optimizeDeps: {
      include: [
        '@gaga/engine',
        '@gaga/engine-web',
        '@gaga/engine-web/runtime/return-navigation',
        '@gaga/engine-web/runtime/events',
        '@gaga/engine-web/runtime/storage',
        '@gaga/engine-web/runtime/motion',
        '@gaga/engine-web/runtime/toc-spy',
        '@gaga/engine-web/runtime/left-rail',
        '@gaga/engine-web/runtime/right-rail',
        '@gaga/engine-web/runtime/reader-preferences',
        '@gaga/engine-web/runtime/i18n',
        '@gaga/engine-web/runtime/keyboard',
        '@gaga/engine-web/runtime/focus-mode',
        '@gaga/engine-web/runtime/outline-peek',
        '@gaga/engine-web/runtime/surface-coordinator',
        '@gaga/engine-web/runtime/quick-actions-state',
        '@gaga/engine-web/runtime/share',
        '@gaga/engine-web/runtime/service-worker',
        '@gaga/engine-web/runtime/sfx',
        '@gaga/engine-web/runtime/reading-continuity',
        '@gaga/engine-web/runtime/commands',
        '@gaga/engine-web/reader'
      ]
    }
  }
});
