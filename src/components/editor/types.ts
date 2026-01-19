export interface Topic {
    name: string;
    color: string;
}

export interface PostEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    postId?: string | null;
    availableTopics: Topic[];
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
}

export interface EditorState {
    markdown: string;
    title: string;
    topic: string;
    isPublic: boolean;
    featuredImage: string | null;
    saving: boolean;
    isLoading: boolean;
    newTopicName: string;
}
