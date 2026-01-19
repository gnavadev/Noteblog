import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Share2, Maximize2, Minimize2, X, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import CherryMarkdownViewer from './CherryMarkdownViewer';
import Comments from './Comments';

const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

interface ReaderPanelProps {
    selectedPostId: string | null;
    initialPost: Post | null;
    topics: { name: string; color: string }[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
    colorMode: 'light' | 'dark';
}

const ReaderPanel: React.FC<ReaderPanelProps> = ({
    selectedPostId,
    initialPost,
    topics,
    isExpanded,
    onToggleExpand,
    onClose,
    colorMode
}) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialPost) {
            setPost(initialPost);
            return;
        }

        if (selectedPostId) {
            fetchPost(selectedPostId);
        } else {
            setPost(null);
        }
    }, [selectedPostId, initialPost]);

    const fetchPost = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setPost(data);
            }
        } catch (err) {
            console.error('Failed to fetch post:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const channel = supabase
            .channel('reader_updates')
            .on('broadcast', { event: 'refresh' }, (payload: { payload: { postId: string } }) => {
                if (selectedPostId && payload.payload.postId === selectedPostId) {
                    fetchPost(selectedPostId);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedPostId]);


    if (loading && !post) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-background gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium animate-pulse">Entering Reading Mode...</span>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-background">
                <div className="max-w-[320px] flex flex-col items-center gap-6">
                    <div className="bg-muted rounded-full p-8">
                        <BookOpen className="h-16 w-16 text-muted-foreground opacity-30" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Select a Story</h2>
                        <p className="text-muted-foreground">
                            Dive into Gabriel's library of thoughts, projects, and travel essays.
                        </p>
                    </div>
                    <Button variant="outline" onClick={onClose} className="rounded-full px-8">
                        Back to Grid
                    </Button>
                </div>
            </div>
        );
    }

    const topicColor = topics.find(t => t.name === post.topic)?.color || '#007aff';

    return (
        <motion.div
            layout
            id="reader-scroll-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.4 }
            }}
            className="bg-sidebar overflow-y-auto overflow-x-hidden flex-1 w-full relative h-full scroll-smooth"
            data-is-expanded={isExpanded}
        >
            <motion.div
                layout="position"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.5 }
                }}
                className={cn(
                    "relative flex items-end p-8 transition-[height] duration-700 ease-in-out",
                    isExpanded ? "h-[45vh]" : "h-[25vh]"
                )}
                style={{
                    background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${post.featured_image}) center/cover no-repeat`,
                }}
            >
                <div className="absolute top-6 right-6 flex items-center gap-3">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                        onClick={onToggleExpand}
                    >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Badge
                        className="mb-4 font-extrabold px-4 py-1.5 rounded-lg text-sm uppercase tracking-wider backdrop-blur-md shadow-lg border-none"
                        style={{ backgroundColor: `${topicColor}dd`, color: 'white' }}
                    >
                        {post.topic}
                    </Badge>
                </motion.div>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className={cn(
                    "mx-auto py-12 px-8 transition-all duration-700 ease-in-out",
                    isExpanded ? "max-w-[1000px]" : "max-w-[800px]"
                )}
            >
                <header className="mb-10 flex flex-col gap-6">
                    <motion.div variants={contentVariants}>
                        <h1 className={cn(
                            "font-extrabold tracking-tight transition-all duration-700 leading-[1.1]",
                            isExpanded ? "text-5xl" : "text-4xl"
                        )}>
                            {post.title}
                        </h1>
                    </motion.div>

                    <motion.div variants={contentVariants} className="flex items-center justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar className={cn(
                                "border-2 border-primary/10 shadow-lg transition-all duration-700",
                                isExpanded ? "h-14 w-14" : "h-12 w-12"
                            )}>
                                <AvatarImage src="/GabrielPhoto.jpg" />
                                <AvatarFallback>G</AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                                <span className="block font-bold text-[1.05rem]">Gabriel Nava</span>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>{post.read_time_minutes} min read</span>
                            </div>

                            <Button
                                size="sm"
                                variant={isExpanded ? "destructive" : "default"}
                                onClick={onToggleExpand}
                                className="rounded-full px-6 font-bold shadow-lg shadow-primary/20"
                            >
                                {isExpanded ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                                {isExpanded ? 'Minimize' : 'Expand View'}
                            </Button>
                        </div>
                    </motion.div>
                </header>

                <Separator className="mb-10 opacity-50" />

                <motion.div variants={contentVariants}>
                    <div
                        className="markdown-reader-content w-full min-h-[400px]"
                        data-color-mode={colorMode}
                    >
                        <CherryMarkdownViewer
                            content={post.content}
                            colorMode={colorMode}
                            className="min-h-[400px]"
                        />
                    </div>
                </motion.div>

                <motion.div variants={contentVariants}>
                    <Separator className="my-16" />
                </motion.div>

                <motion.div variants={contentVariants}>
                    <Comments postId={post.id} />
                </motion.div>

                <motion.div variants={contentVariants}>
                    <Separator className="my-16" />
                </motion.div>

                <motion.div variants={contentVariants}>
                    <footer className="text-center text-sm font-medium text-muted-foreground opacity-50 py-8">
                        <p>© {new Date().getFullYear()} Gabriel Nava — Crafting Digital Experiences</p>
                    </footer>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ReaderPanel;
