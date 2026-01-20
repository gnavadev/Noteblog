import { Cherry } from './cherryPlugins';

// Define window.cherry type
declare global {
    interface Window {
        cherry: any;
    }
}

/**
 * Custom Syntax Hook
 */
const CustomHookA = Cherry.createSyntaxHook('codeBlock', Cherry.constants.HOOKS_TYPE_LIST.PAR, {
    makeHtml(str: string) {
        console.warn('custom hook', 'hello');
        return str;
    },
    rule(str: string) {
        return {
            begin: '',
            content: '',
            end: '',
            reg: new RegExp('', 'g') // Dummy regex to satisfy type, logic stripped in original?
        };
    },
});

/**
 * Custom Menu: Bold Italic
 */
const customMenuA = Cherry.createMenuHook('BoldItalic', {
    iconName: 'font',
    onClick: function (selection: string) {
        // @ts-ignore
        let $selection = this.getSelection(selection) || 'Bold & Italic';
        // @ts-ignore
        if (!this.isSelections && !/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
            // @ts-ignore
            this.getMoreSelection('***', '***', () => {
                // @ts-ignore
                const newSelection = this.editor.editor.getSelection();
                const isBoldItalic = /^\s*(\*\*\*)[\s\S]+(\1)/.test(newSelection);
                if (isBoldItalic) {
                    $selection = newSelection;
                }
                return isBoldItalic;
            });
        }
        if (/^\s*(\*\*\*)[\s\S]+(\1)/.test($selection)) {
            return $selection.replace(/(^)(\s*)(\*\*\*)([^\n]+)(\3)(\s*)($)/gm, '$1$4$7');
        }
        // @ts-ignore
        this.registerAfterClickCb(() => {
            // @ts-ignore
            this.setLessSelection('***', '***');
        });
        return $selection.replace(/(^)([^\n]+)($)/gm, '$1***$2***$3');
    },
});

/**
 * Custom Menu: Laboratory (Structure holder)
 */
const customMenuB = Cherry.createMenuHook('Lab', {
    icon: {
        type: 'svg',
        content:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>',
        iconStyle: 'width: 15px; height: 15px; vertical-align: middle;',
    },
});

/**
 * Custom Menu: Help Center
 */
const customMenuC = Cherry.createMenuHook('HelpCenter', {
    iconName: 'question',
    onClick: (selection: string, type: string) => {
        switch (type) {
            case 'shortKey':
                return `${selection}Shortcuts here: https://codemirror.net/5/demo/sublime.html`;
            case 'github':
                return `${selection}We are here: https://github.com/Tencent/cherry-markdown`;
            case 'release':
                return `${selection}We are here: https://github.com/Tencent/cherry-markdown/releases`;
            default:
                return selection;
        }
    },
    subMenuConfig: [
        {
            noIcon: true,
            name: 'Shortcuts',
            onclick: (event: any) => {
                // @ts-ignore
                window.cherry?.toolbar.menus.hooks.customMenuCName.fire(null, 'shortKey');
            },
        },
        {
            noIcon: true,
            name: 'Contact Us',
            onclick: (event: any) => {
                // @ts-ignore
                window.cherry?.toolbar.menus.hooks.customMenuCName.fire(null, 'github');
            },
        },
        {
            noIcon: true,
            name: 'Changelog',
            onclick: (event: any) => {
                // @ts-ignore
                window.cherry?.toolbar.menus.hooks.customMenuCName.fire(null, 'release');
            },
        },
    ],
});

/**
 * Custom Menu: Charts
 */
const customMenuTable = Cherry.createMenuHook('Charts', {
    iconName: 'trendingUp',
    subMenuConfig: [
        {
            noIcon: true,
            name: 'Line Chart',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :line:{"title": "Line Chart"} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Bar Chart',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :bar:{"title": "Bar Chart"} | Header1 | Header2 | Header3 | Header4 |\n| ------ | ------ | ------ | ------ | ------ |\n| Sample1 | 11 | 11 | 4 | 33 |\n| Sample2 | 112 | 111 | 22 | 222 |\n| Sample3 | 333 | 142 | 311 | 11 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Radar Chart',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :radar:{"title": "Radar Chart"} | Skill1 | Skill2 | Skill3 | Skill4 | Skill5 |\n| ------ | ------ | ------ | ------ | ------ | ------ |\n| UserA | 90 | 85 | 75 | 80 | 88 |\n| UserB | 75 | 90 | 88 | 85 | 78 |\n| UserC | 85 | 78 | 90 | 88 | 85 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Heatmap',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :heatmap:{"title": "Heatmap"} | Mon | Tue | Wed | Thu | Fri |\n| ------ | ------ | ------ | ------ | ------ | ------ |\n| Morning | 10 | 20 | 30 | 40 | 50 |\n| Afternoon | 15 | 25 | 35 | 45 | 55 |\n| Evening | 5 | 15 | 25 | 35 | 45 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Pie Chart',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :pie:{"title": "Pie Chart"} | Value |\n| ------ | ------ |\n| Apple | 40 |\n| Banana | 30 |\n| Orange | 20 |\n| Grape | 10 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Scatter Plot',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :scatter:{"title": "Scatter Plot", "cherry:mapping": {"x": "X", "y": "Y", "size": "Size", "series": "Series"}} | X | Y | Size | Series |\n| ------ | ------ | ------ | ------ | ------ |\n| A1 | 10 | 20 | 5 | S1 |\n| A2 | 15 | 35 | 8 | S1 |\n| B1 | 30 | 12 | 3 | S2 |\n| B2 | 25 | 28 | 6 | S2 |\n| C1 | 50 | 40 | 9 | S3 |\n| C2 | 60 | 55 | 7 | S3 |\n',
                );
            },
        },
        {
            noIcon: true,
            name: 'Map',
            onclick: (event: any) => {
                window.cherry?.insert(
                    '\n| :map:{"title": "Map", "mapDataSource": "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"} | Value |\n| :-: | :-: |\n| Beijing | 100 |\n| Shanghai | 200 |\n| Guangdong | 300 |\n| Sichuan | 150 |\n| Jiangsu | 250 |\n| Zhejiang | 180 |\n\n**Note:** Modify mapDataSource URL to customize map data source\n',
                );
            },
        },
    ],
});

