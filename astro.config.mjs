// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),

  site: 'https://noteblog-self.vercel.app',

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
      'process.env': {}
    }
  }
});