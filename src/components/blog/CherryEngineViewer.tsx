import React, { useEffect, useRef, useState, useMemo } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { cn } from '@/lib/utils';
import { getCherryEngineWithPlugins } from '../cherry/cherryPlugins';
import { useCherryDependencies } from '../cherry/useCherryDependencies';

interface CherryEngineViewerProps {
    content: string;
    colorMode?: 'light' | 'dark';
}

const CherryEngineViewer: React.FC<CherryEngineViewerProps> = ({ content, colorMode = 'light' }) => {
    const [html, setHtml] = useState<string>('');
    const engineRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { dependenciesLoaded } = useCherryDependencies();

    useEffect(() => {
        let isCancelled = false;

        const initAndRender = async () => {
            if (!engineRef.current) {
                try {
                    const {
                        CherryEngineClass,
                        CherryMermaidPlugin,
                        CherryTableEchartsPlugin,
                        mermaid
                    } = await getCherryEngineWithPlugins();

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
                                emoji: { useUnicode: true },
                                header: { anchorStyle: 'none' },
                            },
                            customSyntax: {
                                mermaid: { syntaxClass: CherryMermaidPlugin, force: true },
                                tableEcharts: { syntaxClass: CherryTableEchartsPlugin, force: true }
                            }
                        },
                        // Pass mermaid lib to the engine/plugins that might need it
                        mermaid
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
    }, [content, dependenciesLoaded]);

    // Handle post-render triggers (Mermaid, ECharts, MathJax)
    useEffect(() => {
        if (!html || !containerRef.current) return;

        const container = containerRef.current;

        // 1. Mermaid Rendering
        if (window.mermaid) {
            try {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: colorMode === 'dark' ? 'dark' : 'default',
                    securityLevel: 'loose',
                });
                window.mermaid.run({
                    nodes: container.querySelectorAll('.mermaid'),
                });
            } catch (err) {
                console.error('Mermaid render error:', err);
            }
        }

        // 2. ECharts Rendering
        // The table-echarts plugin usually produces containers with specific data attributes
        if (window.echarts) {
            const chartContainers = container.querySelectorAll('.cherry-table-echarts-container');
            chartContainers.forEach((chartContainer: any) => {
                try {
                    // This is a bit of a hack since we are bypassing the full Cherry editor's lifecycle
                    // Most plugins have a static 'render' or similar, but we might need to manual init
                    if (chartContainer.getAttribute('data-processed')) return;

                    const chartData = chartContainer.getAttribute('data-options');
                    if (chartData) {
                        const options = JSON.parse(chartData);
                        const chart = window.echarts.init(chartContainer, colorMode === 'dark' ? 'dark' : undefined);
                        chart.setOption(options);
                        chartContainer.setAttribute('data-processed', 'true');
                    }
                } catch (err) {
                    console.error('ECharts render error:', err);
                }
            });
        }
    }, [html, colorMode]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "cherry-editor",
                colorMode === 'dark' ? 'cherry-editor--dark' : 'cherry-editor--light'
            )}
            data-theme={colorMode}
        >
            <div className="cherry-previewer" style={{ display: 'block' }}>
                <div
                    className="cherry-markdown"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </div>
    );
};

export default CherryEngineViewer;
