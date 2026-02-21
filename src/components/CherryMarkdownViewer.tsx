import React, { useRef, useEffect } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { cn } from '@/lib/utils';
import { useCherryDependencies } from './cherry';
import { getCherryWithPlugins } from './cherry/cherryPlugins';

interface CherryMarkdownViewerProps {
    content: string;
    colorMode: 'light' | 'dark';
    className?: string;
}

const CherryMarkdownViewer = React.memo(({ content, colorMode, className }: CherryMarkdownViewerProps) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const { dependenciesLoaded } = useCherryDependencies();
    const uniqueId = useRef(`cherry-viewer-${Math.random().toString(36).substring(2, 9)}`).current;

    const contentRef = useRef(content);
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Initialize Editor (Read-Only / Preview-Only Mode)
    useEffect(() => {
        if (!dependenciesLoaded) return;
        if (!editorContainerRef.current) return;

        let isCancelled = false;

        if (editorInstanceRef.current) {
            editorInstanceRef.current = null;
            if (editorContainerRef.current) editorContainerRef.current.innerHTML = '';
        }

        const initCherry = async () => {
            try {
                const CherryClass = await getCherryWithPlugins();
                if (isCancelled || !editorContainerRef.current) return;

                // Yield to allow the CSS Drawer slide animation to finish before
                // blocking the main thread with heavy markdown parsing.
                await new Promise(resolve => setTimeout(resolve, 400));
                if (isCancelled || !editorContainerRef.current) return;

                // Prevent Strict Mode concurrent dual-initialization corrupting the DOM.
                if (editorInstanceRef.current) return;

                editorInstanceRef.current = new CherryClass({
                    id: uniqueId,
                    value: contentRef.current,
                    locale: 'en_US',
                    externals: {
                        echarts: window.echarts,
                        katex: window.katex,
                        MathJax: window.MathJax,
                    },
                    engine: {
                        global: {
                            urlProcessor(url: string, srcType: string) { return url; },
                        },
                        syntax: {
                            codeBlock: { theme: 'twilight', wrap: true, lineNumber: false },
                            table: { enableChart: true },
                            fontEmphasis: { allowWhitespace: false },
                            strikethrough: { needWhitespace: false },
                            mathBlock: { engine: 'MathJax' },
                            inlineMath: { engine: 'MathJax' },
                            emoji: { useUnicode: true },
                            // Let Cherry use its default anchor behaviour (shows § symbol)
                        },
                    },
                    editor: {
                        defaultModel: 'previewOnly',
                        theme: colorMode === 'dark' ? 'dark' : 'default',
                        // Setting height to auto causes Cherry to add extra padding/min-height.
                        // Use 100% and let the parent control sizing instead.
                        height: '100%',
                        showFullWidthMark: false,
                        editable: false,
                    },
                    toolbars: {
                        showToolbar: false,
                        theme: colorMode === 'dark' ? 'dark' : 'default',
                    },
                });
            } catch (err) {
                console.error('Cherry Viewer Init Failed:', err);
            }
        };

        initCherry();

        return () => {
            isCancelled = true;
            editorInstanceRef.current = null;
            if (editorContainerRef.current) editorContainerRef.current.innerHTML = '';
        };
    }, [dependenciesLoaded, uniqueId]);

    // Theme changes
    useEffect(() => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'default');
        }
    }, [colorMode, dependenciesLoaded]);

    // Content updates
    useEffect(() => {
        if (editorInstanceRef.current && content !== editorInstanceRef.current.getMarkdown()) {
            editorInstanceRef.current.setMarkdown(content);
        }
    }, [content]);

    if (!dependenciesLoaded) {
        return <div className="p-4 text-muted-foreground animate-pulse">Loading content...</div>;
    }

    return (
        <div
            className={cn('cherry-viewer-wrapper break-words', className)}
            style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
        >
            <style>{`
                #${uniqueId} img {
                    pointer-events: none !important;
                    user-select: none !important;
                    -webkit-user-drag: none !important;
                }
                #${uniqueId} .cherry-img-resizer {
                    display: none !important;
                }
            `}</style>
            <div id={uniqueId} ref={editorContainerRef} />
        </div>
    );
});

CherryMarkdownViewer.displayName = 'CherryMarkdownViewer';

export default CherryMarkdownViewer;