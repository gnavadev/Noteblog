import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { isAdmin as checkAdmin } from '@/lib/auth-utils';
import type { Post } from './types';
import { useTopics } from '../TopicProvider';

export function useBlogState(
    initialPosts: Post[] = [],
    initialSelectedPostId: string | null = null,
    initialTopic: string | null = null,
    initialShowPostIt: boolean = false
) {
    const { toast } = useToast();
    const { topics: dbTopics, getTopicColor, deleteTopicIfEmpty } = useTopics();
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(initialSelectedPostId);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopic);

    const [user, setUser] = useState<any>(null);
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [isReaderExpanded, setIsReaderExpanded] = useState(!!initialSelectedPostId);
    const [showPostIt, setShowPostIt] = useState(initialShowPostIt);

    const isAdmin = checkAdmin(user?.id);

    // Derived State: Calculate topics and counts whenever posts or DB topics change
    const topics = useMemo(() => {
        const counts = posts.reduce((acc: any, post: Post) => {
            const topicName = post.topic || 'Uncategorized';
            acc[topicName] = (acc[topicName] || 0) + 1;
            return acc;
        }, {});

        // Merge counts into DB topics
        let mergedTopics = dbTopics.map(t => ({
            ...t,
            count: counts[t.name] || 0
        }));

        // Handle topics that exist in posts but not in DB yet (fallback)
        Object.keys(counts).forEach(name => {
            if (!mergedTopics.find(t => t.name === name)) {
                mergedTopics.push({
                    id: '',
                    name,
                    count: counts[name],
                    color: getTopicColor(name)
                });
            }
        });

        // Apply saved order
        const savedOrderStr = typeof window !== 'undefined' ? localStorage.getItem('topicOrder') : null;
        if (savedOrderStr) {
            try {
                const savedOrder = JSON.parse(savedOrderStr) as string[];
                mergedTopics.sort((a, b) => {
                    const indexA = savedOrder.indexOf(a.name);
                    const indexB = savedOrder.indexOf(b.name);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            } catch (e) { /* ignore */ }
        }
        return mergedTopics;
    }, [posts, dbTopics, getTopicColor]);

    useEffect(() => {
        // On mobile, force expanded view (no small preview). On desktop, start collapsed.
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setIsReaderExpanded(true);
        } else {
            setIsReaderExpanded(false);
        }
    }, [selectedPostId]);

    const fetchPosts = useCallback(async (currentUser = user) => {
        const isAdminUser = checkAdmin(currentUser?.id);

        let query = supabase
            .from('notes')
            .select('*');

        if (!isAdminUser) {
            query = query.eq('is_public', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
            setPosts(data);
        }
        setLoading(false);
    }, [user]);

    // Effect 1: Auth Session & Listener
    useEffect(() => {
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) setAdminAvatar(savedAvatar);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (checkAdmin(currentUser?.id)) {
                const avatar = currentUser?.user_metadata?.avatar_url;
                if (avatar) {
                    setAdminAvatar(avatar);
                    localStorage.setItem('adminAvatar', avatar);
                }
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (checkAdmin(currentUser?.id)) {
                const avatar = currentUser?.user_metadata?.avatar_url;
                if (avatar) {
                    setAdminAvatar(avatar);
                    localStorage.setItem('adminAvatar', avatar);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []); // Run ONLY once on mount

    // Effect 2: Data Refresh & Realtime Subscriptions
    const hasInitialFetch = useRef(initialPosts.length > 0);

    useEffect(() => {
        // Skip fetch on mount if we already have initial posts from server
        if (!hasInitialFetch.current) {
            fetchPosts();
        } else {
            // Reset for future manual refreshes or user changes
            hasInitialFetch.current = false;
        }

        const dbChannel = supabase
            .channel('magazine_db_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notes' },
                () => fetchPosts()
            )
            .subscribe();

        const broadcastChannel = supabase
            .channel('blog_updates')
            .on('broadcast', { event: 'refresh' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(broadcastChannel);
        };
    }, [user, fetchPosts]);

    // PopState handler for browser navigation
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/' || path === '') {
                setSelectedPostId(null);
                setSelectedTopic(null);
                setShowPostIt(false);
            } else if (path.startsWith('/post/')) {
                const id = path.replace('/post/', '');
                setSelectedPostId(id);
                setSelectedTopic(null);
                setShowPostIt(false);
            } else if (path.startsWith('/topic/')) {
                const topic = decodeURIComponent(path.replace('/topic/', ''));
                setSelectedTopic(topic);
                setSelectedPostId(null);
                setShowPostIt(false);
            } else if (path === '/board') {
                setShowPostIt(true);
                setSelectedPostId(null);
                setSelectedTopic(null);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleSelectPostIt = useCallback(() => {
        setShowPostIt(true);
        setSelectedPostId(null);
        setSelectedTopic(null);
        window.history.pushState({}, '', '/board');
    }, []);

    const handleSelectPost = useCallback((id: string | null) => {
        setSelectedPostId(id);
        setShowPostIt(false);
        if (id === null) {
            window.history.pushState({}, '', '/');
        } else {
            window.history.pushState({}, '', `/post/${id}`);
        }
    }, []);

    const handleSelectTopic = useCallback((topic: string | null) => {
        setSelectedTopic(topic);
        setShowPostIt(false);
        if (topic === null) {
            window.history.pushState({}, '', '/');
        } else {
            window.history.pushState({}, '', `/topic/${encodeURIComponent(topic)}`);
        }
    }, []);

    const handleUpdateTopicOrder = useCallback((newOrder: string[]) => {
        localStorage.setItem('topicOrder', JSON.stringify(newOrder));
        // Note: Sort is now handled by useMemo, so we just need to force a re-render if needed
        // but since we save to localStorage and useMemo depends on posts/dbTopics, 
        // we might want a small state or just use the local storage as source in useMemo.
        // For now, let's keep it simple.
        fetchPosts();
    }, [fetchPosts]);

    const handleNewPost = useCallback(() => {
        window.location.href = '/editor/new';
    }, []);

    const handleSavePost = handleNewPost; // Compatibility alias if needed

    const handleEditPost = useCallback((id: string) => {
        window.location.href = `/editor/${id}`;
    }, []);

    const handleDeletePost = useCallback(async (id: string) => {
        try {
            const postToDelete = posts.find(p => p.id === id);
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
            if (selectedPostId === id) setSelectedPostId(null);

            if (postToDelete?.topic) {
                await deleteTopicIfEmpty(postToDelete.topic);
            }

            await supabase.channel('blog_updates').send({
                type: 'broadcast',
                event: 'refresh',
                payload: { action: 'deleted', postId: id }
            });
            await fetchPosts();
            toast({ title: "Post deleted successfully" });
        } catch (error: any) {
            console.error('Failure deleting post:', error);
            toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        }
    }, [selectedPostId, fetchPosts, toast, posts, deleteTopicIfEmpty]);



    return {
        // State
        posts,
        topics,
        loading,
        selectedPostId,
        selectedTopic,
        user,
        adminAvatar,
        isReaderExpanded,
        setIsReaderExpanded,
        showPostIt,
        isAdmin,
        // Handlers
        handleSelectPostIt,
        handleSelectPost,
        handleSelectTopic,
        handleUpdateTopicOrder,
        handleNewPost,
        handleEditPost,
        handleDeletePost,
        fetchPosts,
    };
}
