import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import PostIt from './PostIt';
import type { PostItData } from './PostIt';
import PostItToolbar from './PostItToolbar';
import type { PostItTool } from './PostItToolbar';
import type { DrawingCanvasHandle } from './DrawingCanvas';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface PostItBoardProps {
    user: any;
    isAdmin: boolean;
}

const COLORS = [
    '#fff740', // Yellow
    '#ff7eb9', // Pink
    '#7afcff', // Blue
    '#feff9c', // Light Yellow
    '#ff9e9e', // Light Red
    '#9eff9e', // Light Green
];

const PostItBoard: React.FC<PostItBoardProps> = ({ user, isAdmin }) => {
    const { toast } = useToast();
    const [postIts, setPostIts] = useState<PostItData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTool, setActiveTool] = useState<PostItTool>('pencil');
    const [pencilSize, setPencilSize] = useState(3);
    const [eraserSize, setEraserSize] = useState(10);
    const [activePostItId, setActivePostItId] = useState<string | null>(null);
    const canvasRefs = useRef<{ [key: string]: DrawingCanvasHandle | null }>({});

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

    useEffect(() => {
        fetchPostIts();

        const channel = supabase
            .channel('post_its_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'post_its' },
                () => {
                    fetchPostIts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPostIts]);

    const handleAddPostIt = async () => {
        if (isAdding) return;

        let userId = user?.id;

        // In development mode, allow posting without login using a placeholder ID
        if (!userId && import.meta.env.DEV) {
            userId = '00000000-0000-0000-0000-000000000000'; // Placeholder Dev ID
        }

        if (!userId) {
            toast({ title: "Please log in to add a post-it", variant: "destructive" });
            return;
        }

        setIsAdding(true);

        try {
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
            const randomX = Math.floor(Math.random() * 200) + 50;
            const randomY = Math.floor(Math.random() * 200) + 50;

            const newPostIt = {
                user_id: userId,
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
                // Manually trigger a fetch to update the UI immediately
                // The real-time subscription will also catch this, but this makes it feel faster
                fetchPostIts();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            // Keep the 'isAdding' state true for a short moment to allow the UI to catch up 
            // with the new post-it (and thus disable the button via userHasPostIt)
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
        }
    };

    const handleDeletePostIt = async (id: string) => {
        const { error } = await supabase
            .from('post_its')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post-it:', error);
            toast({
                title: "Failed to delete post-it",
                description: error.message,
                variant: "destructive"
            });
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

    const effectiveUserId = user?.id || (import.meta.env.DEV ? '00000000-0000-0000-0000-000000000000' : null);
    const userHasPostIt = postIts.some(p => p.user_id === effectiveUserId);

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#e5e5f7] dark:bg-[#1a1c24] border-inner shadow-inner flex flex-col">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <PostItToolbar
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onAddPostIt={handleAddPostIt}
                    canAdd={!userHasPostIt && !isAdding}
                    isAdmin={isAdmin}
                    pencilSize={pencilSize}
                    onPencilSizeChange={setPencilSize}
                    eraserSize={eraserSize}
                    onEraserSizeChange={setEraserSize}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                />
            </div>

            {/* Board Content */}
            <div className="flex-1 relative overflow-auto p-20 min-h-[800px] min-w-[800px]">
                {!loading && (
                    postIts.map(postIt => (
                        <PostIt
                            key={postIt.id}
                            ref={el => { canvasRefs.current[postIt.id] = el; }}
                            data={postIt}
                            tool={activeTool}
                            pencilSize={pencilSize}
                            eraserSize={eraserSize}
                            canEdit={postIt.user_id === effectiveUserId}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdatePostIt}
                            onDelete={handleDeletePostIt}
                            onDragEnd={(id, x, y) => handleUpdatePostIt(id, { position_x: x, position_y: y })}
                            onInteract={() => setActivePostItId(postIt.id)}
                        />
                    ))
                )}

                {postIts.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center opacity-30 select-none">
                            <h3 className="text-4xl font-bold mb-2">The board is empty</h3>
                            <p className="text-xl">Be the first to leave a note!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostItBoard;
