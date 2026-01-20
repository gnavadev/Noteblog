import React, { useRef, useEffect } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { useCherryDependencies } from './cherry';
import { Cherry } from './cherry/cherryPlugins';

// Plugins are registered via the cherryPlugins module import

interface CherryEditorProps {
    value: string;
    onChange: (value: string) => void;
    onFileUpload: (file: File, callback: (url: string) => void) => void;
    colorMode: 'light' | 'dark';
}

const CherryEditor = React.memo(({ value, onChange, onFileUpload, colorMode }: CherryEditorProps) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const { dependenciesLoaded } = useCherryDependencies();

    // Stable refs for callbacks
    const onChangeRef = useRef(onChange);
    const onFileUploadRef = useRef(onFileUpload);

    useEffect(() => {
        onChangeRef.current = onChange;
        onFileUploadRef.current = onFileUpload;
    }, [onChange, onFileUpload]);

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
                        codeBlock: { theme: 'twilight', wrap: true, lineNumber: true },
                        table: { enableChart: true },
                        fontEmphasis: { allowWhitespace: false },
                        strikethrough: { needWhitespace: false },
                        mathBlock: { engine: 'MathJax' },
                        inlineMath: { engine: 'MathJax' },
                        emoji: { useUnicode: true },
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
                        { insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'pdf', 'word', 'file'] },
                        'graph', 'togglePreview', 'settings', 'codeTheme', 'proTable', 'search', 'shortcutKey'
                    ],
                    toolbarRight: ['fullScreen', '|', 'export', 'changeLocale', 'wordCount'],
                    sidebar: ['mobilePreview', 'copy', 'theme', 'toc'],
                    toc: { defaultModel: 'full' },
                    bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'],
                    float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'table', 'code'],
                },
                fileModule: {
                    fileUpload: (file: File, callback: (url: string) => void) => {
                        onFileUploadRef.current?.(file, callback);
                    },
                },
                callback: {
                    afterChange: (markdown: string) => {
                        onChangeRef.current?.(markdown);
                    },
                    fileUpload: (file: File, callback: (url: string) => void) => {
                        onFileUploadRef.current?.(file, callback);
                    },
                },
            });
        } catch (err) {
            console.error("Cherry Editor Init Failed:", err);
        }

        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current = null;
            }
        };
    }, [dependenciesLoaded]);

    // Handle Theme Changes
    useEffect(() => {
        if (editorInstanceRef.current?.setTheme) {
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'light');
            editorInstanceRef.current.toolbar?.setTheme?.(colorMode === 'dark' ? 'dark' : 'light');
        }
    }, [colorMode]);

    if (!dependenciesLoaded) {
        return <div className="h-full w-full flex items-center justify-center text-gray-400">Loading Editor Resources...</div>;
    }

    return <div id="cherry-markdown-container" ref={editorContainerRef} className="h-full w-full" />;
});

CherryEditor.displayName = 'CherryEditor';

export default CherryEditor;
