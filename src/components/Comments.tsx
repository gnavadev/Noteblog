import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Github, Trash2, Edit2, Reply, X, Pin, Linkedin, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from "@/components/ui/alert-dialog"

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_metadata: any;
    parent_id: string | null;
    is_pinned?: boolean;
    replies?: Comment[];
}

interface CommentsProps {
    postId: string;
    isAdmin: boolean;
}

const Comments: React.FC<CommentsProps> = ({ postId, isAdmin }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // -- Authentication & Real-time --
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        fetchComments();

        const channel = supabase
            .channel('public:comments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => {
                fetchComments();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [postId]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true }); // Important: getting all flat first

        if (error) {
            console.error('Error fetching comments:', error);
        } else if (data) {
            const nested = buildCommentTree(data);
            setComments(nested);
        }
    };

    const buildCommentTree = (flatComments: any[]): Comment[] => {
        const commentMap: { [key: string]: Comment } = {};
        const roots: Comment[] = [];

        // 1. Initialize all comments
        flatComments.forEach(c => {
            commentMap[c.id] = { ...c, replies: [] };
        });

        // 2. Link children to parents & Identify roots
        flatComments.forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies?.push(commentMap[c.id]);
            } else {
                roots.push(commentMap[c.id]);
            }
        });

        // 3. Sort roots: Pinned first, then by date
        return roots.sort((a, b) => {
            if (a.is_pinned === b.is_pinned) {
                // If pin status is same, sort by date (newest first for roots usually, or oldest first?)
                // Chat apps usually oldest at top. Blog comments usually oldest at top. keeping structure.
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return (a.is_pinned ? -1 : 1);
        });
    };


    // -- Actions (Create, Reply, Edit, Delete) --

    const handlePostComment = async (content: string, parentId: string | null = null) => {
        if (!content.trim() || !user) return;

        // Optimistic UI update (optional, but skipping for simplicity with realtime)
        if (!parentId) setLoading(true);

        const { error } = await supabase.from('comments').insert([
            {
                post_id: postId,
                content: content,
                user_id: user.id,
                user_metadata: user.user_metadata,
                parent_id: parentId
            },
        ]);

        if (!parentId) setLoading(false);

        if (error) {
            toast({ title: "Failed to post", description: error.message, variant: "destructive" });
        } else {
            if (!parentId) setNewComment('');
            toast({ title: parentId ? "Reply added!" : "Comment posted!" });
            fetchComments();
        }
    };

    const handleEditComment = async (commentId: string, newContent: string) => {
        const { error } = await supabase
            .from('comments')
            .update({ content: newContent })
            .eq('id', commentId);

        if (error) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Comment updated" });
            fetchComments();
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            // Pseudo-cascade: 1. Fetch children ids
            const getDescendantIds = async (rootId: string): Promise<string[]> => {
                const { data } = await supabase.from('comments').select('id, parent_id').eq('parent_id', rootId);
                let ids = data?.map(c => c.id) || [];
                for (const childId of ids) {
                    const grandChildren = await getDescendantIds(childId);
                    ids = [...ids, ...grandChildren];
                }
                return ids;
            };

            const descendants = await getDescendantIds(commentId);

            // 2. Delete descendants first
            if (descendants.length > 0) {
                const { error: childrenError } = await supabase.from('comments').delete().in('id', descendants);
                if (childrenError) throw childrenError;
            }

            // 3. Delete target
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) throw error;

            toast({ title: "Comment deleted" });
            fetchComments();

        } catch (error: any) {
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        }
    };

    const handlePinComment = async (commentId: string, isPinned: boolean) => {
        // Only allow pinning root comments logic is handled by UI hiding button, but helpful to enforce here if possible.
        // But for simplicity assume UI handles the "only root items" restriction for now or we check parent_id.
        const { error } = await supabase
            .from('comments')
            .update({ is_pinned: isPinned })
            .eq('id', commentId);

        if (error) {
            toast({ title: "Action failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: isPinned ? "Comment Pinned" : "Comment Unpinned" });
            fetchComments();
        }
    }


    // -- Auth --
    const handleLogin = (provider: 'github' | 'linkedin_oidc') => {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectUrl,
                scopes: 'openid profile email'
            }
        });
    };

    return (
        <div className="mt-16 space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Community Discussion</h3>
            </div>

            <div className="space-y-6">
                {/* Main Logic: Recursively render comments */}
                <CommentList
                    comments={comments}
                    user={user}
                    isAdmin={isAdmin}
                    onReply={handlePostComment}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onPin={handlePinComment}
                    level={0}
                />

                {comments.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No thoughts shared yet.</p>
                    </div>
                )}
            </div>

            <Separator className="my-8 opacity-50" />

            {/* Root Comment Box */}
            {user ? (
                <div className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                        <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                        <Textarea
                            rows={3}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your perspective..."
                            className="resize-none bg-background border-border focus-visible:ring-primary/20 rounded-xl min-h-[100px] shadow-sm p-4 text-base"
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={() => handlePostComment(newComment)}
                                disabled={loading || !newComment.trim()}
                                className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {loading ? <span className="animate-spin mr-2">⏳</span> : <Send className="h-4 w-4 mr-2" />}
                                Post Comment
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center bg-gradient-to-br from-muted/50 to-muted/10 rounded-3xl border border-border shadow-sm flex flex-col items-center gap-6">
                    <div className="space-y-2">
                        <h4 className="font-bold text-lg">Join the Conversation</h4>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Sign in to share your thoughts, ask questions, and connect with the community.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="outline" onClick={() => handleLogin('github')} className="rounded-full h-11 px-6 gap-2 bg-background hover:bg-muted/80 border-border shadow-sm">
                            <Github className="h-4 w-4" /> <span>GitHub</span>
                        </Button>
                        <Button variant="outline" onClick={() => handleLogin('linkedin_oidc')} className="rounded-full h-11 px-6 gap-2 bg-background hover:bg-muted/80 border-border shadow-sm">
                            <Linkedin className="h-4 w-4" /> <span>LinkedIn</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---

const CommentList: React.FC<{
    comments: Comment[];
    user: any;
    isAdmin: boolean;
    onReply: (content: string, parentId: string) => void;
    onEdit: (id: string, content: string) => void;
    onDelete: (id: string) => void;
    onPin: (id: string, isPinned: boolean) => void;
    level: number;
}> = ({ comments, user, isAdmin, onReply, onEdit, onDelete, onPin, level }) => {
    return (
        <AnimatePresence initial={false}>
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    user={user}
                    isAdmin={isAdmin}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPin={onPin}
                    level={level}
                />
            ))}
        </AnimatePresence>
    );
};

