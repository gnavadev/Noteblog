import { supabase } from './supabase';

const POST_LIST_COLUMNS =
    'id, created_at, title, topic, user_id, color, is_public, layout_json, category_color, read_time_minutes, featured_image, topic_id';

/**
 * Loads only the topics list (the sidebar categories). Cheap query used by the
 * landing page, which renders instantly and defers the heavier posts fetch to
 * the client so it streams in while the visitor reads the intro.
 */
export async function loadTopics() {
    const { data } = await supabase
        .from('topics')
        .select('*')
        .order('order', { ascending: true });
    return data || [];
}

/**
 * Loads the data needed to server-render the blog shell: public posts,
 * ordered topics, and a lightweight text excerpt for the most recent posts
 * (the heavy content body is discarded).
 */
export async function loadBlogIndex() {
    const [postsResult, topicsResult, recentContentResult] = await Promise.all([
        supabase
            .from('notes')
            .select(POST_LIST_COLUMNS)
            .eq('is_public', true)
            .order('created_at', { ascending: false }),
        supabase.from('topics').select('*').order('order', { ascending: true }),
        supabase
            .from('notes')
            .select('id, content')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(6),
    ]);

    let posts = postsResult.data || [];
    const topics = topicsResult.data || [];
    const recentContent = recentContentResult.data || [];

    if (recentContent.length > 0) {
        posts = posts.map((post) => {
            const match = recentContent.find((rc) => rc.id === post.id);
            if (match && match.content) {
                // Strip massive base64 image data and truncate text!
                const rawText = match.content.replace(/data:image\/[^;]+;base64,[^)"]+/g, '');
                return { ...post, excerpt: rawText.substring(0, 400) };
            }
            return post;
        });
    }

    return { posts, topics };
}
