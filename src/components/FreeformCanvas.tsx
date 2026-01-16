import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = lazy(() => import('@uiw/react-md-editor'));
const MarkdownPreview = lazy(() => import('@uiw/react-markdown-preview'));
const Excalidraw = lazy(() => import('@excalidraw/excalidraw').then(module => ({ default: module.Excalidraw })));

export interface CanvasElement {
    id: string;
    type: 'text' | 'image' | 'whiteboard';
    content: string;
    width?: number;
    height?: number;
    rotation?: number;
    color?: string;
    excalidrawElements?: any[];
    excalidrawAppState?: any;
}

interface FreeformCanvasProps {
    elements: CanvasElement[];
    onChange: (elements: CanvasElement[]) => void;
    readOnly?: boolean;
}

const MarkdownElement: React.FC<{
    element: CanvasElement;
    isFocused: boolean;
    readOnly: boolean;
    onChange: (content: string) => void;
}> = ({ element, isFocused, readOnly, onChange }) => {
    return (
        <div
            style={{
                width: element.width ? `${element.width}px` : '100%',
                minHeight: element.height || 200,
                pointerEvents: isFocused ? 'auto' : 'none'
            }}
            onMouseDown={(e) => isFocused && e.stopPropagation()}
        >
            <Suspense fallback={<div>Loading Editor...</div>}>
                {readOnly ? (
                    <div className="markdown-display" style={{ padding: '10px' }}>
                        <MarkdownPreview source={element.content} />
                    </div>
                ) : (
                    <MDEditor
                        value={element.content}
                        onChange={(val) => onChange(val || '')}
                        preview={isFocused ? 'live' : 'preview'}
                        height={element.height || 200}
                    />
                )}
            </Suspense>
        </div>
    );
};

const WhiteboardElement: React.FC<{
    element: CanvasElement;
    isFocused: boolean;
    readOnly: boolean;
    onChange: (elements: any[], appState: any) => void;
}> = ({ element, isFocused, readOnly, onChange }) => {
    return (
        <div
            style={{
                width: element.width ? `${element.width}px` : '100%',
                height: element.height || 400,
                pointerEvents: isFocused ? 'auto' : 'none',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
            onMouseDown={(e) => isFocused && e.stopPropagation()}
        >
            <React.Suspense fallback={<div>Loading Whiteboard...</div>}>
                <Excalidraw
                    initialData={{
                        elements: element.excalidrawElements || [],
                        appState: { ...element.excalidrawAppState, viewBackgroundColor: 'transparent' },
                        scrollToContent: true
                    }}
                    onChange={(elements, appState) => {
                        if (!readOnly) {
                            onChange(elements as any[], appState);
                        }
                    }}
                    viewModeEnabled={readOnly || !isFocused}
                />
            </React.Suspense>
        </div>
    );
};

const FreeformCanvas: React.FC<FreeformCanvasProps> = ({
    elements,
    onChange,
    readOnly
}) => {
    const updateTextContent = (id: string, content: string) => {
        const newElements = elements.map(el => el.id === id ? { ...el, content } : el);
        onChange(newElements);
    };

    const updateWhiteboard = (id: string, excalidrawElements: any[], excalidrawAppState: any) => {
        const newElements = elements.map(el => el.id === id ? { ...el, excalidrawElements, excalidrawAppState } : el);
        onChange(newElements);
    };

    const updateHeight = (id: string, height: number) => {
        const newElements = elements.map(el => el.id === id ? { ...el, height } : el);
        onChange(newElements);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newElements = [...elements];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < newElements.length) {
            [newElements[index], newElements[targetIndex]] = [newElements[targetIndex], newElements[index]];
            onChange(newElements);
        }
    };

    const deleteBlock = (id: string) => {
        onChange(elements.filter(el => el.id !== id));
    };

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100%',
                background: readOnly ? '#fff' : 'transparent',
                position: 'relative',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            {elements.map((el, index) => (
                <div
                    key={el.id}
                    className="post-block-wrapper"
                    style={{
                        position: 'relative',
                        width: '100%'
                    }}
                >
                    {/* Block Controls */}
                    {!readOnly && (
                        <div className="block-controls" style={{
                            position: 'absolute',
                            left: '5px',
                            top: '0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 10
                        }}>
                            <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}>↑</button>
                            <button onClick={() => moveBlock(index, 'down')} disabled={index === elements.length - 1}>↓</button>
                            <button onClick={() => deleteBlock(el.id)} style={{ color: 'red' }}>×</button>
                        </div>
                    )}

                    <div style={{ width: '100%', overflow: 'hidden' }}>
                        {el.type === 'text' && (
                            <MarkdownElement
                                element={el}
                                isFocused={!readOnly}
                                readOnly={!!readOnly}
                                onChange={(content) => updateTextContent(el.id, content)}
                            />
                        )}
                        {el.type === 'whiteboard' && (
                            <WhiteboardElement
                                element={el}
                                isFocused={!readOnly}
                                readOnly={!!readOnly}
                                onChange={(exElements, appState) => updateWhiteboard(el.id, exElements, appState)}
                            />
                        )}
                        {el.type === 'image' && (
                            <div style={{ textAlign: 'center' }}>
                                <img
                                    src={el.content}
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Resize Handle for Whiteboard */}
                    {!readOnly && el.type === 'whiteboard' && (
                        <div
                            style={{
                                width: '100%',
                                height: '10px',
                                cursor: 'ns-resize',
                                background: 'transparent',
                                borderBottom: '2px dashed #ddd',
                                marginTop: '8px'
                            }}
                            onMouseDown={(e) => {
                                const startY = e.clientY;
                                const startHeight = el.height || 400;
                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    updateHeight(el.id, Math.max(100, startHeight + (moveEvent.clientY - startY)));
                                };
                                const onMouseUp = () => {
                                    window.removeEventListener('mousemove', onMouseMove);
                                    window.removeEventListener('mouseup', onMouseUp);
                                };
                                window.addEventListener('mousemove', onMouseMove);
                                window.addEventListener('mouseup', onMouseUp);
                            }}
                        />
                    )}
                </div>
            ))}

            <style>{`
                .post-block-wrapper:hover .block-controls {
                    opacity: 1 !important;
                }
                .block-controls button {
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }
                .block-controls button:hover { background: #f0f0f0; }
                .block-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
            `}</style>

            <style>{`
                .markdown-content p { margin-bottom: 0.5em; }
                .markdown-content p:last-child { margin-bottom: 0; }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 { 
                    font-size: 1.25em; 
                    margin: 0.5em 0; 
                }
                .markdown-content { pointer-events: none; }
            `}</style>
        </div>
    );
};

export default FreeformCanvas;