const CommentItem: React.FC<{
    comment: Comment;
    user: any;
    isAdmin: boolean;
    onReply: (content: string, parentId: string) => void;
    onEdit: (id: string, content: string) => void;
    onDelete: (id: string) => void;
    onPin: (id: string, isPinned: boolean) => void;
    level: number;
}> = ({ comment, user, isAdmin, onReply, onEdit, onDelete, onPin, level }) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const [isCollapsed, setIsCollapsed] = useState(hasReplies); // Default to collapsed if has replies

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
        setIsCollapsed(false); // Auto-expand on reply
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
            className={cn("group relative", level > 0 && "mt-4")}
        >
            <div className="flex gap-4">
                {/* Avatar Column */}
                <div className="flex flex-col items-center gap-2">
                    <Avatar className={cn("border border-border z-10", isRoot ? "h-10 w-10" : "h-8 w-8")}>
                        <AvatarImage src={comment.user_metadata?.avatar_url || comment.user_metadata?.picture} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {(comment.user_metadata?.full_name?.[0] || comment.user_metadata?.name?.[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Thread Line & Collapse Trigger */}
                    {hasReplies && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? "Show replies" : "Hide replies"}
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}

                    {hasReplies && !isCollapsed && (
                        <div className="w-px h-full bg-border/50 group-hover:bg-border/80 transition-colors" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-sm border border-border/50 relative group/card transition-all hover:bg-muted/50 hover:shadow-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground truncate">
                                    {comment.user_metadata?.full_name || comment.user_metadata?.name || 'Anonymous User'}
                                </span>
                                {isOwner && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                                {comment.user_metadata?.email === 'Gabrielnavainfo@gmail.com' && <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded-full font-bold">AUTHOR</span>}
                                {comment.is_pinned && <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded-full font-bold"><Pin className="h-3 w-3 fill-yellow-600" /> PINNED</span>}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:inline-block">
                                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {/* Collapse Button (Mobile/Desktop Header alternative) */}
                                {hasReplies && (
                                    <Button variant="ghost" size="icon" className="h-5 w-5 md:hidden" onClick={() => setIsCollapsed(!isCollapsed)}>
                                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    </Button>
                                )}
                            </div>
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
                            <div className={cn("text-[0.95rem] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium break-words", isCollapsed && "line-clamp-2 opacity-50")}>
                                {comment.content}
                            </div>
                        )}

                        {/* Actions Bar (Bottom Right) */}
                        {!isCollapsed && !isEditing && (
                            <div className="flex justify-end items-center gap-1 mt-3 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                {/* Admin Pin (Root only) */}
                                {isAdmin && isRoot && !isEditing && (
                                    <Button size="icon" variant="ghost" className={cn("h-7 w-7", comment.is_pinned ? "text-yellow-600 bg-yellow-500/10" : "text-muted-foreground hover:text-foreground")} onClick={() => onPin(comment.id, !comment.is_pinned)} title={comment.is_pinned ? "Unpin" : "Pin"}>
                                        <Pin className="h-3.5 w-3.5" />
                                    </Button>
                                )}

                                {user && (
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setIsReplying(!isReplying)}>
                                        <Reply className="h-3.5 w-3.5" /> Reply
                                    </Button>
                                )}

                                {isOwner && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}

                                {canDelete && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="z-[9999]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(comment.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reply Input */}
                    {isReplying && !isCollapsed && (
                        <div className="flex gap-3 mt-3 animate-in fade-in slide-in-from-top-1">
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

                    {/* Collapsed State Indicator */}
                    {isCollapsed && hasReplies && (
                        <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs text-muted-foreground" onClick={() => setIsCollapsed(false)}>
                            <PlusCircle className="h-3 w-3 mr-1.5" /> Show {comment.replies?.length} replies
                        </Button>
                    )}

                    {/* Nested Replies */}
                    {!isCollapsed && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4">
                            <CommentList
                                comments={comment.replies}
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
        </motion.div>
    );
};

// Simple Icon for expand
const PlusCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
)

export default Comments;
