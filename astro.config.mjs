// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx()],

  vite: {
    ssr: {
      noExternal: ['@uiw/react-md-editor', '@uiw/react-markdown-preview', '@excalidraw/excalidraw']
    },
    optimizeDeps: {
      include: ['@uiw/react-md-editor', '@uiw/react-markdown-preview']
    },
    define: {
      'process.env': {}
    }
  },

  adapter: vercel()
});