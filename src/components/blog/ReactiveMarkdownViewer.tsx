import React from 'react';
import CherryEngineViewer from './CherryEngineViewer';

interface ReactiveMarkdownViewerProps {
    content: string;
    className?: string;
}

const ReactiveMarkdownViewer: React.FC<ReactiveMarkdownViewerProps> = ({ content, className }) => {
    return (
        <CherryEngineViewer
            content={content}
        />
    );
};

export default ReactiveMarkdownViewer;
