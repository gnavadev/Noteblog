import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

interface MagazineGridProps {
    selectedPostId: string | null;
    onSelectPost: (id: string) => void;
    onNewPost: () => void;
    onEditPost: (id: string) => void;
    onDeletePost: (id: string) => void;
    isAdmin?: boolean;
    selectedTopic?: string | null;
    posts: Post[];
    topics: { name: string; color: string }[];
    loading: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 20
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.15 }
    }
};

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
                        const isSelected = selectedPostId === post.id;
                        const topicColor = topics.find(t => t.name === post.topic)?.color || '#007aff';

                        return (
                            <motion.div
                                key={post.id}
                                layout
                                variants={cardVariants}
                                whileHover={{
                                    y: -8,
                                    transition: { duration: 0.2 }
                                }}
                                id={post.id}
                                className={cn(
                                    "flex flex-col overflow-hidden transition-all duration-300 h-full min-h-[320px]",
                                    "bg-card rounded-[24px] border border-border shadow-sm hover:shadow-xl",
                                    isSelected && "ring-2 ring-primary border-transparent shadow-primary/10"
                                )}
                            >
                                <a
                                    href={`/post/${post.id}`}
                                    className="flex flex-col h-full w-full"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.history.pushState({}, '', `/post/${post.id}`);
                                        onSelectPost(post.id);
                                    }}
                                >
                                    <div
                                        className="aspect-video w-full relative bg-muted shrink-0"
                                        style={{
                                            backgroundImage: `url(${post.featured_image})`,
                                            backgroundPosition: 'center',
                                            backgroundSize: 'cover'
                                        }}
                                    >
                                        <div className="absolute top-4 left-4">
                                            <Badge
                                                className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none font-bold uppercase tracking-wider text-[10px] px-2.5 py-1"
                                                style={{ backgroundColor: `${topicColor}cc` }}
                                            >
                                                {post.topic}
                                            </Badge>
                                        </div>

                                        {isAdmin && (
                                            <div className="absolute top-3 right-3" onClick={e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm border-none backdrop-blur-sm"
                                                        >
                                                            <Pencil className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem onClick={() => onEditPost(post.id)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setPostToDelete(post.id);
                                                                setDeleteConfirmOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col gap-2">
                                        <h3 className="text-base font-extrabold leading-tight tracking-tight text-foreground line-clamp-1 min-h-[1.25rem]">
                                            {post.title}
                                        </h3>

                                        <div className="h-px w-full bg-gradient-to-r from-border to-transparent opacity-50" />

                                        <div className="text-[0.75rem] text-muted-foreground leading-relaxed line-clamp-2 italic opacity-80 overflow-hidden">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]]}
                                                allowedElements={['p', 'span', 'strong', 'em', 'a']}
                                                unwrapDisallowed={true}
                                                components={{
                                                    p: ({ children }) => <span className="inline">{children} </span>,
                                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                                    em: ({ children }) => <em className="italic">{children}</em>,
                                                    code: ({ children }) => <span className="bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono">{children}</span>,
                                                    a: ({ children }) => <span className="text-primary">{children}</span>
                                                }}
                                            >
                                                {post.content}
                                            </ReactMarkdown>
                                        </div>

                                        <div className="mt-auto pt-3 flex items-center justify-between text-[0.7rem] font-medium text-muted-foreground border-t border-border/10">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6 border border-border">
                                                    <AvatarImage src="/GabrielPhoto.jpg" />
                                                    <AvatarFallback>G</AvatarFallback>
                                                </Avatar>
                                                <span className="opacity-80">
                                                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className="opacity-60">{post.read_time_minutes} min read</span>
                                        </div>
                                    </div>
                                </a>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this post and all its contents. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (postToDelete) onDeletePost(postToDelete);
                                setDeleteConfirmOpen(false);
                                setPostToDelete(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MagazineGrid;
