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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    // Use a ref for internal tracking within the stable fetch callback
    const hasUnsavedChangesRef = useRef(false);
    useEffect(() => {
        hasUnsavedChangesRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    const canvasRefs = useRef<{ [key: string]: DrawingCanvasHandle | null }>({});

    const effectiveUserId = userId || (import.meta.env.DEV ? '00000000-0000-0000-0000-000000000000' : null);
    const userHasPostIt = postIts.some(p => p.user_id === effectiveUserId);

    // Stable fetch function
    const fetchPostIts = useCallback(async () => {
        const { data, error } = await supabase
            .from('post_its')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching post-its:', error);
            toast({ title: "Error fetching post-its", variant: "destructive" });
        } else if (data) {
            // Merge logic using functional update to get current local state
            setPostIts(prev => {
                if (!hasUnsavedChangesRef.current) return data;

                return data.map(remoteItem => {
                    if (remoteItem.user_id === effectiveUserId) {
                        const localItem = prev.find(p => p.user_id === effectiveUserId);
                        return localItem || remoteItem;
                    }
                    return remoteItem;
                });
            });
        }
        setLoading(false);
    }, [toast, effectiveUserId]); // identity now depends only on userId, not hasUnsavedChanges

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

    // Initial fetch
    useEffect(() => {
        fetchPostIts();
    }, [fetchPostIts]);

    // Realtime subscription - perfectly stable
    useEffect(() => {
        const channel = supabase
            .channel('post_its_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'post_its' },
                () => {
                    // Only fetch if we don't have unsaved changes to avoid race conditions
                    if (!hasUnsavedChangesRef.current) {
                        fetchPostIts();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPostIts]);

    const handleAddPostIt = useCallback(async () => {
        if (isAdding) return;

        let targetUserId = userId;
        if (!targetUserId && import.meta.env.DEV) {
            targetUserId = '00000000-0000-0000-0000-000000000001';
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
    }, [userId, isAdding, fetchPostIts, toast]);

    const handleUpdatePostIt = useCallback((id: string, updates: Partial<PostItData>) => {
        setPostIts(prev => {
            const postIt = prev.find(p => p.id === id);
            if (!postIt) return prev;

            const canEdit = postIt.user_id === effectiveUserId || isAdmin;
            if (canEdit) {
                setHasUnsavedChanges(true);
            }

            return prev.map(p => p.id === id ? { ...p, ...updates } : p);
        });
    }, [effectiveUserId, isAdmin]);

    const handleSaveAll = useCallback(async () => {
        const modifiedPostIts = postIts.filter(p => p.user_id === effectiveUserId || isAdmin);

        if (modifiedPostIts.length === 0) return;

        setLoading(true);
        try {
            const savePromises = modifiedPostIts.map(p =>
                supabase
                    .from('post_its')
                    .update({
                        content: p.content,
                        drawing_data: p.drawing_data,
                        position_x: p.position_x,
                        position_y: p.position_y,
                        color: p.color
                    })
                    .eq('id', p.id)
            );

            const results = await Promise.all(savePromises);
            const firstError = results.find(r => r.error)?.error;

            if (firstError) throw firstError;

            setHasUnsavedChanges(false);
            toast({ title: "Changes saved successfully" });
        } catch (error: any) {
            console.error('Error saving post-it:', error);
            toast({ title: "Failed to save changes", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId, isAdmin, fetchPostIts, toast, postIts]);

    const handleDeletePostIt = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('post_its')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post-it:', error);
            toast({ title: "Failed to delete post-it", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Post-it deleted" });
            setHasUnsavedChanges(false);
            if (activePostItId === id) setActivePostItId(null);
            fetchPostIts();
        }
    }, [activePostItId, fetchPostIts, toast]);

    const handleUndo = useCallback(() => {
        if (activePostItId && canvasRefs.current[activePostItId]) {
            canvasRefs.current[activePostItId]?.undo();
        } else {
            toast({ title: "Select a post-it to undo", description: "Click on a post-it first" });
        }
    }, [activePostItId, toast]);

    const handleRedo = useCallback(() => {
        if (activePostItId && canvasRefs.current[activePostItId]) {
            canvasRefs.current[activePostItId]?.redo();
        } else {
            toast({ title: "Select a post-it to redo", description: "Click on a post-it first" });
        }
    }, [activePostItId, toast]);

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
        handleSaveAll,
        handleDeletePostIt,
        handleUndo,
        handleRedo,
        hasUnsavedChanges
    };
}

export default usePostItBoard;
