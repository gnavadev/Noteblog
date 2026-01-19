export const ADMIN_USER_IDS = (import.meta.env.PUBLIC_ADMIN_USER_ID || '').split(',').filter(Boolean);

export const TOPIC_COLOR_PALETTE = [
    '#ff9500', '#ff2d55', '#007aff', '#5856d6',
    '#00b96b', '#af52de', '#ff3b30', '#ffcc00'
] as const;
