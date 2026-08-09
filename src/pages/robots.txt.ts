import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../lib/seo';

export const prerender = false;

export const GET: APIRoute = async () => {
    const body = `User-agent: *
Allow: /

# Editor and auth-only surfaces
Disallow: /editor/

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
};
