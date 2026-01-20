import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from "@/hooks/use-toast";
import type { Comment } from './types';

export function useComments(postId: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const buildCommentTree = useCallback((flatComments: any[]): Comment[] => {
        const commentMap: { [key: string]: Comment } = {};
        const roots: Comment[] = [];

        flatComments.forEach(c => {
            commentMap[c.id] = { ...c, replies: [] };
        });

        flatComments.forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies?.push(commentMap[c.id]);
            } else {
                roots.push(commentMap[c.id]);
            }
        });

        return roots.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }, []);

    const fetchComments = useCallback(async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else if (data) {
            const nested = buildCommentTree(data);
            setComments(nested);
        }
    }, [postId, buildCommentTree]);

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
    }, [postId, fetchComments]);

    const handlePostComment = async (content: string, parentId: string | null = null) => {
        if (!content.trim() || !user) return;

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
            toast({ title: parentId ? "Reply added!" : "Comment posted!" });
            fetchComments();
            if (!parentId) return true; // Signal to clear input
        }
        return !error;
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
        const { error } = await supabase.from('comments').delete().eq('id', commentId);

        if (error) {
            console.error('Error deleting comment:', error);
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Comment deleted" });
            fetchComments();
        }
    };

    const handlePinComment = async (commentId: string, isPinned: boolean) => {
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
    };

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

    return {
        comments,
        user,
        loading,
        handlePostComment,
        handleEditComment,
        handleDeleteComment,
        handlePinComment,
        handleLogin,
    };
}
