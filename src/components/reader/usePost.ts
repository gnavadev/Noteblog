import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Post } from './types';

interface UsePostOptions {
    selectedPostId: string | null;
    initialPost: Post | null;
}

interface UsePostResult {
    post: Post | null;
    loading: boolean;
}

export function usePost({ selectedPostId, initialPost }: UsePostOptions): UsePostResult {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchPost = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                setPost(data);
            }
        } catch (err) {
            console.error('Failed to fetch post:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle initial post or fetch by ID
    useEffect(() => {
        if (initialPost) {
            setPost(initialPost);
            return;
        }

        if (selectedPostId) {
            fetchPost(selectedPostId);
        } else {
            setPost(null);
        }
    }, [selectedPostId, initialPost]);

    // Subscribe to realtime updates
    useEffect(() => {
        const channel = supabase
            .channel('reader_updates')
            .on('broadcast', { event: 'refresh' }, (payload: { payload: { postId: string } }) => {
                if (selectedPostId && payload.payload.postId === selectedPostId) {
                    fetchPost(selectedPostId);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedPostId]);

    return { post, loading };
}

export default usePost;
