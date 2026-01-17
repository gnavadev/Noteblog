import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import MagazineGrid from './MagazineGrid';
import ReaderPanel from './ReaderPanel';
import PostEditor from './NoteEditor';
import PostItBoard from './PostItBoard';
import { Plus, Menu, Sun, Moon, User } from "lucide-react";
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

interface BlogShellInnerProps {
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
}

const BlogShellInner: React.FC<BlogShellInnerProps> = ({ colorMode, toggleTheme }) => {
    const { toast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [topics, setTopics] = useState<{ name: string; count: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [isReaderExpanded, setIsReaderExpanded] = useState(false);
    const [showPostIt, setShowPostIt] = useState(false);
    const isMobile = useIsMobile();
    const contentRef = useRef<HTMLDivElement>(null);
    const topicPalette = ['#ff9500', '#ff2d55', '#007aff', '#5856d6', '#00b96b', '#af52de', '#ff3b30', '#ffcc00'];

    // Reset expansion when changing posts
    useEffect(() => {
        setIsReaderExpanded(false);
    }, [selectedPostId]);

    useEffect(() => {
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) setAdminAvatar(savedAvatar);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1') {
                const avatar = currentUser.user_metadata?.avatar_url;
                if (avatar) {
                    setAdminAvatar(avatar);
                    localStorage.setItem('adminAvatar', avatar);
                }
            }
            fetchPosts(currentUser);
        });

        // Initialize session and then fetch posts
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1') {
                const avatar = currentUser.user_metadata?.avatar_url;
                if (avatar) {
                    setAdminAvatar(avatar);
                    localStorage.setItem('adminAvatar', avatar);
                }
            }
            fetchPosts(currentUser);
        });

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
            subscription.unsubscribe();
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(broadcastChannel);
        };
    }, []);

    const fetchPosts = async (currentUser = user) => {
        const isAdmin = currentUser?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1';

        let query = supabase
            .from('notes')
            .select('*');

        // If not admin, only show public posts
        if (!isAdmin) {
            query = query.eq('is_public', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
            setPosts(data);
            const counts = data.reduce((acc: any, post) => {
                const topicName = post.topic || 'Uncategorized';
                acc[topicName] = (acc[topicName] || 0) + 1;
                return acc;
            }, {});

            let dynamicTopics = Object.keys(counts).map((name, index) => ({
                name,
                count: counts[name],
                color: topicPalette[index % topicPalette.length]
            }));

            const savedOrderStr = localStorage.getItem('topicOrder');
            if (savedOrderStr) {
                const savedOrder = JSON.parse(savedOrderStr) as string[];
                dynamicTopics.sort((a, b) => {
                    const indexA = savedOrder.indexOf(a.name);
                    const indexB = savedOrder.indexOf(b.name);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
            setTopics(dynamicTopics);
        }
        setLoading(false);
    };

    const handleSelectPostIt = () => {
        setShowPostIt(true);
        setSelectedPostId(null);
        setSelectedTopic(null);
    };

    const handleSelectPost = (id: string | null) => {
        setSelectedPostId(id);
        setShowPostIt(false);
    };

    const handleSelectTopic = (topic: string | null) => {
        setSelectedTopic(topic);
        setShowPostIt(false);
    };

    const isAdmin = user?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1';

    const handleUpdateTopicOrder = (newOrder: string[]) => {
        localStorage.setItem('topicOrder', JSON.stringify(newOrder));
        setTopics(prev => [...prev].sort((a, b) => {
            const indexA = newOrder.indexOf(a.name);
            const indexB = newOrder.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        }));
    };

    const handleNewPost = () => {
        setEditingPostId(null);
        setIsEditorOpen(true);
    };

    const handleEditPost = (id: string) => {
        setEditingPostId(id);
        setIsEditorOpen(true);
    };

    const handleDeletePost = async (id: string) => {
        try {
            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) throw error;
            if (selectedPostId === id) setSelectedPostId(null);
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
    };

    const sidebarProps = {
        onNewPost: handleNewPost,
        selectedPostId,
        onSelectPost: handleSelectPost,
        selectedTopic,
        onSelectTopic: handleSelectTopic,
        posts,
        topics,
        isAdmin,
        onUpdateTopicOrder: handleUpdateTopicOrder,
        adminAvatar,
        isSelectedPostIt: showPostIt,
        onSelectPostIt: handleSelectPostIt
    };


    return (
        <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
            <Sidebar {...sidebarProps} />

            <SidebarInset className="flex-1 flex flex-col relative w-full overflow-hidden">
                <ContentArea
                    contentRef={contentRef}
                    isMobile={isMobile}
                    showPostIt={showPostIt}
                    user={user}
                    posts={posts}
                    topics={topics}
                    selectedPostId={selectedPostId}
                    handleSelectPost={handleSelectPost}
                    handleNewPost={handleNewPost}
                    handleEditPost={handleEditPost}
                    handleDeletePost={handleDeletePost}
                    isAdmin={isAdmin}
                    selectedTopic={selectedTopic}
                    loading={loading}
                    isReaderExpanded={isReaderExpanded}
                    setIsReaderExpanded={setIsReaderExpanded}
                    colorMode={colorMode}
                    toggleTheme={toggleTheme}
                />
            </SidebarInset>

            {isEditorOpen && (
                <PostEditor
                    open={isEditorOpen}
                    postId={editingPostId}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={() => {
                        fetchPosts();
                        setIsEditorOpen(false);
                    }}
                    availableTopics={topics}
                    colorMode={colorMode}
                    toggleTheme={toggleTheme}
                />
            )}

            <div className="fixed right-6 bottom-6 z-[200] flex flex-col gap-3">
                {isAdmin && (
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:scale-105 transition-transform"
                        onClick={handleNewPost}
                    >
                        <Plus className="h-7 w-7" />
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl bg-background/80 backdrop-blur-md hover:scale-105 transition-transform"
                    onClick={toggleTheme}
                >
                    {colorMode === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    );
};

// Extracted ContentArea for better organization
const ContentArea: React.FC<any> = ({
    contentRef,
    isMobile,
    showPostIt,
    user,
    posts,
    topics,
    selectedPostId,
    handleSelectPost,
    handleNewPost,
    handleEditPost,
    handleDeletePost,
    isAdmin,
    selectedTopic,
    loading,
    isReaderExpanded,
    setIsReaderExpanded,
    colorMode,
    toggleTheme
}) => {
    return (
        <main
            ref={contentRef}
            className="flex-1 h-screen overflow-x-hidden overflow-y-auto"
            id="grid-scroll-container"
        >
            {isMobile && (
                <div className="fixed top-6 left-6 z-[100]">
                    <SidebarTrigger className="h-12 w-12 rounded-full shadow-lg bg-background border-none flex items-center justify-center">
                        <Menu className="h-6 w-6" />
                    </SidebarTrigger>
                </div>
            )}

            {showPostIt ? (
                <div className="h-full bg-card overflow-hidden border border-border shadow-xl">
                    <PostItBoard user={user} isAdmin={isAdmin} />
                </div>
            ) : (
                <MagazineGrid
                    selectedPostId={selectedPostId}
                    onSelectPost={handleSelectPost}
                    onNewPost={handleNewPost}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    isAdmin={isAdmin}
                    selectedTopic={selectedTopic}
                    posts={posts}
                    topics={topics}
                    loading={loading}
                />
            )}

            <AnimatePresence>
                {selectedPostId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: isReaderExpanded ? 0 : 1,
                                transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                            }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleSelectPost(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-[4px] z-[190]"
                            style={{ pointerEvents: isReaderExpanded ? 'none' : 'auto' }}
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{
                                x: 0,
                                width: isReaderExpanded ? '100vw' : 'clamp(320px, 60vw, 800px)',
                            }}
                            exit={{ x: '100%' }}
                            transition={{
                                width: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                                x: { type: 'spring', damping: 28, stiffness: 180 }
                            }}
                            layout
                            className={cn(
                                "fixed top-0 right-0 bottom-0 z-[200] bg-sidebar shadow-2xl overflow-hidden flex flex-col border-l border-border",
                                isReaderExpanded && "z-[5000]"
                            )}
                        >
                            <ReaderPanel
                                selectedPostId={selectedPostId}
                                initialPost={posts.find((p: Post) => p.id === selectedPostId) || null}
                                topics={topics}
                                isExpanded={isReaderExpanded}
                                onToggleExpand={() => setIsReaderExpanded(!isReaderExpanded)}
                                onClose={() => handleSelectPost(null)}
                                colorMode={colorMode}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </main>
    )
}

const BlogShell: React.FC = () => {
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Read from localStorage on mount, after inline script has run
        const savedTheme = localStorage.getItem('blog-theme');
        const theme = (savedTheme as 'light' | 'dark') || 'light';
        setColorMode(theme);
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
                    setColorMode(theme || 'light');
                    if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const newMode = colorMode === 'light' ? 'dark' : 'light';
        setColorMode(newMode);
        document.documentElement.setAttribute('data-theme', newMode);
        if (newMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('blog-theme', newMode);
    };

    return (
        <SidebarProvider>
            <BlogShellInner colorMode={colorMode} toggleTheme={toggleTheme} />
            <Toaster />
        </SidebarProvider>
    );
};

export default BlogShell;
