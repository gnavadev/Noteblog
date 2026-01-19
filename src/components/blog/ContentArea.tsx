import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import MagazineGrid from '../MagazineGrid';
import PostItBoard from '../PostItBoard';
const ReaderPanel = React.lazy(() => import('../ReaderPanel'));
import type { Post, Topic } from './types';

interface ContentAreaProps {
    isMobile: boolean;
    showPostIt: boolean;
    user: any;
    posts: Post[];
    topics: Topic[];
    selectedPostId: string | null;
    handleSelectPost: (id: string | null) => void;
    handleNewPost: () => void;
    handleEditPost: (id: string) => void;
    handleDeletePost: (id: string) => void;
    isAdmin: boolean;
    selectedTopic: string | null;
    loading: boolean;
    isReaderExpanded: boolean;
    setIsReaderExpanded: (value: boolean) => void;
    colorMode: 'light' | 'dark';
}

const ContentArea: React.FC<ContentAreaProps> = ({
    isMobile,
    showPostIt,
    user,
    posts,
    topics,
    selectedPostId,
    handleSelectPost,
    handleNewPost,
    handleEditPost,
    handleDeletePost,
    isAdmin,
    selectedTopic,
    loading,
    isReaderExpanded,
    setIsReaderExpanded,
    colorMode
}) => {
    return (
        <main
            className="flex-1 h-full min-h-0 overflow-x-hidden overflow-y-auto"
            id="grid-scroll-container"
        >
            {isMobile && (
                <div className="fixed top-6 left-6 z-[100]">
                    <SidebarTrigger className="h-12 w-12 rounded-full shadow-lg bg-background border-none flex items-center justify-center">
                        <Menu className="h-6 w-6" />
                    </SidebarTrigger>
                </div>
            )}

            {showPostIt ? (
                <div className="h-full bg-card overflow-hidden border border-border shadow-xl">
                    <PostItBoard user={user} isAdmin={isAdmin} />
                </div>
            ) : (
                <MagazineGrid
                    selectedPostId={selectedPostId}
                    onSelectPost={handleSelectPost}
                    onNewPost={handleNewPost}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    isAdmin={isAdmin}
                    selectedTopic={selectedTopic}
                    posts={posts}
                    topics={topics}
                    loading={loading}
                />
            )}

            <AnimatePresence>
                {selectedPostId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: isReaderExpanded ? 0 : 1,
                                transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                            }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleSelectPost(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[4px] z-[190]"
                            style={{ pointerEvents: isReaderExpanded ? 'none' : 'auto' }}
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{
                                x: 0,
                                width: isReaderExpanded ? '100vw' : 'clamp(320px, 60vw, 800px)',
                            }}
                            exit={{ x: '100%' }}
                            transition={{
                                width: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                                x: { type: 'spring', damping: 28, stiffness: 180 }
                            }}
                            layout
                            className={cn(
                                "fixed top-0 right-0 bottom-0 z-[200] bg-sidebar shadow-2xl overflow-hidden flex flex-col border-l border-border",
                                isReaderExpanded && "z-[5000]"
                            )}
                        >
                            <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                                <ReaderPanel
                                    selectedPostId={selectedPostId}
                                    initialPost={posts.find((p: Post) => p.id === selectedPostId) || null}
                                    topics={topics}
                                    isExpanded={isReaderExpanded}
                                    onToggleExpand={() => setIsReaderExpanded(!isReaderExpanded)}
                                    onClose={() => handleSelectPost(null)}
                                    colorMode={colorMode}
                                    isAdmin={isAdmin}
                                />
                            </React.Suspense>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    );
};

export default ContentArea;
