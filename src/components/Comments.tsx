import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Github, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_metadata: any;
}

interface CommentsProps {
    postId: string;
}

const Comments: React.FC<CommentsProps> = ({ postId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        // Initial Fetch
        fetchComments();

        // Real-time Subscription
        const channel = supabase
            .channel('public:comments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, (payload) => {
                fetchComments(); // Simple refresh on any change
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
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data || []);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim() || !user) return;
        setLoading(true);

        const { error } = await supabase.from('comments').insert([
            {
                post_id: postId,
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

    const handleLogin = (provider: 'github' | 'google') => {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        supabase.auth.signInWithOAuth({
            provider: provider,
            options: { redirectTo: redirectUrl }
        });
    };

    return (
        <div className="mt-16 space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Community Discussion <span className="text-muted-foreground ml-2 text-sm font-normal">({comments.length})</span></h3>
            </div>

            <div className="space-y-6">
                <AnimatePresence initial={false}>
                    {comments.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 group"
                        >
                            <Avatar className="h-10 w-10 border border-border mt-1">
                                <AvatarImage src={item.user_metadata?.avatar_url || item.user_metadata?.picture} />
                                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                                    {(item.user_metadata?.full_name?.[0] || item.user_metadata?.name?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-sm border border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-foreground">
                                            {item.user_metadata?.full_name || item.user_metadata?.name || 'Anonymous User'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-[0.95rem] text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {comments.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border/60">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No thoughts shared yet.</p>
                    </div>
                )}
            </div>

            <Separator className="my-8 opacity-50" />

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
                                onClick={handleSubmit}
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
                        <Button
                            variant="outline"
                            onClick={() => handleLogin('github')}
                            className="rounded-full h-11 px-6 gap-2 bg-background hover:bg-muted/80 border-border shadow-sm"
                        >
                            <Github className="h-4 w-4" />
                            <span>Continue with GitHub</span>
                        </Button>
                        {/* Add Google or others if configured */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Comments;
