import type { APIRoute } from 'astro';
import { createSupabaseAnonClient } from '../lib/supabase-server';
import { SITE_ORIGIN } from '../lib/seo';

export const prerender = false;

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatDate(value: string | Date | null | undefined): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

function urlEntry(loc: string, lastmod?: string | null, changefreq?: string, priority?: string): string {
    const parts = [`    <loc>${escapeXml(loc)}</loc>`];
    if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
    if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
    if (priority) parts.push(`    <priority>${priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
}

export const GET: APIRoute = async () => {
    const supabase = createSupabaseAnonClient();
    const today = formatDate(new Date()) ?? new Date().toISOString().slice(0, 10);

    const [postsResult, topicsResult] = await Promise.all([
        supabase
            .from('notes')
            .select('id, created_at')
            .eq('is_public', true)
            .order('created_at', { ascending: false }),
        supabase.from('topics').select('name').order('order', { ascending: true }),
    ]);

    const posts = postsResult.data ?? [];
    const topics = topicsResult.data ?? [];

    const entries: string[] = [
        urlEntry(`${SITE_ORIGIN}/`, today, 'weekly', '1.0'),
        urlEntry(`${SITE_ORIGIN}/posts`, today, 'daily', '0.9'),
        urlEntry(`${SITE_ORIGIN}/board`, today, 'monthly', '0.4'),
        urlEntry(`${SITE_ORIGIN}/llms.txt`, today, 'daily', '0.3'),
        urlEntry(`${SITE_ORIGIN}/rss.xml`, today, 'daily', '0.3'),
    ];

    for (const post of posts) {
        if (!post?.id) continue;
        entries.push(
            urlEntry(
                `${SITE_ORIGIN}/post/${post.id}`,
                formatDate(post.created_at),
                'monthly',
                '0.8'
            )
        );
    }

    for (const topic of topics) {
        if (!topic?.name) continue;
        entries.push(
            urlEntry(
                `${SITE_ORIGIN}/topic/${encodeURIComponent(topic.name)}`,
                today,
                'weekly',
                '0.6'
            )
        );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        },
    });
};
