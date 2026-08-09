import type { APIRoute } from 'astro';
import { createSupabaseAnonClient } from '../lib/supabase-server';
import {
    SITE_ORIGIN,
    SITE_NAME,
    DEFAULT_DESCRIPTION,
    plainTextExcerpt,
    AUTHOR_NAME,
} from '../lib/seo';

export const prerender = false;

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
    const supabase = createSupabaseAnonClient();
    const { data: posts } = await supabase
        .from('notes')
        .select('id, title, topic, created_at, content, featured_image')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

    const items = (posts ?? [])
        .map((p) => {
            const link = `${SITE_ORIGIN}/post/${p.id}`;
            const desc = plainTextExcerpt(p.content, 300);
            const pub = p.created_at
                ? new Date(p.created_at).toUTCString()
                : new Date().toUTCString();
            return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${escapeXml(desc)}</description>
      <category>${escapeXml(p.topic || 'General')}</category>
      <author>${escapeXml(AUTHOR_NAME)}</author>
    </item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_ORIGIN}/</link>
    <description>${escapeXml(DEFAULT_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
    });
};