export const basicFullConfig = {
    id: 'cherry-markdown-container',
    externals: {
        echarts: window.echarts,
        katex: window.katex,
        MathJax: window.MathJax,
    },
    isPreviewOnly: false,
    engine: {
        global: {
            htmlAttrWhiteList: 'part|slot',
            flowSessionContext: false,
        },
        syntax: {
            link: {
                attrRender: (text: string, href: string) => {
                    return ``;
                },
            },
            codeBlock: {
                theme: 'twilight',
                lineNumber: true,
                expandCode: true,
                copyCode: true,
                editCode: true,
                changeLang: true,
                wrapperRender: (lang: string, code: string, html: string) => {
                    return `<div class="custom-codeblock-wrapper language-${lang}" data-tips="Custom outer wrapper for code block">${html}</div>`;
                },
            },
            table: {
                enableChart: true,
            },
            fontEmphasis: {
                allowWhitespace: false,
            },
            strikethrough: {
                needWhitespace: false,
            },
            mathBlock: {
                engine: 'MathJax',
                src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js',
            },
            inlineMath: {
                engine: 'MathJax',
            },
            emoji: {
                useUnicode: true,
                customResourceURL: 'https://github.githubassets.com/images/icons/emoji/unicode/${code}.png?v8',
                upperCase: false,
            },
            htmlBlock: {
                removeTrailingNewline: false,
            },
            panel: {
                enableJustify: true,
                enablePanel: true,
            },
        },
        customSyntax: {
            CustomHook: {
                syntaxClass: CustomHookA,
                force: false,
                after: 'br',
            },
        },
    },
    multipleFileSelection: {
        video: true,
        audio: false,
        image: true,
        word: false,
        pdf: true,
        file: true,
    },
    toolbars: {
        toolbar: [
            'bold',
            'italic',
            {
                strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby', 'customMenuAName'],
            },
            'size',
            '|',
            'color',
            'header',
            '|',
            'drawIo',
            '|',
            'ol',
            'ul',
            'checklist',
            'panel',
            'align',
            'detail',
            '|',
            'formula',
            {
                insert: [
                    'image',
                    'audio',
                    'video',
                    'link',
                    'hr',
                    'br',
                    'code',
                    'inlineCode',
                    'formula',
                    'toc',
                    'table',
                    'pdf',
                    'word',
                    'file',
                ],
            },
            'graph',
            'proTable',
            'togglePreview',
            'search',
            'shortcutKey',
            {
                customMenuBName: ['ruby', 'audio', 'video', 'customMenuAName'],
            },
            'customMenuCName',
        ],
        toolbarRight: ['fullScreen', '|', 'export', 'changeLocale', 'wordCount'],
        bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', 'ruby', '|', 'size', 'color'],
        sidebar: ['mobilePreview', 'copy', 'theme', 'codeTheme'],
        toc: {
            defaultModel: 'full',
        },
        customMenu: {
            customMenuAName: customMenuA,
            customMenuBName: customMenuB,
            customMenuCName: customMenuC,
            customMenuTable,
        },
        shortcutKeySettings: {
            isReplace: false,
            shortcutKeyMap: {
                'Alt-Digit1': {
                    hookName: 'header',
                    aliasName: 'Header',
                },
                'Control-Shift-KeyX': {
                    hookName: 'bold',
                    aliasName: 'Bold',
                },
            },
        },
        config: {
            mapTable: {
                sourceUrl: [
                    'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
                    './assets/data/china.json',
                ],
            },
        },
    },
    drawioIframeUrl: './drawio_demo.html',
    previewer: {
        floatWhenClosePreviewer: true,
    },
    keydown: [],
    // extensions: [],
    callback: {
        urlProcessor(url: string, srcType: string) {
            console.log(`url-processor`, url, srcType);
            return url;
        },
    },
    editor: {
        id: 'cherry-markdown-container',
        name: 'cherry-text',
        autoSave2Textarea: true,
        defaultModel: 'edit&preview',
        showFullWidthMark: true,
        showSuggestList: true,
        maxUrlLength: 200,
        codemirror: {
            placeholder: 'Type or use "/" to start editing',
        },
    },
    autoScrollByHashAfterInit: true,
    themeSettings: {
        mainTheme: 'default',
    },
};
