import React, { useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
    loading
}) => {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    const displayPosts = useMemo(() => {
        let filtered = [...posts].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (selectedTopic) {
            filtered = filtered.filter(p => p.topic === selectedTopic);
        }
        return filtered;
    }, [posts, selectedTopic]);

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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {displayPosts.map((post) => {
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
