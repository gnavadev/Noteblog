// @ts-check
import { defineConfig, envField } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import compress from 'astro-compress';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Server output matches reality: most routes use prerender=false + Supabase SSR.
  // Static shells can still opt in with `export const prerender = true`.
  output: 'server',
  adapter: cloudflare(),

  site: 'https://www.gabrielnava.dev',

  // Hover/tap prefetch for multipage navigations (View Transitions + MPA links)
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  image: {
    // Allow optimizing/proxying Supabase Storage featured images via astro:assets
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'wsrv.nl',
      },
    ],
  },

  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({
        context: 'client',
        access: 'public',
      }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({
        context: 'client',
        access: 'public',
      }),
      PUBLIC_ADMIN_USER_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: '',
      }),
    },
  },

  integrations: [
    react(),
    mdx(),
    tailwind({
      applyBaseStyles: false,
    }),
    // Must be last — compresses build output (HTML, CSS, JS, SVG)
    // Image compression disabled: remote images are handled by wsrv.nl / astro:assets
    compress({ Image: false }),
  ],

  vite: {
    define: {
      'process.env': {},
      BUILD_ENV: '"production"',
    },
  },
});
