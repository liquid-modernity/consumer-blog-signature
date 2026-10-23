function resolveSiteUrl(raw?: string) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'https://example.com';
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return 'https://example.com';
  }
}

export const siteConfig = {
  name: 'PAKRPP',
  title: 'Scalable Knowledge Publication System',
  description: 'Sistem publikasi pengetahuan yang scalable, softcoded, terstruktur, dan berbasis kontras editorial.',
  url: resolveSiteUrl(import.meta.env.PUBLIC_SITE_URL),
  defaultLanguage: 'id',
  author: 'Editorial Team',
  contact: {
    email: 'hello@pakrpp.id',
    whatsapp: '',
    socialPath: ''
  }
} as const;
