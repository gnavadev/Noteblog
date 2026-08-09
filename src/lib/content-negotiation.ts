/**
 * HTTP content negotiation helpers for agent-friendly text/markdown responses.
 * Replaces Cloudflare "Markdown for Agents" (Pro+) with app-level negotiation.
 */

export function prefersMarkdown(acceptHeader: string | null | undefined): boolean {
    if (!acceptHeader) return false;

    const parts = acceptHeader.split(',').map((raw) => {
        const segments = raw.trim().split(';').map((s) => s.trim());
        const type = (segments[0] || '').toLowerCase();
        const qPart = segments.find((s) => s.startsWith('q='));
        const q = qPart ? Number.parseFloat(qPart.slice(2)) : 1;
        return { type, q: Number.isFinite(q) ? q : 1 };
    });

    const markdown = parts.find((p) => p.type === 'text/markdown');
    if (!markdown || markdown.q <= 0) return false;

    const html = parts.find((p) => p.type === 'text/html');
    if (!html) return true;

    // Prefer markdown when its quality is at least as high as HTML
    return markdown.q >= html.q;
}

/** Rough token estimate (OpenAI-style ~4 chars/token). */
export function estimateMarkdownTokens(markdown: string): number {
    if (!markdown) return 0;
    return Math.max(1, Math.ceil(markdown.length / 4));
}

function yamlEscape(value: string): string {
    // Quote if needed for YAML safety
    if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
    }
    return value;
}

export function buildMarkdownDocument(options: {
    title: string;
    description?: string;
    image?: string | null;
    url?: string;
    body: string;
}): string {
    const lines: string[] = ['---', `title: ${yamlEscape(options.title)}`];
    if (options.description) {
        lines.push(`description: ${yamlEscape(options.description)}`);
    }
    if (options.image) {
        lines.push(`image: ${yamlEscape(options.image)}`);
    }
    if (options.url) {
        lines.push(`url: ${yamlEscape(options.url)}`);
    }
    lines.push('---', '', options.body.trim(), '');
    return lines.join('\n');
}

export function markdownResponse(markdown: string, init?: ResponseInit): Response {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    headers.set('Vary', 'Accept');
    headers.set('x-markdown-tokens', String(estimateMarkdownTokens(markdown)));
    if (!headers.has('Cache-Control')) {
        headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
    }

    return new Response(markdown, {
        status: init?.status ?? 200,
        headers,
    });
}
