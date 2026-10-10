import { identityConfig } from './identity';
import { siteConfig } from './site';
import type { SeoContext } from '@gaga/engine/seo';

export const seoConfig = {
  canonical: {
    siteUrl: siteConfig.url
  },
  text: {
    fallbackTitle: siteConfig.title,
    fallbackDescription: siteConfig.description
  },
  jsonLd: {
    siteName: siteConfig.name,
    siteUrl: siteConfig.url,
    defaultLanguage: siteConfig.defaultLanguage,
    defaultAuthor: siteConfig.author,
    publisherLogoPath: '/icons/icon-512.png',
    publisherLogoWidth: 512,
    publisherLogoHeight: 512
  },
  socialImage: {
    defaultImage: identityConfig.defaultOgImage,
    defaultTwitterImage: identityConfig.defaultTwitterImage,
    defaultAlt: identityConfig.defaultSocialAlt,
    width: 1200,
    height: 630
  }
} as const satisfies SeoContext;
