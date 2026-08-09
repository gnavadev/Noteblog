/**
 * Helpers for Open Graph / social preview metadata.
 *
 * LinkedIn requires og:title, og:description, og:image, and og:url, and rejects
 * images that are >5 MB, smaller than 1200×627, or blocked from crawlers.
 * Supabase Storage public URLs send `x-robots-tag: none`, so we proxy OG images
 * through wsrv.nl to produce a crawler-friendly 1200×630 JPEG.
 */

export const SITE_ORIGIN = 'https://www.gabrielnava.dev';
export const SITE_NAME = 'Gabriel Nava';
export const DEFAULT_DESCRIPTION =
    "Gabriel's library of thoughts, projects, and travel essays.";

/** Absolute URL of the default (local) share image before OG resizing. */
export const DEFAULT_OG_SOURCE = `${SITE_ORIGIN}/GabrielPhoto.jpg`;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Build a LinkedIn-safe absolute og:image URL.
 * - Forces 1200×630 JPEG under typical size limits
 * - Avoids Supabase's x-robots-tag: none by proxying through wsrv.nl
 */
export function getOgImageUrl(url?: string | null): string {
    const source = (url && url.trim()) || DEFAULT_OG_SOURCE;

    // Already an optimized OG URL — don't double-wrap
    if (source.includes('wsrv.nl/') && source.includes('w=1200')) {
        return source;
    }

    // Absolute remote or local path → absolute source for the proxy
    let absoluteSource: string;
    try {
        absoluteSource = new URL(source, SITE_ORIGIN).href;
    } catch {
        absoluteSource = DEFAULT_OG_SOURCE;
    }

    const params = new URLSearchParams({
        url: absoluteSource,
        w: String(OG_WIDTH),
        h: String(OG_HEIGHT),
        fit: 'cover',
        output: 'jpg',
        q: '80',
    });

    return `https://wsrv.nl/?${params.toString()}`;
}

/**
 * Strip markdown/Cherry noise and collapse whitespace for meta descriptions.
 */
export function plainTextExcerpt(content: string | null | undefined, maxLen = 160): string {
    if (!content) return DEFAULT_DESCRIPTION;

    let text = content
        // fenced code blocks
        .replace(/```[\s\S]*?```/g, ' ')
        // images ![alt](url)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        // links [text](url) → text
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        // headings / blockquotes / list markers
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // inline code / bold / italic / strikethrough
        .replace(/`([^`]+)`/g, '$1')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/~~(.*?)~~/g, '$1')
        // cherry / html-ish leftovers
        .replace(/^:::\s*[a-zA-Z0-9-]*\s*$/gm, '')
        .replace(/!!\s*(.*?)\s*!!/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        // base64 data urls if any leaked into body
        .replace(/data:image\/[^;]+;base64,[^\s)"]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return DEFAULT_DESCRIPTION;

    if (text.length <= maxLen) return text;

    const slice = text.slice(0, maxLen);
    const lastSpace = slice.lastIndexOf(' ');
    const trimmed = (lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
    return `${trimmed}…`;
}

export function absoluteUrl(pathOrUrl: string, base: string | URL = SITE_ORIGIN): string {
    try {
        return new URL(pathOrUrl, base).href;
    } catch {
        return SITE_ORIGIN;
    }
}
