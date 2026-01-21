import React, { useEffect } from 'react';
import Sidebar from './Sidebar';

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
import { useCherryDependencies } from './cherry';
import WelcomeDialog from './WelcomeDialog';

interface BlogShellInnerProps {
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
    initialPosts?: Post[];
    initialSelectedPostId?: string | null;
    initialTopic?: string | null;
    initialShowPostIt?: boolean;
}

const BlogShellInner: React.FC<BlogShellInnerProps> = ({
    colorMode,
    toggleTheme,
    initialPosts = [],
    initialSelectedPostId = null,
    initialTopic = null,
    initialShowPostIt = false
}) => {
    const isMobile = useIsMobile();
    const {
        posts,
        topics,
        loading,
        selectedPostId,
        selectedTopic,
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
    } = useBlogState(initialPosts, initialSelectedPostId, initialTopic, initialShowPostIt);

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

    // Immediate Asynchronous Preloading
    const { loadDependencies } = useCherryDependencies();
    useEffect(() => {
        const warmUp = () => {
            // 1. Fire off dependency loading (non-blocking)
            loadDependencies?.();
            // 2. Start fetching ReaderPanel component chunks
            import('./ReaderPanel');
        };

        if (typeof window !== 'undefined') {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(warmUp);
            } else {
                // Fallback to immediate execution if idle callback isn't supported
                setTimeout(warmUp, 1);
            }
        }
    }, [loadDependencies]);

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
            <WelcomeDialog />
        </div >
    );
};

interface BlogShellProps {
    initialPosts?: Post[];
    initialTopics?: any[];
    initialSelectedPostId?: string | null;
    initialTopic?: string | null;
    initialShowPostIt?: boolean;
}

const BlogShell: React.FC<BlogShellProps> = ({
    initialPosts,
    initialTopics,
    initialSelectedPostId,
    initialTopic,
    initialShowPostIt
}) => {
    const { colorMode, toggleTheme } = useTheme();

    return (
        <TopicProvider initialTopics={initialTopics}>
            <SidebarProvider>
                <BlogShellInner
                    colorMode={colorMode}
                    toggleTheme={toggleTheme}
                    initialPosts={initialPosts}
                    initialSelectedPostId={initialSelectedPostId}
                    initialTopic={initialTopic}
                    initialShowPostIt={initialShowPostIt}
                />
                <Toaster />
            </SidebarProvider>
        </TopicProvider>
    );
};

export default BlogShell;
