import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../lib/seo';

export const prerender = false;

/**
 * Note: Cloudflare may prepend "managed" robots rules (including AI bot
 * Disallows). Allowing major AI bots here helps when managed rules are off
 * or when later rules can override. Check the live file after deploy.
 */
export const GET: APIRoute = async () => {
    const body = `User-agent: *
Allow: /

# Public content is fine for search + AI retrieval
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Googlebot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: bingbot
Allow: /

# Private / author-only surfaces
User-agent: *
Disallow: /editor/

Sitemap: ${SITE_ORIGIN}/sitemap.xml
# Agent-oriented index (markdown-first links)
# https://llmstxt.org
# See also: ${SITE_ORIGIN}/llms.txt
`;

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
};
