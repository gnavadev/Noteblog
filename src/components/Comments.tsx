import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_metadata: any;
}

interface CommentsProps {
    postSlug: string;
}

const Comments: React.FC<CommentsProps> = ({ postSlug }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        fetchComments();
    }, [postSlug]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_slug', postSlug)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data || []);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setLoading(true);

        const { error } = await supabase.from('comments').insert([
            {
                post_slug: postSlug,
                content: newComment,
                user_id: user.id,
                user_metadata: user.user_metadata,
            },
        ]);

        setLoading(false);
        if (error) {
            toast({ title: "Failed to post comment", description: error.message, variant: "destructive" });
        } else {
            setNewComment('');
            fetchComments();
            toast({ title: "Comment posted!" });
        }
    };

    return (
        <div className="mt-16 space-y-8">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Community Discussion</h3>
            </div>

            <div className="space-y-6">
                {comments.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={item.user_metadata?.avatar_url} />
                            <AvatarFallback>{(item.user_metadata?.full_name?.[0] || 'A').toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground">
                                    {item.user_metadata?.full_name || 'Anonymous User'}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-[0.95rem] text-muted-foreground leading-relaxed">
                                {item.content}
                            </p>
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No thoughts shared yet. Be the first!</p>
                    </div>
                )}
            </div>

            <Separator className="my-8" />

            {user ? (
                <div className="space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold">Write a thought...</span>
                    </div>
                    <Textarea
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="What's on your mind? Be kind and curious."
                        className="resize-none bg-background border-border/50 focus-visible:ring-primary/20 rounded-xl"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !newComment.trim()}
                            className="rounded-full px-8 gap-2 font-bold shadow-lg shadow-primary/10"
                        >
                            <Send className="h-4 w-4" />
                            <span>Post Thought</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center bg-muted/30 rounded-2xl border border-border">
                    <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                        <span>Please log in to participate in the discussion.</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default Comments;
