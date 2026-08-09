/**
 * Build clean markdown representations of public site pages for agents.
 */
import { createSupabaseAnonClient } from './supabase-server';
import {
    SITE_ORIGIN,
    SITE_NAME,
    DEFAULT_DESCRIPTION,
    plainTextExcerpt,
    getOgImageUrl,
} from './seo';
import { buildMarkdownDocument } from './content-negotiation';

export async function markdownForHome(): Promise<string> {
    const supabase = createSupabaseAnonClient();
    const { data: posts } = await supabase
        .from('notes')
        .select('id, title, created_at, topic, read_time_minutes')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

    const list = (posts ?? [])
        .map((p) => {
            const date = p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '';
            return `- [${p.title}](${SITE_ORIGIN}/post/${p.id}) (${p.topic || 'General'}${date ? `, ${date}` : ''}${p.read_time_minutes ? `, ${p.read_time_minutes} min` : ''})`;
        })
        .join('\n');

    const body = `# ${SITE_NAME}

${DEFAULT_DESCRIPTION}

## Recent posts

${list || '_No public posts yet._'}

## Links

- [All posts](${SITE_ORIGIN}/posts)
- [Sitemap](${SITE_ORIGIN}/sitemap.xml)
`;

    return buildMarkdownDocument({
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        image: getOgImageUrl(null),
        url: `${SITE_ORIGIN}/`,
        body,
    });
}

export async function markdownForPostsIndex(): Promise<string> {
    const supabase = createSupabaseAnonClient();
    const { data: posts } = await supabase
        .from('notes')
        .select('id, title, created_at, topic, read_time_minutes, content')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    const list = (posts ?? [])
        .map((p) => {
            const excerpt = plainTextExcerpt(p.content, 120);
            const date = p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '';
            return `### [${p.title}](${SITE_ORIGIN}/post/${p.id})

${date ? `*${date}*` : ''} · ${p.topic || 'General'}${p.read_time_minutes ? ` · ${p.read_time_minutes} min read` : ''}

${excerpt}
`;
        })
        .join('\n');

    const body = `# Posts — ${SITE_NAME}

${list || '_No public posts yet._'}
`;

    return buildMarkdownDocument({
        title: `Posts — ${SITE_NAME}`,
        description: DEFAULT_DESCRIPTION,
        url: `${SITE_ORIGIN}/posts`,
        body,
    });
}

export async function markdownForPost(id: string): Promise<string | null> {
    const supabase = createSupabaseAnonClient();
    const { data: post, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at, topic, featured_image, read_time_minutes, is_public')
        .eq('id', id)
        .eq('is_public', true)
        .maybeSingle();

    if (error || !post) return null;

    const date = post.created_at ? new Date(post.created_at).toISOString().slice(0, 10) : '';
    const description = plainTextExcerpt(post.content);
    const body = `# ${post.title}

${date ? `*Published ${date}*` : ''}${post.topic ? ` · **${post.topic}**` : ''}${post.read_time_minutes ? ` · ${post.read_time_minutes} min read` : ''}

${(post.content || '').trim()}
`;

    return buildMarkdownDocument({
        title: post.title,
        description,
        image: getOgImageUrl(post.featured_image),
        url: `${SITE_ORIGIN}/post/${post.id}`,
        body,
    });
}

export async function markdownForTopic(name: string): Promise<string | null> {
    const topicName = decodeURIComponent(name);
    const supabase = createSupabaseAnonClient();
    const { data: posts } = await supabase
        .from('notes')
        .select('id, title, created_at, topic, content')
        .eq('is_public', true)
        .eq('topic', topicName)
        .order('created_at', { ascending: false });

    if (!posts || posts.length === 0) {
        // Also try matching via topics table name even if post.topic string differs
        const { data: all } = await supabase
            .from('notes')
            .select('id, title, created_at, topic, content')
            .eq('is_public', true)
            .order('created_at', { ascending: false });
        const filtered = (all ?? []).filter((p) => p.topic === topicName);
        if (filtered.length === 0) return null;
        return formatTopicMarkdown(topicName, filtered);
    }

    return formatTopicMarkdown(topicName, posts);
}

function formatTopicMarkdown(
    topicName: string,
    posts: Array<{ id: string; title: string; created_at?: string; content?: string }>
): string {
    const list = posts
        .map((p) => {
            const excerpt = plainTextExcerpt(p.content, 120);
            return `- [${p.title}](${SITE_ORIGIN}/post/${p.id}) — ${excerpt}`;
        })
        .join('\n');

    const body = `# Topic: ${topicName}

${list}
`;

    return buildMarkdownDocument({
        title: `${topicName} — ${SITE_NAME}`,
        description: `Posts about ${topicName} on ${SITE_NAME}`,
        url: `${SITE_ORIGIN}/topic/${encodeURIComponent(topicName)}`,
        body,
    });
}
