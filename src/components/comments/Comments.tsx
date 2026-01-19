import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Github, Linkedin } from 'lucide-react';
import CommentList from './CommentList';
import { useComments } from './useComments';
import type { CommentsProps } from './types';

const Comments: React.FC<CommentsProps> = ({ postId, isAdmin }) => {
    const [newComment, setNewComment] = useState('');
    const {
        comments,
        user,
        loading,
        handlePostComment,
        handleEditComment,
        handleDeleteComment,
        handlePinComment,
        handleLogin,
    } = useComments(postId);

    const onSubmitComment = async () => {
        const success = await handlePostComment(newComment);
        if (success) setNewComment('');
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
                                onClick={onSubmitComment}
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

export default Comments;
