import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MagazineGrid from './MagazineGrid';
import ReaderPanel from './ReaderPanel';
import PostEditor from './NoteEditor';
import { PlusOutlined, MenuOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { supabase } from '../lib/supabase';
import { ConfigProvider, App, FloatButton, Layout, message, Drawer, Grid } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeConfig } from '../styles/theme';
import { useRef } from 'react';

const { Content, Sider } = Layout;

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

const BlogShell: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [topics, setTopics] = useState<{ name: string; count: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    // Reset expansion when changing posts
    useEffect(() => {
        setIsReaderExpanded(false);
    }, [selectedPostId]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isReaderExpanded, setIsReaderExpanded] = useState(false);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const contentRef = useRef<HTMLDivElement>(null);
    const [topicOrder, setTopicOrder] = useState<string[]>([]);
    const topicPalette = ['#ff9500', '#ff2d55', '#007aff', '#5856d6', '#00b96b', '#af52de', '#ff3b30', '#ffcc00'];

    useEffect(() => {
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) setAdminAvatar(savedAvatar);

        const savedOrder = localStorage.getItem('topicOrder');
        if (savedOrder) {
            setTopicOrder(JSON.parse(savedOrder));
        }

        const syncInitialTheme = () => {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
            if (savedTheme) {
                setColorMode(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
            }
        };
        syncInitialTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
                    setColorMode(theme || 'light');
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            // If admin is logged in, save their avatar
            if (currentUser?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1') {
                const avatar = currentUser.user_metadata?.avatar_url;
                if (avatar) {
                    setAdminAvatar(avatar);
                    localStorage.setItem('adminAvatar', avatar);
                }
            }
        });

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
        });

        fetchPosts();

        const dbChannel = supabase
            .channel('magazine_db_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notes' },
                () => fetchPosts()
            )
            .subscribe();

        const broadcastChannel = supabase
            .channel('notability_updates')
            .on('broadcast', { event: 'refresh' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
            observer.disconnect();
            supabase.removeChannel(dbChannel);
            supabase.removeChannel(broadcastChannel);
        };
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPosts(data);

            // Calculate topic counts dynamically
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

            // Apply saved order if exists
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

    const isAdmin = user?.id === '403fcc1a-e806-409f-b0da-7623da7b64a1';

    const handleUpdateTopicOrder = (newOrder: string[]) => {
        setTopicOrder(newOrder);
        localStorage.setItem('topicOrder', JSON.stringify(newOrder));

        // Update topics state immediately to reflect new order
        setTopics(prev => {
            const sorted = [...prev].sort((a, b) => {
                const indexA = newOrder.indexOf(a.name);
                const indexB = newOrder.indexOf(b.name);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            return sorted;
        });
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

            await supabase.channel('notability_updates').send({
                type: 'broadcast',
                event: 'refresh',
                payload: { action: 'deleted', postId: id }
            });

            // Instant local update
            await fetchPosts();
            message.success('Post deleted successfully');
        } catch (error: any) {
            console.error('Failure deleting post:', error);
            message.error('Delete failed: ' + error.message);
        }
    };

    const toggleTheme = () => {
        const newMode = colorMode === 'light' ? 'dark' : 'light';
        setColorMode(newMode);
        document.documentElement.setAttribute('data-theme', newMode);
        localStorage.setItem('theme', newMode);
    };

    const filteredPosts = selectedTopic ? posts.filter(p => p.topic === selectedTopic) : posts;

    return (
        <ConfigProvider theme={getThemeConfig(colorMode)}>
            <App>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Layout style={{ minHeight: '100vh', background: 'var(--notability-bg)' }}>
                        {isMobile ? (
                            <Drawer
                                placement="left"
                                onClose={() => setIsMobileMenuOpen(false)}
                                open={isMobileMenuOpen}
                                styles={{ body: { padding: 0 } }}
                                size="default"
                                closable={false}
                            >
                                <Sidebar
                                    onNewPost={handleNewPost}
                                    selectedPostId={selectedPostId}
                                    onSelectPost={setSelectedPostId}
                                    selectedTopic={selectedTopic}
                                    onSelectTopic={setSelectedTopic}
                                    posts={posts}
                                    topics={topics}
                                    isAdmin={isAdmin}
                                    onUpdateTopicOrder={handleUpdateTopicOrder}
                                    adminAvatar={adminAvatar}
                                />
                            </Drawer>
                        ) : (
                            <Sider
                                width={280}
                                theme={colorMode}
                                collapsed={false}
                                style={{
                                    overflow: 'auto',
                                    height: '100vh',
                                    position: 'fixed',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    backgroundColor: 'var(--mac-sidebar)',
                                    borderRight: '1px solid var(--mac-border)',
                                    boxShadow: '4px 0 15px rgba(0,0,0,0.02)',
                                    display: isMobile ? 'none' : 'block',
                                    zIndex: 100
                                }}
                            >
                                <Sidebar
                                    onNewPost={handleNewPost}
                                    selectedPostId={selectedPostId}
                                    onSelectPost={setSelectedPostId}
                                    selectedTopic={selectedTopic}
                                    onSelectTopic={setSelectedTopic}
                                    posts={posts}
                                    topics={topics}
                                    isAdmin={isAdmin}
                                    onUpdateTopicOrder={handleUpdateTopicOrder}
                                    adminAvatar={adminAvatar}
                                />
                            </Sider>
                        )}

                        <Layout style={{
                            background: 'transparent',
                            marginLeft: isMobile ? 0 : '17.5rem',
                            transition: 'all 0.2s'
                        }}>
                            <Content
                                ref={contentRef}
                                style={{
                                    height: '100vh',
                                    overflowX: 'hidden',
                                    overflowY: 'auto',
                                    position: 'relative'
                                }}
                                id="grid-scroll-container"
                            >
                                {isMobile && (
                                    <FloatButton
                                        icon={<MenuOutlined />}
                                        onClick={() => setIsMobileMenuOpen(true)}
                                        style={{ left: 24, top: 24 }}
                                    />
                                )}

                                <MagazineGrid
                                    selectedPostId={selectedPostId}
                                    onSelectPost={setSelectedPostId}
                                    onNewPost={handleNewPost}
                                    onEditPost={handleEditPost}
                                    onDeletePost={handleDeletePost}
                                    isAdmin={isAdmin}
                                    selectedTopic={selectedTopic}
                                    posts={posts}
                                    topics={topics}
                                    loading={loading}
                                />

                                <AnimatePresence>
                                    {selectedPostId && (
                                        <>
                                            {/* Background Overlay - synchronizes its fade with the sidebar's width shift */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    opacity: isReaderExpanded ? 0 : 1,
                                                    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                                                }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setSelectedPostId(null)}
                                                style={{
                                                    position: 'fixed',
                                                    inset: 0,
                                                    background: 'rgba(0,0,0,0.2)',
                                                    backdropFilter: 'blur(4px)',
                                                    zIndex: 199,
                                                    pointerEvents: isReaderExpanded ? 'none' : 'auto'
                                                }}
                                            />

                                            <motion.div
                                                initial={{ x: '100%' }}
                                                animate={{
                                                    x: 0,
                                                    width: isReaderExpanded ? '100vw' : (screens.xl ? '40vw' : screens.lg ? '60vw' : '100vw'),
                                                }}
                                                exit={{ x: '100%' }}
                                                transition={{
                                                    width: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                                                    x: { type: 'spring', damping: 28, stiffness: 180 }
                                                }}
                                                layout
                                                style={{
                                                    position: 'fixed',
                                                    top: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    zIndex: isReaderExpanded ? 5000 : 200,
                                                    background: 'var(--notability-sidebar)',
                                                    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                <ReaderPanel
                                                    selectedPostId={selectedPostId}
                                                    initialPost={posts.find(p => p.id === selectedPostId) || null}
                                                    topics={topics}
                                                    isExpanded={isReaderExpanded}
                                                    onToggleExpand={() => setIsReaderExpanded(!isReaderExpanded)}
                                                    onClose={() => setSelectedPostId(null)}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </Content>
                        </Layout>
                    </Layout>

                    <PostEditor
                        open={isEditorOpen}
                        onClose={() => setIsEditorOpen(false)}
                        onSave={fetchPosts}
                        postId={editingPostId}
                        availableTopics={topics}
                    />

                    {isAdmin ? (
                        <FloatButton.Group
                            trigger="hover"
                            type="primary"
                            style={{ right: 24, bottom: 24, zIndex: 9999 }}
                            icon={<PlusOutlined />}
                        >
                            <FloatButton
                                icon={<PlusOutlined />}
                                tooltip="New Post"
                                onClick={handleNewPost}
                            />
                            <FloatButton
                                icon={colorMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                                tooltip={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                                onClick={toggleTheme}
                            />
                        </FloatButton.Group>
                    ) : (
                        <FloatButton
                            icon={colorMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                            tooltip={colorMode === 'light' ? 'Dark Mode' : 'Light Mode'}
                            style={{ right: 24, bottom: 24, zIndex: 9999 }}
                            onClick={toggleTheme}
                        />
                    )}
                </motion.div>

                <style>{`
                    #grid-scroll-container::-webkit-scrollbar,
                    #reader-scroll-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    #grid-scroll-container::-webkit-scrollbar-thumb,
                    #reader-scroll-container::-webkit-scrollbar-thumb {
                        background: rgba(128, 128, 128, 0.3);
                        border-radius: 10px;
                        transition: all 0.3s ease;
                    }
                    #grid-scroll-container::-webkit-scrollbar-thumb:hover,
                    #reader-scroll-container::-webkit-scrollbar-thumb:hover {
                        background: rgba(128, 128, 128, 0.5);
                    }
                    #grid-scroll-container::-webkit-scrollbar-track,
                    #reader-scroll-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    
                    /* Firefox Support */
                    #grid-scroll-container,
                    #reader-scroll-container {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
                    }
                `}</style>
            </App>
        </ConfigProvider>
    );
};

export default BlogShell;
