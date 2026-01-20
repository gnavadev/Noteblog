import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import CherryTableEchartsPlugin from 'cherry-markdown/dist/addons/advance/cherry-table-echarts-plugin';
import mermaid from 'mermaid';

// Track if plugins have been registered to avoid duplicate registration warnings
let pluginsRegistered = false;

/**
 * Register Cherry plugins once globally.
 * This should be called before any Cherry instance is created.
 */
export function registerCherryPlugins() {
    if (pluginsRegistered) {
        return;
    }

    try {
        Cherry.usePlugin(CherryMermaidPlugin, { mermaid });
        Cherry.usePlugin(CherryTableEchartsPlugin);
        pluginsRegistered = true;
    } catch (e) {
        // Plugins already registered by another module
        pluginsRegistered = true;
    }
}

// Auto-register on module load
registerCherryPlugins();

export { Cherry };
