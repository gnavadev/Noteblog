import React, { useEffect, useRef, useState } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { cn } from '@/lib/utils';
import { getCherryEngineWithPlugins } from '../cherry/cherryPlugins';
import { useCherryDependencies } from '../cherry/useCherryDependencies';

interface CherryEngineViewerProps {
    content: string;
    colorMode?: 'light' | 'dark';
}

const LOCALE_DATA = {
    maxValue: 'Max',
    minValue: 'Min',
    chartRenderError: 'Chart Error',
    saveAsImage: 'Save as Image',
    copy: 'Copy',
};

// Shim that satisfies `this.cherry.locale` lookups inside CherryEngine plugins.
const CHERRY_SHIM = {
    locale: LOCALE_DATA,
    locales: { en_US: LOCALE_DATA },
    options: { locale: 'en_US', locales: { en_US: LOCALE_DATA } },
};

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

                    engineRef.current = new CherryEngineClass({
                        locale: 'en_US',
                        locales: { en_US: LOCALE_DATA },
                        // Pass the cherry shim as a constructor option so plugins
                        // that access `this.cherry.locale` at init time can resolve it.
                        cherry: CHERRY_SHIM,
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
                                    externals: ['echarts'],
                                },
                                fontEmphasis: { allowWhitespace: false },
                                strikethrough: { needWhitespace: false },
                                mathBlock: { engine: 'MathJax' },
                                inlineMath: { engine: 'MathJax' },
                                emoji: { useUnicode: true },
                                header: { anchorStyle: 'none' },
                            },
                            customSyntax: {
                                mermaid: { syntaxClass: CherryMermaidPlugin, force: true },
                            },
                        },
                        externals: {
                            echarts: window.echarts,
                        },
                        mermaid,
                    });

                    // Immediately patch the instance so any late-binding plugins also
                    // find the correct locale regardless of when they resolve `this.cherry`.
                    // NOTE: CherryEngine (lightweight) does NOT have setTheme() — themes
                    // are handled exclusively via CSS classes on the container element.
                    Object.assign(engineRef.current, {
                        locale: LOCALE_DATA,
                        locales: { en_US: LOCALE_DATA },
                        cherry: CHERRY_SHIM,
                    });
                    if (engineRef.current.options) {
                        engineRef.current.options.locale = 'en_US';
                        engineRef.current.options.locales = { en_US: LOCALE_DATA };
                    }

                    // Create a standalone plugin instance for manual post-render triggers.
                    tableEchartsRef.current = new CherryTableEchartsPlugin({
                        echarts: window.echarts,
                        cherry: CHERRY_SHIM,
                    });
                } catch (e) {
                    console.error('Failed to init Cherry Engine:', e);
                }
            }

            if (engineRef.current && content) {
                try {
                    const markup = engineRef.current.makeHtml(content);
                    if (!isCancelled) setHtml(markup);
                } catch (e) {
                    console.error('Failed to render markdown:', e);
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

    // Post-render triggers: Mermaid, ECharts, MathJax
    useEffect(() => {
        if (!html || !containerRef.current) return;

        const container = containerRef.current;

        // 1. Mermaid
        if (window.mermaid) {
            try {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: colorMode === 'dark' ? 'dark' : 'default',
                    securityLevel: 'loose',
                });
                window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
            } catch (err) {
                console.error('Mermaid render error:', err);
            }
        }

        // 2. ECharts
        if (window.echarts && tableEchartsRef.current) {
            container.querySelectorAll('.cherry-echarts-wrapper').forEach((chartContainer: any) => {
                try {
                    if (chartContainer.getAttribute('data-processed')) return;

                    const chartType = chartContainer.getAttribute('data-chart-type');
                    const tableDataStr = chartContainer.getAttribute('data-table-data');
                    const optionsStr = chartContainer.getAttribute('data-chart-options');

                    if (chartType && tableDataStr) {
                        const tableData = JSON.parse(tableDataStr);
                        const chartOptions = optionsStr ? JSON.parse(optionsStr) : {};
                        const plugin = tableEchartsRef.current;

                        // @ts-ignore
                        plugin.$buildEchartsThemeFromCss(container);
                        // @ts-ignore
                        const fullOptions = plugin.$generateChartOptions(chartType, tableData, chartOptions);
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
                'cherry',
                'cherry-editor',
                `theme__${colorMode}`,
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