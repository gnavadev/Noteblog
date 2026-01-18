import React, { useState, useRef, useEffect } from 'react';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import 'cherry-markdown/dist/cherry-markdown.css';
// @ts-ignore
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
// @ts-ignore
import CherryTableEchartsPlugin from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin';
import mermaid from 'mermaid';

// Register Plugins immediately (Global registration)
try {
    Cherry.usePlugin(CherryMermaidPlugin, {
        mermaid,
    });
    Cherry.usePlugin(CherryTableEchartsPlugin);
} catch (e) {
    console.warn("Plugins already registered or failed:", e);
}

declare global {
    interface Window {
        echarts: any;
        katex: any;
        MathJax: any;
        mermaid: any;
    }
}

interface CherryEditorProps {
    value: string;
    onChange: (value: string) => void;
    onFileUpload: (file: File, callback: (url: string) => void) => void;
    colorMode: 'light' | 'dark';
}

const CherryEditor = React.memo(({ value, onChange, onFileUpload, colorMode }: CherryEditorProps) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);

    const [dependenciesLoaded, setDependenciesLoaded] = useState(false);

    // Stable refs for callbacks
    const onChangeRef = useRef(onChange);
    const onFileUploadRef = useRef(onFileUpload);

    useEffect(() => {
        onChangeRef.current = onChange;
        onFileUploadRef.current = onFileUpload;
    }, [onChange, onFileUpload]);

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

    // Initialize Editor
    useEffect(() => {
        if (!dependenciesLoaded) return;
        if (!editorContainerRef.current) return;
        if (editorInstanceRef.current) return;

        try {
            editorInstanceRef.current = new Cherry({
                id: 'cherry-markdown-container',
                value: value,
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
                            lineNumber: true,
                        },
                        table: {
                            enableChart: true,
                        },
                        fontEmphasis: {
                            allowWhitespace: false, // Fix for CJK
                        },
                        strikethrough: {
                            needWhitespace: false,
                        },
                        mathBlock: {
                            engine: 'MathJax', // Use MathJax engine
                        },
                        inlineMath: {
                            engine: 'MathJax', // Use MathJax engine
                        },
                        emoji: {
                            useUnicode: true,
                        },
                    },
                },
                editor: {
                    defaultModel: 'edit&preview',
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                    height: '100%',
                    showFullWidthMark: true,
                    showSuggestList: true,
                    convertWhenPaste: true,
                },
                toolbars: {
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                    showToolbar: true,
                    autoScroll: false,
                    toolbar: [
                        'bold', 'italic',
                        { strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby'] },
                        'size', '|',
                        'color', 'header', '|',
                        'ol', 'ul', 'checklist', 'panel', 'justify', 'detail', '|',
                        'formula',
                        {
                            insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'pdf', 'word', 'file']
                        },
                        'graph', 'togglePreview', 'settings', 'codeTheme', 'proTable', 'search', 'shortcutKey'
                    ],
                    toolbarRight: ['fullScreen', '|', 'export', 'changeLocale', 'wordCount'],
                    sidebar: ['mobilePreview', 'copy', 'theme', 'toc'],
                    toc: {
                        defaultModel: 'full',
                    },
                    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'],
                    float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'table', 'code'],
                },
                fileModule: {
                    fileUpload: (file: File, callback: (url: string) => void) => {
                        if (onFileUploadRef.current) {
                            onFileUploadRef.current(file, callback);
                        }
                    },
                },
                callback: {
                    afterChange: (markdown: string) => {
                        if (onChangeRef.current) {
                            onChangeRef.current(markdown);
                        }
                    },
                    fileUpload: (file: File, callback: (url: string) => void) => {
                        if (onFileUploadRef.current) {
                            onFileUploadRef.current(file, callback);
                        }
                    },
                },
            });
        } catch (err) {
            console.error("Cherry Editor Init Failed:", err);
        }

        return () => {
            if (editorInstanceRef.current) {
                // editorInstanceRef.current.destroy(); // Optional: Check if safe to destroy
                editorInstanceRef.current = null;
            }
        };
    }, [dependenciesLoaded]);

    // Handle Theme Changes
    useEffect(() => {
        if (editorInstanceRef.current && editorInstanceRef.current.setTheme) {
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'light');
            if (editorInstanceRef.current.toolbar && editorInstanceRef.current.toolbar.setTheme) {
                editorInstanceRef.current.toolbar.setTheme(colorMode === 'dark' ? 'dark' : 'light');
            }
        }
    }, [colorMode]);

    if (!dependenciesLoaded) {
        return <div className="h-full w-full flex items-center justify-center text-gray-400">Loading Editor Resources...</div>;
    }

    return <div id="cherry-markdown-container" ref={editorContainerRef} className="h-full w-full" />;
});

CherryEditor.displayName = 'CherryEditor';

export default CherryEditor;
