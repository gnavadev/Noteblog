// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare(),

  site: 'https://www.gabrielnava.dev', // ← Update this to your new domain

  integrations: [
    react(),
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    // Must be last — compresses build output (HTML, CSS, JS, SVG)
    // Image compression disabled: remote images are handled by /api/image proxy
    compress({ Image: false }),
  ],

  vite: {
    define: {
      'process.env': {},
      'BUILD_ENV': '"production"'
    }
  }
});