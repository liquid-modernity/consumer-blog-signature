import {defineConfig} from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import emdash, {local} from 'emdash/astro';
import {sqlite} from 'emdash/db';
export default defineConfig({
  site: 'http://localhost:4321',
  output: 'server',
  adapter: node({mode:'standalone'}),
  integrations: [react(), emdash({
    database: sqlite({url:'file:./.data/cms.db'}),
    storage: local({directory:'./.data/uploads',baseUrl:'/_emdash/api/media/file'})
  })],
  server: {host:'127.0.0.1',port:4321},
  devToolbar: {enabled:false},
  vite: {build:{cssMinify:'esbuild'}}
});
