import React, { useRef, useEffect } from 'react';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import 'cherry-markdown/dist/cherry-markdown.css';
// @ts-ignore
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
// @ts-ignore
import CherryTableEchartsPlugin from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin';
import mermaid from 'mermaid';
import { cn } from '@/lib/utils';
import { useCherryDependencies } from './cherry';

// Register Plugins immediately (Global registration)
try {
    Cherry.usePlugin(CherryMermaidPlugin, { mermaid });
    Cherry.usePlugin(CherryTableEchartsPlugin);
} catch (e) {
    // Plugins already registered or failed
}

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

        try {
            editorInstanceRef.current = new Cherry({
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
                    },
                },
                editor: {
                    defaultModel: 'previewOnly',
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                    height: '100%',
                    showFullWidthMark: false,
                },
                toolbars: {
                    showToolbar: false,
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                },
            });
        } catch (err) {
            console.error("Cherry Viewer Init Failed:", err);
        }

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
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'light');
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
        <div className={cn("cherry-viewer-wrapper", className)}>
            <div id={uniqueId} ref={editorContainerRef} />
        </div>
    );
});

CherryMarkdownViewer.displayName = 'CherryMarkdownViewer';

export default CherryMarkdownViewer;
