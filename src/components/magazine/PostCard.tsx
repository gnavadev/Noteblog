import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { cardVariants, type Post, type Topic } from './types';

interface PostCardProps {
    post: Post;
    isSelected: boolean;
    isAdmin: boolean;
    topicColor: string;
    onSelectPost: (id: string) => void;
    onEditPost: (id: string) => void;
    onDeleteRequest: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
    post,
    isSelected,
    isAdmin,
    topicColor,
    onSelectPost,
    onEditPost,
    onDeleteRequest
}) => {
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
                                        onClick={() => onDeleteRequest(post.id)}
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
                                {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                            </span>
                        </div>
                        <span className="opacity-60">{post.read_time_minutes} min read</span>
                    </div>
                </div>
            </a>
        </motion.div>
    );
};

export default PostCard;
