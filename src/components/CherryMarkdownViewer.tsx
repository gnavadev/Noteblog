import React, { useState, useRef, useEffect } from 'react';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import 'cherry-markdown/dist/cherry-markdown.css';
// @ts-ignore
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
// @ts-ignore
import CherryTableEchartsPlugin from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin';
import mermaid from 'mermaid';
import { cn } from '@/lib/utils';

// Register Plugins immediately (Global registration)
try {
    Cherry.usePlugin(CherryMermaidPlugin, {
        mermaid,
    });
    Cherry.usePlugin(CherryTableEchartsPlugin);
} catch (e) {
    // console.warn("Plugins already registered or failed:", e);
}

declare global {
    interface Window {
        echarts: any;
        katex: any;
        MathJax: any;
        mermaid: any;
    }
}

interface CherryMarkdownViewerProps {
    content: string;
    colorMode: 'light' | 'dark';
    className?: string;
}

const CherryMarkdownViewer = React.memo(({ content, colorMode, className }: CherryMarkdownViewerProps) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
    const uniqueId = useRef(`cherry-viewer-${Math.random().toString(36).substring(2, 9)}`).current;

    // Load External Scripts (MathJax, ECharts) with Safety Timeout
    useEffect(() => {
        let isMounted = true;
        const loadScript = (src: string, globalKey: string): Promise<void> => {
            return new Promise((resolve) => {
                if ((window as any)[globalKey]) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => {
                    console.warn(`Failed to load ${src}, continuing...`);
                    resolve(); // Resolve anyway to not block editor
                };
                document.head.appendChild(script);
            });
        };

        const loadDependencies = async () => {
            try {
                // Race between loading and a 2-second timeout
                await Promise.race([
                    Promise.all([
                        loadScript('/libs/echarts.min.js', 'echarts'),
                        loadScript('/libs/tex-svg.js', 'MathJax')
                    ]),
                    new Promise(resolve => setTimeout(resolve, 2000)) // Safety timeout
                ]);
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) setDependenciesLoaded(true);
            }
        };

        loadDependencies();
        return () => { isMounted = false; };
    }, []);

    // Initialize Editor (Read-Only Mode)
    useEffect(() => {
        if (!dependenciesLoaded) return;
        if (!editorContainerRef.current) return;

        // Clean up previous instance if it exists
        if (editorInstanceRef.current) {
            // Manual cleanup since destroy() might not be perfect or exist on all versions
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
                        codeBlock: {
                            theme: 'twilight',
                            wrap: true,
                            lineNumber: false, // Cleaner for reading
                        },
                        table: {
                            enableChart: true,
                        },
                        fontEmphasis: {
                            allowWhitespace: false,
                        },
                        strikethrough: {
                            needWhitespace: false,
                        },
                        mathBlock: {
                            engine: 'MathJax',
                        },
                        inlineMath: {
                            engine: 'MathJax',
                        },
                        emoji: {
                            useUnicode: true,
                        },
                    },
                },
                editor: {
                    defaultModel: 'previewOnly', // Pure Preview Mode
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                    height: '100%',
                    showFullWidthMark: false,
                },
                toolbars: {
                    showToolbar: false, // Hide Toolbar
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                },
            });
        } catch (err) {
            console.error("Cherry Viewer Init Failed:", err);
        }

        return () => {
            // Cleanup on unmount or re-run
            if (editorInstanceRef.current) {
                editorInstanceRef.current = null;
            }
            if (editorContainerRef.current) {
                editorContainerRef.current.innerHTML = '';
            }
        };
    }, [dependenciesLoaded, uniqueId, colorMode]); // Include colorMode to force re-init

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
            <style>{`
                /* Override Cherry Default Backgrounds to match App Theme */
                #${uniqueId} .cherry-previewer,
                #${uniqueId} .cherry-editor {
                    background-color: transparent !important;
                    color: hsl(var(--foreground)) !important;
                }
                
                /* Ensure logic matches site theme */
                #${uniqueId} p, 
                #${uniqueId} h1, #${uniqueId} h2, #${uniqueId} h3, 
                #${uniqueId} h4, #${uniqueId} h5, #${uniqueId} h6,
                #${uniqueId} li, #${uniqueId} span {
                    color: inherit !important;
                }

                /* Fix Code Blocks to blend better or use a compatible dark styling */
                #${uniqueId} code {
                   background-color: hsl(var(--muted)) !important; 
                   color: hsl(var(--primary)) !important;
                }
                
                #${uniqueId} pre {
                    background-color: hsl(var(--card)) !important;
                    border: 1px solid hsl(var(--border)) !important;
                    border-radius: var(--radius) !important;
                }
            `}</style>
            <div id={uniqueId} ref={editorContainerRef} />
        </div>
    );
});

CherryMarkdownViewer.displayName = 'CherryMarkdownViewer';

export default CherryMarkdownViewer;
