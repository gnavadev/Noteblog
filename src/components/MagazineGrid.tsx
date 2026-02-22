import React, { useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PostCard, DeleteConfirmDialog, containerVariants } from './magazine';
import type { MagazineGridProps } from './magazine/types';

const MagazineGrid: React.FC<MagazineGridProps> = ({
    selectedPostId,
    onSelectPost,
    onNewPost,
    onEditPost,
    onDeletePost,
    isAdmin = false,
    selectedTopic = null,
    posts,
    topics,
    loading,
    loadMoreContent
}) => {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1, initialInView: false });
    const POSTS_PER_PAGE = 6;

    const displayPosts = useMemo(() => {
        let filtered = [...posts].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (selectedTopic) {
            filtered = filtered.filter(p => p.topic === selectedTopic);
        }
        return filtered;
    }, [posts, selectedTopic]);

    // Apply pagination
    const paginatedPosts = useMemo(() => {
        return displayPosts.slice(0, page * POSTS_PER_PAGE);
    }, [displayPosts, page]);

    const hasMore = displayPosts.length > page * POSTS_PER_PAGE;

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const nextPosts = displayPosts.slice(page * POSTS_PER_PAGE, nextPage * POSTS_PER_PAGE);
        const missingContentIds = nextPosts.filter(p => !p.excerpt && !p.content).map(p => p.id);

        if (missingContentIds.length > 0) {
            await loadMoreContent(missingContentIds);
        }
        setPage(nextPage);
        setIsLoadingMore(false);
    };

    React.useEffect(() => {
        // Trigger load more when scrolling into view
        if (inView && displayPosts.length > 0 && !isLoadingMore) {
            handleLoadMore();
        }
    }, [inView, displayPosts.length, isLoadingMore]);

    // Ensure currently displayed posts always have their excerpts loaded
    React.useEffect(() => {
        const missingContentIds = paginatedPosts.filter(p => !p.excerpt && !p.content).map(p => p.id);
        if (missingContentIds.length > 0) {
            loadMoreContent(missingContentIds);
        }
    }, [paginatedPosts, loadMoreContent]);

    const handleDeleteRequest = (postId: string) => {
        setPostToDelete(postId);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (postToDelete) onDeletePost(postToDelete);
        setDeleteConfirmOpen(false);
        setPostToDelete(null);
    };

    const handleDeleteCancel = () => {
        setPostToDelete(null);
    };

    if (loading && posts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-[40vh] flex flex-col items-center justify-center gap-4 text-muted-foreground"
            >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Curating Gallery...</span>
            </motion.div>
        );
    }

    if (displayPosts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 px-8 flex flex-col items-center justify-center text-center gap-4"
            >
                <div className="p-6 rounded-full bg-muted/50">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">No stories found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        {selectedTopic ? `No stories yet in "${selectedTopic}"` : "The library is currently empty"}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={onNewPost} className="rounded-full px-8">
                        Compose First Story
                    </Button>
                )}
            </motion.div>
        );
    }

    return (
        <div className="p-8 md:p-12 lg:px-16">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {paginatedPosts.map((post) => {
                        const topicColor = topics.find(t =>
                            (post.topic_id && t.id === post.topic_id) ||
                            (!post.topic_id && t.name === post.topic)
                        )?.color || '#007aff';

                        return (
                            <PostCard
                                key={post.id}
                                post={post}
                                isSelected={selectedPostId === post.id}
                                isAdmin={isAdmin}
                                topicColor={topicColor}
                                onSelectPost={onSelectPost}
                                onEditPost={onEditPost}
                                onDeleteRequest={handleDeleteRequest}
                            />
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {hasMore && (
                <div ref={loadMoreRef} className="mt-12 flex justify-center pb-8 h-20 items-center">
                    {isLoadingMore && (
                        <div className="flex items-center text-muted-foreground font-medium text-sm">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                            Curating more stories...
                        </div>
                    )}
                </div>
            )}

            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
};

export default MagazineGrid;
