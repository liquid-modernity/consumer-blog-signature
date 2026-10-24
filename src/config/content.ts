import { siteConfig } from './site';
import { contentRootConfig as sharedContentRootConfig } from './content-roots.mjs';
import type { ArticlePreviewOptions } from '../lib/content';
import type { ContentDateLocaleConfig } from '@gaga/engine-capabilities/content';

export type GagaContentRootConfig = {
  docsRoot: string;
  sourceOnlyRoot?: string;
  sharedRoot?: string;
};

export const contentRootConfig = sharedContentRootConfig satisfies Readonly<GagaContentRootConfig>;

export const contentDateLocaleConfig = {
  defaultLocale: 'id-ID',
  languageLocales: [
    { language: 'id', locale: 'id-ID' },
    { language: 'en', locale: 'en-US' }
  ]
} as const satisfies ContentDateLocaleConfig;

export const contentPreviewOptions = {
  defaultAuthor: siteConfig.author
} as const satisfies ArticlePreviewOptions;

export const contentDefaults = {
  defaultAuthor: siteConfig.author,
  defaultLanguage: siteConfig.defaultLanguage,
  roots: contentRootConfig,
  dateLocale: contentDateLocaleConfig,
  preview: contentPreviewOptions
} as const;
