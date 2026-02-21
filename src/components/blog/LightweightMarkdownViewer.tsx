import React, { useMemo } from 'react';
import { marked } from 'marked';
import { useTheme } from './useTheme';

interface MapAttributes {
    [key: string]: string;
}

// Optional: Enable github flavored markdown, breaks, and smart lists
marked.use({
    gfm: true,
    breaks: true,
});

interface LightweightMarkdownViewerProps {
    content: string;
    className?: string;
}

const LightweightMarkdownViewer: React.FC<LightweightMarkdownViewerProps> = ({ content, className }) => {
    // We get the theme mode to conditionally style inverted elements if necessary.
    // Tailwind's dark:prose-invert handles most of this automatically.
    const { colorMode } = useTheme();

    const htmlContent = useMemo(() => {
        if (!content) return '';

        try {
            // Strip any Cherry Markdown specific syntaxes here if needed, 
            // or pass it raw to Marked to render standard markdown.
            // Using standard parsing for performance.
            return marked.parse(content, { async: false }) as string;
        } catch (e) {
            console.error("Marked parsing error:", e);
            return '<p>Error rendering content.</p>';
        }
    }, [content]);

    return (
        <div
            className={`prose prose-slate max-w-none 
                prose-headings:font-bold prose-headings:tracking-tight
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-p:leading-relaxed prose-p:mb-6
                prose-blockquote:border-s-[4px] prose-blockquote:border-primary/50 prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-border/50
                prose-hr:border-border/60
                marker:text-primary/70
                ${colorMode === 'dark' ? 'prose-invert' : ''} 
                ${className || ''}`
            }
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export default LightweightMarkdownViewer;
