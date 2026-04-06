import { ADMIN_USER_IDS } from './constants';

export const isAdmin = (userId: string | undefined): boolean => {
    if (!userId || ADMIN_USER_IDS.length === 0) return false;
    return ADMIN_USER_IDS.includes(userId);
};

export const getAuthRedirectUrl = (): string =>
    typeof window !== 'undefined' ? window.location.origin : 'https://noteblog-self.vercel.app/';

export const getAvatarUrl = (metadata: any): string | undefined =>
    metadata?.avatar_url || metadata?.picture;

export const getUserDisplayName = (metadata: any, fallback = 'Anonymous'): string =>
    metadata?.full_name || metadata?.name || fallback;

/**
 * Routes Supabase Storage image URLs through our /api/image proxy, which resizes
 * and converts to WebP on the server. Vercel caches the result at the edge so
 * processing only happens once per unique URL+params combination.
 * Falls back to the original URL for non-Supabase images.
 */
export const getOptimizedImageUrl = (
    url: string | null | undefined,
    width: number,
    quality = 75
): string | undefined => {
    if (!url) return undefined;
    if (url.includes('.supabase.co/storage/')) {
        return `/api/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
    }
    return url;
};
