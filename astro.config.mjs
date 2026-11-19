import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.bonaidea.pro',
  integrations: [sitemap()],
});
