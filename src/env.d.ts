/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly PUBLIC_SUPABASE_URL: string;
    readonly PUBLIC_SUPABASE_ANON_KEY: string;
    readonly PUBLIC_ADMIN_USER_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare namespace App {
    interface Locals {
        /** Session-aware Supabase client (cookie-backed), when available */
        supabase?: import('@supabase/supabase-js').SupabaseClient;
        /** Authenticated user from cookies, if any */
        user?: import('@supabase/supabase-js').User | null;
    }
}
