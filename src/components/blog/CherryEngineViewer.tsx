import React, { useEffect, useRef, useState } from 'react';
// Import only the engine, not the full editor
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.esm.js';

interface CherryEngineViewerProps {
    content: string;
}

const CherryEngineViewer: React.FC<CherryEngineViewerProps> = ({ content }) => {
    const [html, setHtml] = useState<string>('');
    const engineRef = useRef<any>(null);

    useEffect(() => {
        if (!engineRef.current) {
            try {
                // Initialize engine instance
                engineRef.current = new CherryEngine({
                    engine: {
                        syntax: {
                            codeBlock: { theme: 'twilight', wrap: true, lineNumber: false },
                            table: { enableChart: true },
                            fontEmphasis: { allowWhitespace: false },
                            strikethrough: { needWhitespace: false },
                            mathBlock: { engine: 'MathJax' },
                            inlineMath: { engine: 'MathJax' },
                        }
                    }
                });
            } catch (e) {
                console.error("Failed to init Cherry Engine", e);
            }
        }

        if (engineRef.current && content) {
            try {
                const markup = engineRef.current.makeHtml(content);
                setHtml(markup);
            } catch (e) {
                console.error("Failed to render markdown", e);
                setHtml('<p>Error rendering content</p>');
            }
        }
    }, [content]);

    return (
        <div
            className="cherry-markdown"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default CherryEngineViewer;
