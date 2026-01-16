import React, { useState, useEffect } from 'react';
import { Space, Avatar, Divider, Tag, Spin, Button, Typography } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, ShareAltOutlined, ExpandOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import "@uiw/react-markdown-preview/markdown.css";

import ReactMarkdown from '@uiw/react-markdown-preview';

const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

interface ReaderPanelProps {
    selectedPostId: string | null;
    initialPost: Post | null;
    topics: { name: string; color: string }[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
    colorMode: 'light' | 'dark';
}

const ReaderPanel: React.FC<ReaderPanelProps> = ({
    selectedPostId,
    initialPost,
    topics,
    isExpanded,
    onToggleExpand,
    onClose,
    colorMode
}) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);

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


    if (loading && !post) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: 'var(--app-bg)' }}>
                <Spin size="large" tip="Entering Reading Mode...">
                    <div style={{ padding: '20px' }} />
                </Spin>
            </div>
        );
    }

    if (!post) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                textAlign: 'center',
                background: 'var(--app-bg)'
            }}>
                <div style={{ maxWidth: '320px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.2 }}>📖</div>
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        Select a Story
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
                        Dive into Gabriel's library of thoughts, projects, and travel essays.
                    </Typography.Paragraph>
                    <Button onClick={onClose} style={{ marginTop: '20px' }}>Back to Grid</Button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            layout
            id="reader-scroll-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.4 }
            }}
            style={{
                background: 'var(--app-sidebar)',
                overflowY: 'auto',
                overflowX: 'hidden',
                flex: 1,
                width: '100%',
                position: 'relative'
            }}
        >
            <motion.div
                layout="position"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.5 }
                }}
                style={{
                    height: isExpanded ? '40vh' : '20vh',
                    background: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.4)), url(${post.featured_image}) center/cover no-repeat`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '24px',
                    position: 'relative'
                }}
            >
                <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '12px' }}>
                    <Button
                        shape="circle"
                        icon={<ShareAltOutlined />}
                        style={{ border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white' }}
                    />
                    <Button
                        shape="circle"
                        icon={isExpanded ? <FullscreenExitOutlined /> : <ExpandOutlined />}
                        onClick={onToggleExpand}
                        style={{ border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white' }}
                    />
                    <Button
                        shape="circle"
                        icon={<Typography.Text style={{ color: 'white', fontWeight: 800 }}>✕</Typography.Text>}
                        onClick={onClose}
                        style={{ border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Tag
                        color={topics.find(t => t.name === post.topic)?.color || 'purple'}
                        variant="filled"
                        style={{
                            marginBottom: '1rem',
                            fontWeight: 800,
                            padding: '0.25rem 1rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        {post.topic.toUpperCase()}
                    </Tag>
                </motion.div>
            </motion.div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                style={{
                    maxWidth: isExpanded ? '1000px' : '800px',
                    margin: '0 auto',
                    padding: '3rem var(--gutter-main)',
                    transition: 'max-width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <header style={{ marginBottom: '2.5rem' }}>
                    <motion.div variants={contentVariants}>
                        <Typography.Title level={1} style={{ margin: '0 0 1.5rem', fontWeight: 800, fontSize: isExpanded ? '3rem' : '2.5rem', transition: 'font-size 0.6s' }}>
                            {post.title}
                        </Typography.Title>
                    </motion.div>
                    <motion.div variants={contentVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <Space size={16}>
                            <Avatar size={isExpanded ? 56 : 48} src="/GabrielPhoto.jpg" style={{ backgroundColor: '#007aff' }}>G</Avatar>
                            <div>
                                <Typography.Text strong style={{ display: 'block' }}>Gabriel Nava</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: '0.85rem' }}>
                                    <CalendarOutlined style={{ marginRight: '6px' }} />
                                    {new Date(post.created_at).toLocaleDateString()}
                                </Typography.Text>
                            </div>
                        </Space>

                        <Space size={20} style={{ color: 'var(--app-secondary)', fontSize: '0.9rem' }}>
                            <span title="Read time">
                                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                {post.read_time_minutes} min
                            </span>
                            <Button
                                type="primary"
                                shape="round"
                                icon={isExpanded ? <FullscreenExitOutlined /> : <ExpandOutlined />}
                                onClick={onToggleExpand}
                                style={{
                                    background: isExpanded ? '#ff3b30' : '#007aff',
                                    borderColor: isExpanded ? '#ff3b30' : '#007aff',
                                    fontWeight: 600,
                                    height: '2rem',
                                    padding: '0 1rem',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {isExpanded ? 'Minimize' : 'Expand View'}
                            </Button>
                        </Space>
                    </motion.div>
                </header>

                <motion.div variants={contentVariants}>
                    <div className="markdown-reader-content" style={{
                        width: '100%',
                        minHeight: '25rem',
                        background: 'transparent'
                    }} data-color-mode={colorMode}>
                        <ReactMarkdown source={post.content} />
                    </div>
                </motion.div>

                <motion.div variants={contentVariants}>
                    <Divider style={{ margin: '3.75rem 0' }} />
                </motion.div>

                <motion.div variants={contentVariants}>
                    <footer style={{ textAlign: 'center', color: 'var(--app-secondary)', opacity: 0.6 }}>
                        <p>© {new Date().getFullYear()} Gabriel's Blog</p>
                    </footer>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ReaderPanel;
