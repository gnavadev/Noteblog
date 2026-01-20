import React from 'react';
import TopicProvider from './TopicProvider';
import StandalonePostEditor from './StandalonePostEditor';

interface EditorWrapperProps {
    postId?: string;
    initialData?: any;
    availableTopics?: any[];
}

const EditorWrapper: React.FC<EditorWrapperProps> = ({
    postId,
    initialData,
    availableTopics = []
}) => {
    return (
        <TopicProvider initialTopics={availableTopics}>
            <StandalonePostEditor
                postId={postId}
                initialData={initialData}
                availableTopics={availableTopics}
            />
        </TopicProvider>
    );
};

export default EditorWrapper;
