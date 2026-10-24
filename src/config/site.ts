import declaration from '../../gaga.app.json';

export const siteConfig = {
  name: 'PAKRPP',
  title: 'Scalable Knowledge Publication System',
  description: 'Sistem publikasi pengetahuan yang scalable, softcoded, terstruktur, dan berbasis kontras editorial.',
  url: declaration.host.site,
  defaultLanguage: 'id',
  author: 'Editorial Team',
  contact: {
    email: 'hello@pakrpp.id',
    whatsapp: '',
    socialPath: ''
  }
} as const;
