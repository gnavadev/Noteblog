import { defineMiddleware } from 'astro:middleware';
import { prefersMarkdown, markdownResponse } from './lib/content-negotiation';
import {
    markdownForHome,
    markdownForPostsIndex,
    markdownForPost,
    markdownForTopic,
} from './lib/markdown-pages';
import { createSupabaseServerClient } from './lib/supabase-server';

const CANONICAL_HOST = 'www.gabrielnava.dev';

/**
 * - Apex → www host redirect (auth cookies are host-only)
 * - Attach Supabase + user on Astro.locals for SSR pages
 * - Accept: text/markdown / *.md content negotiation for agents
 */
export const onRequest = defineMiddleware(async (context, next) => {
    const { request, cookies, locals } = context;
    const url = new URL(request.url);

    if (url.hostname === 'gabrielnava.dev') {
        url.hostname = CANONICAL_HOST;
        return Response.redirect(url.toString(), 301);
    }

    // Shared SSR context — pages can use Astro.locals.supabase / .user
    try {
        const supabase = createSupabaseServerClient(request, cookies);
        locals.supabase = supabase;
        const {
            data: { user },
        } = await supabase.auth.getUser();
        locals.user = user;
    } catch (err) {
        console.error('[middleware] supabase locals', err);
        locals.user = null;
    }

    if (request.method !== 'GET') {
        return next();
    }

    // Explicit .md URLs always return markdown (no special Accept header needed).
    const pathRaw = url.pathname.replace(/\/$/, '') || '/';
    const wantsExplicitMd = pathRaw.endsWith('.md');
    const path = wantsExplicitMd ? pathRaw.slice(0, -3) || '/' : pathRaw;
    const negotiateMd =
        wantsExplicitMd || prefersMarkdown(request.headers.get('Accept'));

    if (negotiateMd) {
        try {
            if (path === '/') {
                return markdownResponse(await markdownForHome());
            }
            if (path === '/posts') {
                return markdownResponse(await markdownForPostsIndex());
            }

            const postMatch = path.match(/^\/post\/([^/]+?)(?:\.md)?$/);
            if (postMatch) {
                const id = postMatch[1].replace(/\.md$/i, '');
                const md = await markdownForPost(id);
                if (!md) {
                    return markdownResponse(
                        '# Not found\n\nThat post does not exist or is not public.\n',
                        { status: 404 }
                    );
                }
                return markdownResponse(md);
            }

            const topicMatch = path.match(/^\/topic\/([^/]+)$/);
            if (topicMatch) {
                const md = await markdownForTopic(topicMatch[1]);
                if (!md) {
                    return markdownResponse(
                        '# Not found\n\nThat topic was not found.\n',
                        { status: 404 }
                    );
                }
                return markdownResponse(md);
            }

            if (wantsExplicitMd) {
                return markdownResponse('# Not found\n', { status: 404 });
            }
        } catch (err) {
            console.error('[markdown-negotiation]', err);
        }
    }

    return next();
});
