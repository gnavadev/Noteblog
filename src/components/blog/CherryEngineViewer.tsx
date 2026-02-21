import React, { useEffect, useRef, useState } from 'react';
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
    const tableEchartsRef = useRef<any>(null);
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

                    const localeData = {
                        maxValue: 'Max',
                        minValue: 'Min',
                        chartRenderError: 'Chart Error',
                        saveAsImage: 'Save as Image',
                    };

                    // Initialize engine instance with native theme settings
                    engineRef.current = new CherryEngineClass({
                        locale: 'en_US',
                        locales: {
                            en_US: localeData
                        },
                        themeSettings: {
                            mainTheme: colorMode,
                            codeBlockTheme: 'default',
                        },
                        engine: {
                            syntax: {
                                codeBlock: { theme: 'twilight', wrap: true, lineNumber: false },
                                table: {
                                    enableChart: true,
                                    chartRenderEngine: CherryTableEchartsPlugin,
                                    externals: ['echarts']
                                },
                                fontEmphasis: { allowWhitespace: false },
                                strikethrough: { needWhitespace: false },
                                mathBlock: { engine: 'MathJax' },
                                inlineMath: { engine: 'MathJax' },
                                emoji: { useUnicode: true },
                                header: { anchorStyle: 'none' },
                            },
                            customSyntax: {
                                mermaid: { syntaxClass: CherryMermaidPlugin, force: true }
                            }
                        },
                        externals: {
                            echarts: window.echarts,
                        },
                        mermaid
                    });

                    // CRITICAL: Manually ensure the engine instance has the locale property
                    // Plugins in Cherry Markdown often access this.cherry.locale directly.
                    // The lightweight engine might not initialize it from options automatically.
                    if (!engineRef.current.locale) {
                        engineRef.current.locale = localeData;
                    }

                    // Create a plugin instance for manual rendering triggers
                    tableEchartsRef.current = new CherryTableEchartsPlugin({
                        echarts: window.echarts,
                        cherry: {
                            locale: localeData
                        }
                    });
                } catch (e) {
                    console.error("Failed to init Cherry Engine", e);
                }
            } else {
                // Update theme if it changed
                engineRef.current.setTheme(colorMode);
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

        if (content && dependenciesLoaded) {
            initAndRender();
        }

        return () => {
            isCancelled = true;
        };
    }, [content, dependenciesLoaded, colorMode]);

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
        if (window.echarts && tableEchartsRef.current) {
            const chartContainers = container.querySelectorAll('.cherry-echarts-wrapper');
            chartContainers.forEach((chartContainer: any) => {
                try {
                    if (chartContainer.getAttribute('data-processed')) return;

                    const chartType = chartContainer.getAttribute('data-chart-type');
                    const tableDataStr = chartContainer.getAttribute('data-table-data');
                    const optionsStr = chartContainer.getAttribute('data-chart-options');

                    if (chartType && tableDataStr) {
                        const tableData = JSON.parse(tableDataStr);
                        const chartOptions = optionsStr ? JSON.parse(optionsStr) : {};

                        const plugin = tableEchartsRef.current;

                        // We need to set the internal theme before rendering
                        // @ts-ignore
                        plugin.$buildEchartsThemeFromCss(container);

                        // Generate options using the plugin's internal method
                        // @ts-ignore
                        const fullOptions = plugin.$generateChartOptions(chartType, tableData, chartOptions);

                        // Create chart
                        // @ts-ignore
                        plugin.createChart(chartContainer, fullOptions, chartType);

                        chartContainer.setAttribute('data-processed', 'true');
                    }
                } catch (err) {
                    console.error('ECharts render error:', err);
                }
            });
        }
    }, [html, colorMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (tableEchartsRef.current && typeof tableEchartsRef.current.onDestroy === 'function') {
                tableEchartsRef.current.onDestroy();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "cherry",
                "cherry-editor",
                // Use native theme classes as documented
                `theme__${colorMode}`
            )}
            style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                background: 'transparent',
                border: 'none',
            }}
        >
            <div className="cherry-previewer" style={{ display: 'block', width: '100%', padding: 0 }}>
                <div
                    className="cherry-markdown"
                    style={{ width: '100%' }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </div>
    );
};

export default CherryEngineViewer;
