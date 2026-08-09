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

    const withSecurityHeaders = (response: Response) => {
        const headers = new Headers(response.headers);
        if (!headers.has('X-Content-Type-Options')) {
            headers.set('X-Content-Type-Options', 'nosniff');
        }
        if (!headers.has('Referrer-Policy')) {
            headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        }
        if (!headers.has('X-Frame-Options')) {
            headers.set('X-Frame-Options', 'SAMEORIGIN');
        }
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    };

    if (request.method !== 'GET') {
        return withSecurityHeaders(await next());
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
                return withSecurityHeaders(markdownResponse(await markdownForHome()));
            }
            if (path === '/posts') {
                return withSecurityHeaders(
                    markdownResponse(await markdownForPostsIndex())
                );
            }

            const postMatch = path.match(/^\/post\/([^/]+?)(?:\.md)?$/);
            if (postMatch) {
                const id = postMatch[1].replace(/\.md$/i, '');
                const md = await markdownForPost(id);
                if (!md) {
                    return withSecurityHeaders(
                        markdownResponse(
                            '# Not found\n\nThat post does not exist or is not public.\n',
                            { status: 404 }
                        )
                    );
                }
                return withSecurityHeaders(markdownResponse(md));
            }

            const topicMatch = path.match(/^\/topic\/([^/]+)$/);
            if (topicMatch) {
                const md = await markdownForTopic(topicMatch[1]);
                if (!md) {
                    return withSecurityHeaders(
                        markdownResponse('# Not found\n\nThat topic was not found.\n', {
                            status: 404,
                        })
                    );
                }
                return withSecurityHeaders(markdownResponse(md));
            }

            if (wantsExplicitMd) {
                return withSecurityHeaders(
                    markdownResponse('# Not found\n', { status: 404 })
                );
            }
        } catch (err) {
            console.error('[markdown-negotiation]', err);
        }
    }

    return withSecurityHeaders(await next());
});
