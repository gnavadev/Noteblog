import React, { useRef, useEffect } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { cn } from '@/lib/utils';
import { useCherryDependencies } from './cherry';
import { getCherryWithPlugins } from './cherry/cherryPlugins';

// Plugins are registered via the cherryPlugins module import

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

    // Initialize Editor (Read-Only Mode)
    useEffect(() => {
        if (!dependenciesLoaded) return;
        if (!editorContainerRef.current) return;

        // Clean up previous instance if it exists
        if (editorInstanceRef.current) {
            editorInstanceRef.current = null;
            if (editorContainerRef.current) {
                editorContainerRef.current.innerHTML = '';
            }
        }

        const initCherry = async () => {
            try {
                const CherryClass = await getCherryWithPlugins();
                if (!editorContainerRef.current) return;

                editorInstanceRef.current = new CherryClass({
                    id: uniqueId,
                    value: content,
                    locale: 'en_US',
                    externals: {
                        echarts: window.echarts,
                        katex: window.katex,
                        MathJax: window.MathJax,
                    },
                    engine: {
                        global: {
                            urlProcessor(url: string, srcType: string) {
                                return url;
                            },
                        },
                        syntax: {
                            codeBlock: { theme: 'twilight', wrap: true, lineNumber: false },
                            table: { enableChart: true },
                            fontEmphasis: { allowWhitespace: false },
                            strikethrough: { needWhitespace: false },
                            mathBlock: { engine: 'MathJax' },
                            inlineMath: { engine: 'MathJax' },
                            emoji: { useUnicode: true },
                            header: { anchorStyle: 'none' },
                        },
                    },
                    editor: {
                        defaultModel: 'previewOnly',
                        theme: colorMode === 'dark' ? 'dark' : 'default',
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
                console.error("Cherry Viewer Init Failed:", err);
            }
        };

        initCherry();

        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current = null;
            }
            if (editorContainerRef.current) {
                editorContainerRef.current.innerHTML = '';
            }
        };
    }, [dependenciesLoaded, uniqueId]);

    // Handle Theme Changes via Instance API
    useEffect(() => {
        if (editorInstanceRef.current) {
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'default');
        }
    }, [colorMode, dependenciesLoaded]);

    // Handle Content Updates
    useEffect(() => {
        if (editorInstanceRef.current && content !== editorInstanceRef.current.getMarkdown()) {
            editorInstanceRef.current.setMarkdown(content);
        }
    }, [content]);

    if (!dependenciesLoaded) {
        return <div className="p-4 text-muted-foreground animate-pulse">Loading content...</div>;
    }

    return (
        <div className={cn("cherry-viewer-wrapper break-words", className)} style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
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
