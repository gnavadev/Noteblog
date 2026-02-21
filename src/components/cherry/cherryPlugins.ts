// Track if plugins have been registered to avoid duplicate registration warnings
let pluginsRegistered = false;
let CachedCherryClass: any = null;

/**
 * Register Cherry plugins async.
 * This should be called strictly when the Editor is about to mount.
 */
export async function getCherryWithPlugins() {
    if (CachedCherryClass) {
        return CachedCherryClass;
    }

    try {
        const [
            { default: CherryClass },
            { default: CherryMermaidPlugin },
            { default: CherryTableEchartsPlugin },
            { default: mermaid }
        ] = await Promise.all([
            import('cherry-markdown/dist/cherry-markdown.core'),
            import('cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin'),
            import('cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin'),
            import('mermaid')
        ]);

        if (!pluginsRegistered) {
            CherryClass.usePlugin(CherryMermaidPlugin, { mermaid });
            CherryClass.usePlugin(CherryTableEchartsPlugin);
            pluginsRegistered = true;
        }

        CachedCherryClass = CherryClass;
        return CherryClass;
    } catch (e) {
        console.error("Failed to lazily load Cherry plugins:", e);
        throw e;
    }
}
