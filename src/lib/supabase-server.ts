import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

function getSupabaseEnv() {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
    }

    return { supabaseUrl, supabaseAnonKey };
}

/**
 * Stateless anon client for SSR / Workers (no browser APIs, no cookies).
 * Use for public reads: sitemaps, public post lists, etc.
 */
export function createSupabaseAnonClient() {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}

/**
 * Creates a Supabase client that reads the auth session from the incoming
 * request cookies. Use this in SSR Astro pages to verify auth server-side
 * and to load private notes the visitor is allowed to see.
 */
export function createSupabaseServerClient(request: Request, cookies: AstroCookies) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return parseCookieHeader(request.headers.get('Cookie') ?? '')
                    .filter((c): c is { name: string; value: string } => c.value !== undefined);
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    cookies.set(name, value, options);
                });
            },
        },
    });
}
