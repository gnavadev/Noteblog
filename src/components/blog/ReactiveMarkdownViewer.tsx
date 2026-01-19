import React from 'react';
import CherryMarkdownViewer from '../CherryMarkdownViewer';
import { useTheme } from './useTheme';

interface ReactiveMarkdownViewerProps {
    content: string;
    className?: string;
}

const ReactiveMarkdownViewer: React.FC<ReactiveMarkdownViewerProps> = ({ content, className }) => {
    const { colorMode } = useTheme();

    return (
        <CherryMarkdownViewer
            content={content}
            colorMode={colorMode}
            className={className}
        />
    );
};

export default ReactiveMarkdownViewer;
