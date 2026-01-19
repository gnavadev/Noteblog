import { useState, useEffect } from 'react';

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

    return { dependenciesLoaded };
}

export default useCherryDependencies;
