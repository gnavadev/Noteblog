import { ADMIN_USER_IDS } from './constants';

export const isAdmin = (userId: string | undefined): boolean => {
    if (!userId || ADMIN_USER_IDS.length === 0) return false;
    return ADMIN_USER_IDS.includes(userId);
};

export const getAuthRedirectUrl = (): string =>
    typeof window !== 'undefined' ? window.location.origin : 'https://gabrielnava.dev/';

export const getAvatarUrl = (metadata: any): string | undefined =>
    metadata?.avatar_url || metadata?.picture;

export const getUserDisplayName = (metadata: any, fallback = 'Anonymous'): string =>
    metadata?.full_name || metadata?.name || fallback;

export const getOptimizedImageUrl = (
    url: string | null | undefined,
    width: number,
    quality = 75
): string | undefined => {
    if (!url) return undefined;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&output=webp&q=${quality}&fit=cover`;
};

