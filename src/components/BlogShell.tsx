import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
const PostEditor = React.lazy(() => import('./NoteEditor'));
import { Plus, Sun, Moon } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import mermaid from 'mermaid';
import { getMermaidConfig } from '@/lib/mermaid-config';
import { ContentArea, useBlogState, useTheme } from './blog';
import type { Post } from './blog';
import ErrorBoundary from './ErrorBoundary';
import { TopicProvider } from './TopicProvider';

interface BlogShellInnerProps {
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
    initialPosts?: Post[];
}

const BlogShellInner: React.FC<BlogShellInnerProps> = ({ colorMode, toggleTheme, initialPosts = [] }) => {
    const isMobile = useIsMobile();
    const {
        posts,
        topics,
        loading,
        selectedPostId,
        selectedTopic,
        isEditorOpen,
        editingPostId,
        user,
        adminAvatar,
        isReaderExpanded,
        setIsReaderExpanded,
        showPostIt,
        isAdmin,
        handleSelectPostIt,
        handleSelectPost,
        handleSelectTopic,
        handleUpdateTopicOrder,
        handleNewPost,
        handleEditPost,
        handleDeletePost,
        closeEditor,
        onEditorSave,
    } = useBlogState(initialPosts);

    useEffect(() => {
        mermaid.initialize(getMermaidConfig(colorMode) as any);
    }, [colorMode]);

    const sidebarProps = {
        onNewPost: handleNewPost,
        selectedPostId,
        onSelectPost: handleSelectPost,
        selectedTopic,
        onSelectTopic: handleSelectTopic,
        posts,
        topics,
        isAdmin,
        onUpdateTopicOrder: handleUpdateTopicOrder,
        adminAvatar,
        isSelectedPostIt: showPostIt,
        onSelectPostIt: handleSelectPostIt
    };

    return (
        <div className="flex h-screen w-full bg-background transition-colors duration-300 overflow-hidden">
            <ErrorBoundary>
                <Sidebar {...sidebarProps} />
            </ErrorBoundary>

            <SidebarInset className="flex-1 flex flex-col relative w-full h-full min-h-0 overflow-hidden">
                <ErrorBoundary>
                    <ContentArea
                        isMobile={isMobile}
                        showPostIt={showPostIt}
                        user={user}
                        posts={posts}
                        topics={topics}
                        selectedPostId={selectedPostId}
                        handleSelectPost={handleSelectPost}
                        handleNewPost={handleNewPost}
                        handleEditPost={handleEditPost}
                        handleDeletePost={handleDeletePost}
                        isAdmin={isAdmin}
                        selectedTopic={selectedTopic}
                        loading={loading}
                        isReaderExpanded={isReaderExpanded}
                        setIsReaderExpanded={setIsReaderExpanded}
                        colorMode={colorMode}
                    />
                </ErrorBoundary>
            </SidebarInset>

            {isEditorOpen && (
                <React.Suspense fallback={null}>
                    <ErrorBoundary>
                        <PostEditor
                            open={isEditorOpen}
                            postId={editingPostId}
                            onClose={closeEditor}
                            onSave={onEditorSave}
                            availableTopics={topics}
                            colorMode={colorMode}
                            toggleTheme={toggleTheme}
                        />
                    </ErrorBoundary>
                </React.Suspense>
            )}

            <div className="fixed right-6 bottom-6 z-[6000] flex flex-col gap-3">
                {isAdmin && (
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:scale-105 transition-transform"
                        onClick={handleNewPost}
                    >
                        <Plus className="h-7 w-7" />
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl bg-background/80 backdrop-blur-md hover:scale-105 transition-transform"
                    onClick={toggleTheme}
                >
                    {colorMode === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    );
};

interface BlogShellProps {
    initialPosts?: Post[];
    initialTopics?: any[];
}

const BlogShell: React.FC<BlogShellProps> = ({ initialPosts, initialTopics }) => {
    const { colorMode, toggleTheme } = useTheme();

    return (
        <TopicProvider initialTopics={initialTopics}>
            <SidebarProvider>
                <BlogShellInner colorMode={colorMode} toggleTheme={toggleTheme} initialPosts={initialPosts} />
                <Toaster />
            </SidebarProvider>
        </TopicProvider>
    );
};

export default BlogShell;
