import React, { useEffect, useRef, useState } from 'react';
import 'cherry-markdown/dist/cherry-markdown.css';
import { cn } from '@/lib/utils';
import { getCherryEngineWithPlugins } from '../cherry/cherryPlugins';
import { useCherryDependencies } from '../cherry/useCherryDependencies';

interface CherryEngineViewerProps {
    content: string;
    colorMode?: 'light' | 'dark' | 'auto';
}

/** Reads the active color scheme from the document root or media query. */
function detectColorMode(): 'light' | 'dark' {
    const root = document.documentElement;
    if (root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark') return 'dark';
    if (root.classList.contains('light') || root.getAttribute('data-theme') === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    options: { locale: LOCALE_DATA, locales: { en_US: LOCALE_DATA } },
};

/**
 * Recursively walks an object graph and patches any node that has a `cherry`
 * property whose `locale` is missing or is a string (the key, not the data).
 * This catches plugin instances nested arbitrarily deep inside the engine.
 */
function patchCherryLocale(root: any, visited = new WeakSet()): void {
    if (!root || typeof root !== 'object' || visited.has(root)) return;
    visited.add(root);

    if ('cherry' in root && root.cherry) {
        if (!root.cherry.locale || typeof root.cherry.locale === 'string') {
            root.cherry.locale = LOCALE_DATA;
            root.cherry.locales = { en_US: LOCALE_DATA };
        }
    }

    // Also patch direct locale reference (engine itself may be `this.cherry`)
    if ('locale' in root && typeof root.locale === 'string') {
        root.locale = LOCALE_DATA;
    }

    for (const key of Object.keys(root)) {
        try {
            const val = root[key];
            if (val && typeof val === 'object') patchCherryLocale(val, visited);
        } catch {
            // skip non-enumerable / accessor traps
        }
    }
}

const CherryEngineViewer: React.FC<CherryEngineViewerProps> = ({ content, colorMode = 'auto' }) => {
    const [html, setHtml] = useState<string>('');
    const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(
        colorMode === 'auto' ? detectColorMode() : colorMode
    );

    // Keep resolvedMode in sync when colorMode prop changes
    useEffect(() => {
        if (colorMode !== 'auto') setResolvedMode(colorMode);
    }, [colorMode]);

    // Watch for theme changes on the document root (class or data-theme attribute)
    // so the Focus View's theme toggle button is reflected immediately.
    useEffect(() => {
        if (colorMode !== 'auto') return;

        const observer = new MutationObserver(() => {
            setResolvedMode(detectColorMode());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme'],
        });

        // Also watch the system preference in case no class/attr is used
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onMqChange = () => setResolvedMode(detectColorMode());
        mq.addEventListener('change', onMqChange);

        return () => {
            observer.disconnect();
            mq.removeEventListener('change', onMqChange);
        };
    }, [colorMode]);
    const engineRef = useRef<any>(null);
    const tableEchartsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { dependenciesLoaded } = useCherryDependencies();

    useEffect(() => {
        let isCancelled = false;

        const initAndRender = async () => {
            // Reset engine when theme changes so codeBlockTheme re-initializes correctly
            if (engineRef.current && engineRef.current.__resolvedMode !== resolvedMode) {
                engineRef.current = null;
            }

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
                        themeSettings: {
                            mainTheme: resolvedMode,
                            codeBlockTheme: resolvedMode === 'dark' ? 'atom-one-dark' : 'github',
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
                                header: { anchorStyle: 'header_anchor' },
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

                    const engine = engineRef.current;

                    // Patch the engine instance itself — it IS `this.cherry` for many plugins.
                    // Tag the engine with current theme so we can detect mode changes above.
                    engine.__resolvedMode = resolvedMode;

                    // IMPORTANT: set locale to the data object, not the key string, so that
                    // `this.cherry.locale.saveAsImage` resolves correctly.
                    engine.locale = LOCALE_DATA;
                    engine.locales = { en_US: LOCALE_DATA };
                    engine.cherry = CHERRY_SHIM;

                    if (engine.options) {
                        // Must be the data object here too — NOT the 'en_US' string.
                        engine.options.locale = LOCALE_DATA;
                        engine.options.locales = { en_US: LOCALE_DATA };
                        engine.options.cherry = CHERRY_SHIM;
                    }

                    // Deep-patch any nested plugin instances that captured a cherry
                    // reference during construction before we could set locale above.
                    patchCherryLocale(engine);

                    // Standalone plugin instance for manual post-render ECharts triggers.
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
    }, [content, dependenciesLoaded, resolvedMode]);

    // Post-render triggers: Mermaid, ECharts
    useEffect(() => {
        if (!html || !containerRef.current) return;

        const container = containerRef.current;

        // 1. Mermaid
        if (window.mermaid) {
            try {
                window.mermaid.initialize({
                    startOnLoad: false,
                    theme: resolvedMode === 'dark' ? 'dark' : 'default',
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
    }, [html, resolvedMode]);

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
                'cherry-viewer-root',
                'cherry',
                'cherry-editor',
                `theme__${resolvedMode}`,
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