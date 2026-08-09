import type { APIRoute } from 'astro';
import { markdownForPost } from '../../lib/markdown-pages';
import { markdownResponse } from '../../lib/content-negotiation';

export const prerender = false;

/**
 * Explicit /post/{id}.md route so agents can fetch markdown without
 * Accept negotiation (and without middleware ordering quirks on CF).
 */
export const GET: APIRoute = async ({ params }) => {
    const id = params.id;
    if (!id) {
        return markdownResponse('# Not found\n', { status: 404 });
    }

    const md = await markdownForPost(id);
    if (!md) {
        return markdownResponse(
            '# Not found\n\nThat post does not exist or is not public.\n',
            { status: 404 }
        );
    }

    return markdownResponse(md);
};
