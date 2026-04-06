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

