import { defineMiddleware } from 'astro:middleware';
import { prefersMarkdown, markdownResponse } from './lib/content-negotiation';
import {
    markdownForHome,
    markdownForPostsIndex,
    markdownForPost,
    markdownForTopic,
} from './lib/markdown-pages';

const CANONICAL_HOST = 'www.gabrielnava.dev';

/**
 * Redirect the apex domain to the canonical www host. Supabase auth cookies
 * are host-only, so a session created on gabrielnava.dev is invisible on
 * www.gabrielnava.dev (and vice versa) — serving both hosts made visitors
 * appear logged out depending on which one they landed on.
 *
 * Also implements Accept: text/markdown content negotiation (no Cloudflare Pro
 * "Markdown for Agents" required): agents get clean markdown; browsers get HTML.
 */
export const onRequest = defineMiddleware(async ({ request }, next) => {
    const url = new URL(request.url);

    if (url.hostname === 'gabrielnava.dev') {
        url.hostname = CANONICAL_HOST;
        return Response.redirect(url.toString(), 301);
    }

    if (request.method !== 'GET') {
        return next();
    }

    // Explicit .md URLs always return markdown (no special Accept header needed).
    // Many agents fetch /page.md or follow rel="alternate" type="text/markdown".
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

            const postMatch = path.match(/^\/post\/([^/]+)$/);
            if (postMatch) {
                const md = await markdownForPost(postMatch[1]);
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

            // Unknown .md path
            if (wantsExplicitMd) {
                return markdownResponse('# Not found\n', { status: 404 });
            }
        } catch (err) {
            console.error('[markdown-negotiation]', err);
            // Fall through to normal HTML handling on failure
        }
    }

    return next();
});
