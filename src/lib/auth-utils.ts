import { ADMIN_USER_IDS } from './constants';

export const isAdmin = (userId: string | undefined): boolean => {
    if (!userId || ADMIN_USER_IDS.length === 0) return false;
    return ADMIN_USER_IDS.includes(userId);
};
