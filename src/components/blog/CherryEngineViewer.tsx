import React, { useEffect, useRef, useState } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { getCherryEngineWithPlugins } from '../cherry/cherryPlugins';

interface CherryEngineViewerProps {
    content: string;
}

const CherryEngineViewer: React.FC<CherryEngineViewerProps> = ({ content }) => {
    const [html, setHtml] = useState<string>('');
    const engineRef = useRef<any>(null);

    useEffect(() => {
        let isCancelled = false;

        const initAndRender = async () => {
            if (!engineRef.current) {
                try {
                    const CherryEngineClass = await getCherryEngineWithPlugins();
                    if (isCancelled) return;

                    // Initialize engine instance
                    engineRef.current = new CherryEngineClass({
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
                    if (!isCancelled) {
                        setHtml(markup);
                    }
                } catch (e) {
                    console.error("Failed to render markdown", e);
                    if (!isCancelled) setHtml('<p>Error rendering content</p>');
                }
            }
        };

        if (content) {
            initAndRender();
        }

        return () => {
            isCancelled = true;
        };
    }, [content]);

    return (
        <div
            className="cherry-markdown"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default CherryEngineViewer;
