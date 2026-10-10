export const siteConfig = {
  name: 'Consumer Blog Signature',
  title: 'A configurable publishing surface',
  description: 'Universal, configurable, adjustment-friendly publishing bootstrap powered by Astro and Gaga Engine.',
  url: process.env.PUBLIC_SITE_URL || 'https://example.com',
  defaultLanguage: 'id',
  author: 'Editorial Team',
  contact: {
    email: 'hello@example.com',
    whatsapp: '',
    socialPath: ''
  }
} as const;
