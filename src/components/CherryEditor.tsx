import React, { useRef, useEffect } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { useCherryDependencies } from './cherry';
import { Cherry } from './cherry/cherryPlugins';
import { basicFullConfig } from './cherry/FullConfig';

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
            const config = {
                ...basicFullConfig,
                value: value,
                editor: {
                    ...basicFullConfig.editor,
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                },
                toolbars: {
                    ...basicFullConfig.toolbars,
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                },
                callback: {
                    ...basicFullConfig.callback,
                    afterChange: (markdown: string) => {
                        onChangeRef.current?.(markdown);
                    },
                    fileUpload: (file: File, callback: (url: string) => void) => {
                        onFileUploadRef.current?.(file, callback);
                    },
                },
            };

            editorInstanceRef.current = new Cherry(config);
            window.cherry = editorInstanceRef.current;
        } catch (err) {
            console.error("Cherry Editor Init Failed:", err);
        }

        return () => {
            if (editorInstanceRef.current) {
                editorInstanceRef.current = null;
            }
            if (editorContainerRef.current) {
                editorContainerRef.current.innerHTML = '';
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
