import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { POSTIT_COLORS, type PostItData, type DrawingCanvasHandle } from './types';

interface UsePostItBoardOptions {
    userId: string | null;
    isAdmin: boolean;
}

export function usePostItBoard({ userId, isAdmin }: UsePostItBoardOptions) {
    const { toast } = useToast();
    const [postIts, setPostIts] = useState<PostItData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activePostItId, setActivePostItId] = useState<string | null>(null);
    const canvasRefs = useRef<{ [key: string]: DrawingCanvasHandle | null }>({});

    const effectiveUserId = userId || (import.meta.env.DEV ? '00000000-0000-0000-0000-000000000000' : null);
    const userHasPostIt = postIts.some(p => p.user_id === effectiveUserId);

    const fetchPostIts = useCallback(async () => {
        const { data, error } = await supabase
            .from('post_its')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching post-its:', error);
            toast({ title: "Error fetching post-its", variant: "destructive" });
        } else if (data) {
            setPostIts(data);
        }
        setLoading(false);
    }, [toast]);

    // Set default active post-it
    useEffect(() => {
        if (!activePostItId && postIts.length > 0) {
            const userPostIt = postIts.find(p => p.user_id === effectiveUserId);
            if (userPostIt) {
                setActivePostItId(userPostIt.id);
            } else if (postIts.length === 1) {
                setActivePostItId(postIts[0].id);
            }
        }
    }, [postIts, activePostItId, effectiveUserId]);

    // Fetch + realtime subscription
    useEffect(() => {
        fetchPostIts();

        const channel = supabase
            .channel('post_its_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'post_its' },
                () => fetchPostIts()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPostIts]);

    const handleAddPostIt = async () => {
        if (isAdding) return;

        let targetUserId = userId;
        if (!targetUserId && import.meta.env.DEV) {
            targetUserId = '00000000-0000-0000-0000-000000000000';
        }

        if (!targetUserId) {
            toast({ title: "Please log in to add a post-it", variant: "destructive" });
            return;
        }

        setIsAdding(true);

        try {
            const randomColor = POSTIT_COLORS[Math.floor(Math.random() * POSTIT_COLORS.length)];
            const randomX = Math.floor(Math.random() * 200) + 50;
            const randomY = Math.floor(Math.random() * 200) + 50;

            const newPostIt = {
                user_id: targetUserId,
                content: '',
                drawing_data: [],
                position_x: randomX,
                position_y: randomY,
                color: randomColor
            };

            const { error } = await supabase.from('post_its').insert([newPostIt]);

            if (error) {
                console.error('Error adding post-it:', error);
                if (error.code === '23505' || error.message.includes('create one post-it')) {
                    toast({ title: "You can only have one post-it!", description: "Delete your old one to create a new one.", variant: "destructive" });
                } else {
                    toast({ title: "Failed to add post-it", variant: "destructive" });
                }
            } else {
                fetchPostIts();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setTimeout(() => setIsAdding(false), 500);
        }
    };

    const handleUpdatePostIt = async (id: string, updates: Partial<PostItData>) => {
        const { error } = await supabase
            .from('post_its')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating post-it:', error);
            toast({ title: "Failed to save changes", description: error.message, variant: "destructive" });
        } else {
            fetchPostIts();
        }
    };

    const handleDeletePostIt = async (id: string) => {
        const { error } = await supabase
            .from('post_its')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post-it:', error);
            toast({ title: "Failed to delete post-it", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Post-it deleted" });
            if (activePostItId === id) setActivePostItId(null);
        }
    };

    const handleUndo = () => {
        if (activePostItId && canvasRefs.current[activePostItId]) {
            canvasRefs.current[activePostItId]?.undo();
        } else {
            toast({ title: "Select a post-it to undo", description: "Click on a post-it first" });
        }
    };

    const handleRedo = () => {
        if (activePostItId && canvasRefs.current[activePostItId]) {
            canvasRefs.current[activePostItId]?.redo();
        } else {
            toast({ title: "Select a post-it to redo", description: "Click on a post-it first" });
        }
    };

    return {
        postIts,
        loading,
        isAdding,
        activePostItId,
        setActivePostItId,
        effectiveUserId,
        userHasPostIt,
        canvasRefs,
        handleAddPostIt,
        handleUpdatePostIt,
        handleDeletePostIt,
        handleUndo,
        handleRedo
    };
}

export default usePostItBoard;
