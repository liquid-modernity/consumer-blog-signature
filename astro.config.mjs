import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { rehypeTaskListAccessibility } from '@gaga/engine/content/task-list-accessibility';
import { toStarlightSidebar } from './src/config/nav.ts';
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
  integrations: [
    starlight({
      title: 'Consumer Blog Signature',
      description: 'Configurable high-end publishing bootstrap.',
      titleDelimiter: '•',
      favicon: '/favicon.ico',
      customCss: ['./src/styles/tokens.css', './src/styles/signature.scss'],
      components: {
        Header: './src/components/starlight/Header.astro',
        PageFrame: './src/components/starlight/PageFrame.astro',
        ContentPanel: './src/components/starlight/ContentPanel.astro',
        MarkdownContent: './src/components/starlight/MarkdownContent.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        Sidebar: './src/components/starlight/Sidebar.astro',
        PageSidebar: './src/components/starlight/PageSidebar.astro',
        Head: './src/components/starlight/Head.astro',
        Footer: './src/components/starlight/Footer.astro',
        LastUpdated: './src/components/starlight/LastUpdated.astro'
      },
      locales: {
        root: {
          label: 'Bahasa Indonesia',
          lang: 'id-ID'
        }
      },
      pagefind: false,
      disable404Route: true,
      pagination: false,
      lastUpdated: false,
      sidebar: toStarlightSidebar()
    })
  ],
  vite: {
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
