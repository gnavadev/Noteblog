// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),

  site: 'https://www.gabrielnava.dev', // ← Update this to your new domain

  integrations: [
    react(),
    mdx(),
    tailwind({
      applyBaseStyles: false,
    })
  ],

  vite: {
    ssr: {
      noExternal: ['@uiw/react-md-editor', '@uiw/react-markdown-preview', '@excalidraw/excalidraw']
    },

    optimizeDeps: {
      include: ['@uiw/react-md-editor', '@uiw/react-markdown-preview']
    },

    define: {
      'process.env': {},
      'BUILD_ENV': '"production"'
    }
  }
});