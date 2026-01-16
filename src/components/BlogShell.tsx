import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import MagazineGrid from './MagazineGrid';
import ReaderPanel from './ReaderPanel';
import PostEditor from './NoteEditor';
import { PlusOutlined, MenuOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import { supabase } from '../lib/supabase';
import { ConfigProvider, App, FloatButton, Layout, Drawer, Grid, Button } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeConfig } from '../styles/theme';

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

interface BlogShellInnerProps {
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
}

const BlogShellInner: React.FC<BlogShellInnerProps> = ({ colorMode, toggleTheme }) => {
    const { message: messageApi } = App.useApp();
    const [posts, setPosts] = useState<Post[]>([]);
    const [topics, setTopics] = useState<{ name: string; count: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isReaderExpanded, setIsReaderExpanded] = useState(false);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const contentRef = useRef<HTMLDivElement>(null);
    const topicPalette = ['#ff9500', '#ff2d55', '#007aff', '#5856d6', '#00b96b', '#af52de', '#ff3b30', '#ffcc00'];

    // Reset expansion when changing posts
    useEffect(() => {
        setIsReaderExpanded(false);
    }, [selectedPostId]);

    useEffect(() => {
        const savedAvatar = localStorage.getItem('adminAvatar');
        if (savedAvatar) setAdminAvatar(savedAvatar);

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

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

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
            messageApi.success('Post deleted successfully');
        } catch (error: any) {
            console.error('Failure deleting post:', error);
            messageApi.error('Delete failed: ' + error.message);
        }
    };

    const sidebarProps = {
        onNewPost: handleNewPost,
        selectedPostId,
        onSelectPost: setSelectedPostId,
        selectedTopic,
        onSelectTopic: setSelectedTopic,
        posts,
        topics,
        isAdmin,
        onUpdateTopicOrder: handleUpdateTopicOrder,
        adminAvatar
    };

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setIsMobileMenuOpen(false)}
                open={isMobileMenuOpen}
                styles={{ body: { padding: 0 } }}
                closable={false}
                size={280}
            >
                <Sidebar {...sidebarProps} />
            </Drawer>

            {/* Desktop Sider - Fixed Width with Breakpoint Support */}
            <Sider
                width={280}
                breakpoint="md"
                collapsedWidth="0"
                trigger={null}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: 'var(--mac-sidebar)',
                    borderRight: '1px solid var(--mac-border)',
                    zIndex: 100
                }}
            >
                <Sidebar {...sidebarProps} />
            </Sider>

            <Layout className="main-content-layout" style={{
                background: 'transparent',
                transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <Content
                    ref={contentRef}
                    style={{
                        height: '100vh',
                        overflowX: 'hidden',
                        overflowY: 'auto'
                    }}
                    id="grid-scroll-container"
                >
                    {isMobile && (
                        <div style={{ position: 'fixed', top: 24, left: 24, zIndex: 1000 }}>
                            <Button
                                shape="circle"
                                size="large"
                                icon={<MenuOutlined />}
                                onClick={() => setIsMobileMenuOpen(true)}
                                style={{
                                    width: 48,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    border: 'none',
                                    background: 'var(--app-sidebar)',
                                    color: 'var(--app-text)'
                                }}
                            />
                        </div>
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
                                        background: 'var(--app-sidebar)',
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
                                        colorMode={colorMode}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </Content>
            </Layout>

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

            {isAdmin ? (
                <FloatButton.Group
                    trigger="hover"
                    type="primary"
                    style={{ right: 24, bottom: 24, zIndex: 9999 }}
                    icon={<PlusOutlined />}
                >
                    <FloatButton icon={<PlusOutlined />} tooltip="New Post" onClick={handleNewPost} />
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

            <style>{`
                /* Responsive Layout Margins via CSS Media Queries */
                .main-content-layout {
                    margin-left: 280px;
                }
                
                @media (max-width: 767px) {
                    .main-content-layout {
                        margin-left: 0 !important;
                    }
                }

                #grid-scroll-container::-webkit-scrollbar,
                #reader-scroll-container::-webkit-scrollbar {
                    width: 6px;
                }
                #grid-scroll-container::-webkit-scrollbar-thumb,
                #reader-scroll-container::-webkit-scrollbar-thumb {
                    background: rgba(128, 128, 128, 0.3);
                    border-radius: 10px;
                }
                #grid-scroll-container::-webkit-scrollbar-track,
                #reader-scroll-container::-webkit-scrollbar-track {
                    background: transparent;
                }
            `}</style>
        </Layout>
    );
};

const BlogShell: React.FC = () => {
    const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
        if (typeof document !== 'undefined') {
            return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
                    setColorMode(theme || 'light');
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
        localStorage.setItem('blog-theme', newMode);
    };

    return (
        <ConfigProvider theme={getThemeConfig(colorMode)}>
            <App>
                <BlogShellInner colorMode={colorMode} toggleTheme={toggleTheme} />
            </App>
        </ConfigProvider>
    );
};

export default BlogShell;
