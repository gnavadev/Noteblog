import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Reply, Pin, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CommentList from './CommentList';
import { PlusCircleIcon } from './PlusCircleIcon';
import type { Comment, CommentActionsProps } from './types';

interface CommentItemProps extends CommentActionsProps {
    comment: Comment;
    user: any;
    isAdmin: boolean;
    level: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    user,
    isAdmin,
    onReply,
    onEdit,
    onDelete,
    onPin,
    level
}) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const [isCollapsed, setIsCollapsed] = useState(hasReplies);

    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [editContent, setEditContent] = useState(comment.content);

    const isOwner = user?.id === comment.user_id;
    const canDelete = isOwner || isAdmin;
    const isRoot = level === 0;

    const handleReplySubmit = () => {
        if (!replyContent.trim()) return;
        onReply(replyContent, comment.id);
        setReplyContent('');
        setIsReplying(false);
        setIsCollapsed(false);
    };

    const handleEditSubmit = () => {
        if (!editContent.trim()) return;
        onEdit(comment.id, editContent);
        setIsEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("group relative", level > 0 && "mt-1.5")}
        >
            <div className="flex gap-4">
                {/* Avatar Column */}
                <div className="flex flex-col items-center shrink-0">
                    <Avatar className={cn("border border-border z-10", isRoot ? "h-10 w-10" : "h-8 w-8")}>
                        <AvatarImage src={comment.user_metadata?.avatar_url || comment.user_metadata?.picture} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {(comment.user_metadata?.full_name?.[0] || comment.user_metadata?.name?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Thread Line (Only visible when expanded) */}
                    {hasReplies && !isCollapsed && (
                        <div className="flex-1 w-full flex justify-center cursor-pointer group/line" onClick={() => setIsCollapsed(true)}>
                            <div className="w-px h-full bg-border/50 group-hover/line:bg-primary/50 transition-colors mt-2 mb-2 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover/line:opacity-100 transition-opacity bg-background border border-border rounded-full p-0.5 mt-1">
                                    <Minus className="h-3 w-3 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="group/item">
                        <div className="bg-muted/30 p-3 rounded-xl border border-border/40 relative group/card hover:bg-muted/50 hover:border-border transition-all duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-sm font-bold truncate", isRoot ? "text-foreground" : "text-foreground/90")}>
                                        {comment.user_metadata?.full_name || comment.user_metadata?.name || 'Anonymous User'}
                                    </span>
                                    {isOwner && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                                    {comment.user_metadata?.email === 'Gabrielnavainfo@gmail.com' && <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full font-bold">AUTHOR</span>}
                                    {comment.is_pinned && <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-full font-bold"><Pin className="h-3 w-3 fill-yellow-600" /> PINNED</span>}
                                </div>

                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            {/* Content */}
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[80px] bg-background"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleEditSubmit}>Save</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[0.95rem] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium break-words">
                                    {comment.content}
                                </div>
                            )}
                        </div>

                        {/* Actions Toolbar & Show Replies (Below Card) */}
                        {!isEditing && (
                            <div className="mt-1 flex items-center justify-between ml-1">
                                {/* Left: Show Replies Button */}
                                <div>
                                    {isCollapsed && hasReplies && (
                                        <button
                                            onClick={() => setIsCollapsed(false)}
                                            className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <PlusCircleIcon className="h-4 w-4" />
                                            Show {comment.replies?.length} replies
                                        </button>
                                    )}
                                </div>

                                {/* Right: Action Buttons */}
                                <div className={cn(
                                    "flex items-center gap-1 transition-opacity",
                                    isAdmin ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                                )}>
                                    {isAdmin && isRoot && (
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onPin(comment.id, !comment.is_pinned)}>
                                            <Pin className={cn("h-3.5 w-3.5", comment.is_pinned ? "fill-yellow-600 text-yellow-600" : "text-muted-foreground")} />
                                        </Button>
                                    )}

                                    {user && (
                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setIsReplying(!isReplying)}>
                                            <Reply className="h-3 w-3" /> Reply
                                        </Button>
                                    )}

                                    {isOwner && (
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                    )}

                                    {canDelete && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="z-[9999]">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently remove this comment.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(comment.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reply Input */}
                        {isReplying && (
                            <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-top-1 ml-2">
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        autoFocus
                                        placeholder={`Reply to ${comment.user_metadata?.full_name || 'user'}...`}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="min-h-[80px] bg-background text-sm"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                                        <Button size="sm" onClick={handleReplySubmit}>Reply</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Nested Replies */}
                        {!isCollapsed && hasReplies && (
                            <div className="mt-3">
                                <CommentList
                                    comments={comment.replies!}
                                    user={user}
                                    isAdmin={isAdmin}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onPin={onPin}
                                    level={level + 1}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CommentItem;
