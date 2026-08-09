import { marked } from 'marked';
import { stripCherryFormatting } from './markdown-utils';

marked.use({ gfm: true, breaks: true });

/**
 * Convert markdown to HTML for SSR crawler fallback (Workers-safe).
 * Not a full Cherry renderer — readers get CherryEngine on the client.
 * Lightly strips Cherry-only markers so GFM still parses cleanly.
 */
export function markdownToHtml(markdown: string | null | undefined): string {
    if (!markdown?.trim()) return '';

    try {
        const cleaned = stripCherryFormatting(markdown)
            // Remove common cherry block fences that confuse marked
            .replace(/^:::[^\n]*$/gm, '')
            .replace(/!!\s*(.*?)\s*!!/g, '$1');

        const raw = marked.parse(cleaned, { async: false }) as string;
        return raw
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\son\w+="[^"]*"/gi, '')
            .replace(/\son\w+='[^']*'/gi, '');
    } catch {
        // Fallback: plain text so agents still see something
        const escaped = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<pre class="whitespace-pre-wrap font-sans">${escaped}</pre>`;
    }
}
