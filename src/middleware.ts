import { defineMiddleware } from 'astro:middleware';

const CANONICAL_HOST = 'www.gabrielnava.dev';

/**
 * Redirect the apex domain to the canonical www host. Supabase auth cookies
 * are host-only, so a session created on gabrielnava.dev is invisible on
 * www.gabrielnava.dev (and vice versa) — serving both hosts made visitors
 * appear logged out depending on which one they landed on.
 */
export const onRequest = defineMiddleware(({ request }, next) => {
    const url = new URL(request.url);
    if (url.hostname === 'gabrielnava.dev') {
        url.hostname = CANONICAL_HOST;
        return Response.redirect(url.toString(), 301);
    }
    return next();
});
