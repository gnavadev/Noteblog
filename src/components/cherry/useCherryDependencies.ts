import { useState, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        echarts: any;
        katex: any;
        MathJax: any;
        mermaid: any;
    }
}

/**
 * Custom hook to load Cherry Markdown external dependencies (ECharts, MathJax)
 * with a safety timeout to prevent blocking if scripts fail to load.
 */
export function useCherryDependencies() {
    const [dependenciesLoaded, setDependenciesLoaded] = useState(false);

    const loadScript = useCallback((src: string, globalKey: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                resolve();
                return;
            }
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
    }, []);

    const loadDependencies = useCallback(async () => {
        try {
            // Race between loading and a 2-second timeout
            await Promise.race([
                Promise.all([
                    loadScript('/libs/echarts.min.js', 'echarts'),
                    loadScript('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js', 'MathJax')
                ]),
                new Promise(resolve => setTimeout(resolve, 2000)) // Safety timeout
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setDependenciesLoaded(true);
        }
    }, [loadScript]);

    useEffect(() => {
        loadDependencies();
    }, [loadDependencies]);

    return { dependenciesLoaded, loadDependencies };
}

export default useCherryDependencies;
