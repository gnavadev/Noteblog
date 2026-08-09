import type { APIRoute } from 'astro';
import { createSupabaseAnonClient } from '../lib/supabase-server';
import {
    SITE_ORIGIN,
    SITE_NAME,
    DEFAULT_DESCRIPTION,
    plainTextExcerpt,
} from '../lib/seo';

export const prerender = false;

/**
 * Agent-oriented site map (https://llmstxt.org proposal).
 * Lists public posts with links to .md versions for clean ingestion.
 */
export const GET: APIRoute = async () => {
    const supabase = createSupabaseAnonClient();
    const { data: posts } = await supabase
        .from('notes')
        .select('id, title, topic, created_at, content')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    const postLines = (posts ?? [])
        .map((p) => {
            const summary = plainTextExcerpt(p.content, 120);
            const mdUrl = `${SITE_ORIGIN}/post/${p.id}.md`;
            const topic = p.topic ? ` [${p.topic}]` : '';
            return `- [${p.title}](${mdUrl}):${topic} ${summary}`;
        })
        .join('\n');

    const body = `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

## Posts

${postLines || '_No public posts yet._'}

## Site

- [Home](${SITE_ORIGIN}/): Landing page and intro
- [All posts](${SITE_ORIGIN}/posts): Magazine grid of public posts
- [All posts (markdown)](${SITE_ORIGIN}/posts.md): Same list as clean markdown
- [RSS](${SITE_ORIGIN}/rss.xml): Machine-readable feed of public posts
- [Sitemap](${SITE_ORIGIN}/sitemap.xml): XML sitemap for crawlers

## How to read articles

Prefer the \`.md\` URL for each post (or send \`Accept: text/markdown\`) to get full article text without HTML chrome. HTML pages also server-render the full body for scrapers that do not negotiate markdown.
`;

    return new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
    });
};
