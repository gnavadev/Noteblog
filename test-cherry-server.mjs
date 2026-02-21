import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core.common.js';

try {
    const engine = new CherryEngine();
    const html = engine.makeHtml('# Hello World');
    console.log("Success:", html);
} catch (e) {
    console.error("Failed:", e.message);
}
