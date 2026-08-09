import { marked } from 'marked';

marked.use({ gfm: true, breaks: true });

/**
 * Convert markdown to HTML for SSR (Workers-safe — no DOM / DOMPurify).
 * Strips script tags after parse for a basic XSS guard on trusted CMS content.
 */
export function markdownToHtml(markdown: string | null | undefined): string {
    if (!markdown?.trim()) return '';

    try {
        const raw = marked.parse(markdown, { async: false }) as string;
        return raw
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '');
    } catch {
        // Fallback: plain text paragraphs so agents still see something
        const escaped = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<pre class="whitespace-pre-wrap font-sans">${escaped}</pre>`;
    }
}
