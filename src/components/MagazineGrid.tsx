import React, { useMemo } from 'react';
import { Space, Tag, Empty, Spin, Dropdown, App, Typography, Masonry, Avatar, Button } from 'antd';
import { EditTwoTone, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

interface Post {
    id: string;
    title: string;
    content: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

interface MagazineGridProps {
    selectedPostId: string | null;
    onSelectPost: (id: string) => void;
    onNewPost: () => void;
    onEditPost: (id: string) => void;
    onDeletePost: (id: string) => void;
    isAdmin?: boolean;
    selectedTopic?: string | null;
    posts: Post[];
    topics: { name: string; color: string }[];
    loading: boolean;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 20
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 }
    }
};

const MagazineGrid: React.FC<MagazineGridProps> = ({
    selectedPostId,
    onSelectPost,
    onNewPost,
    onEditPost,
    onDeletePost,
    isAdmin = false,
    selectedTopic = null,
    posts,
    topics,
    loading
}) => {
    const { modal: modalApi } = App.useApp();
    const displayPosts = useMemo(() => {
        let filtered = [...posts].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (selectedTopic) {
            filtered = filtered.filter(p => p.topic === selectedTopic);
        }
        return filtered;
    }, [posts, selectedTopic]);

    if (loading && posts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Spin size="large" tip="Curating Gallery...">
                    <div style={{ padding: '20px' }} />
                </Spin>
            </motion.div>
        );
    }

    if (displayPosts.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '4rem 2rem' }}
            >
                <Empty
                    description={selectedTopic ? `No stories yet in "${selectedTopic}"` : "The library is currently empty"}
                >
                    {isAdmin && (
                        <Button type="primary" shape="round" onClick={onNewPost}>
                            Compose First Story
                        </Button>
                    )}
                </Empty>
            </motion.div>
        );
    }

    return (
        <div style={{ padding: '2rem var(--gutter-main)' }}>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <Masonry
                    items={displayPosts.map(p => ({ key: p.id, data: p }))}
                    columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 }}
                    gutter={24}
                    itemRender={(item) => {
                        const post = item.data;
                        const isSelected = selectedPostId === post.id;

                        return (
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={post.id}
                                    layout
                                    variants={cardVariants}
                                    whileHover={{
                                        y: -8,
                                        transition: { duration: 0.2 }
                                    }}
                                    id={post.id}
                                    onClick={() => onSelectPost(post.id)}
                                    className={`editorial-card ${isSelected ? 'selected' : ''}`}
                                    style={{
                                        background: 'var(--card-bg)',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s, border 0.3s, box-shadow 0.3s',
                                        border: `1px solid ${isSelected ? '#007aff' : 'var(--mac-border)'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: isSelected ? '0 12px 24px rgba(0,122,255,0.12)' : 'var(--mac-shadow)',
                                        marginBottom: '24px'
                                    }}
                                >
                                    <div style={{
                                        height: '9rem',
                                        background: `url(${post.featured_image}) center/cover no-repeat`,
                                        position: 'relative'
                                    }}>
                                        <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                                            <Tag
                                                color={topics.find(t => t.name === post.topic)?.color || 'blue'}
                                                variant="filled"
                                                style={{
                                                    borderRadius: '6px',
                                                    fontWeight: 800,
                                                    padding: '2px 8px',
                                                    fontSize: '10px',
                                                    textTransform: 'uppercase',
                                                    border: 'none'
                                                }}
                                            >
                                                {post.topic}
                                            </Tag>
                                        </div>

                                        {isAdmin && (
                                            <div style={{ position: 'absolute', top: '0.75rem', right: '1rem' }} onClick={e => e.stopPropagation()}>
                                                <Dropdown
                                                    menu={{
                                                        items: [
                                                            { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => onEditPost(post.id) },
                                                            { type: 'divider' },
                                                            {
                                                                key: 'delete',
                                                                label: 'Delete',
                                                                danger: true,
                                                                icon: <DeleteOutlined />,
                                                                onClick: () => modalApi.confirm({
                                                                    title: 'Delete Story?',
                                                                    icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                                                                    content: 'This will permanently remove this post and all its contents.',
                                                                    okText: 'Delete',
                                                                    okType: 'danger',
                                                                    onOk: () => onDeletePost(post.id)
                                                                })
                                                            }
                                                        ]
                                                    }}
                                                    placement="bottomRight"
                                                >
                                                    <Button
                                                        size="small"
                                                        shape="circle"
                                                        icon={<EditTwoTone twoToneColor="#007aff" />}
                                                        style={{ background: 'rgba(255,255,255,0.9)', border: 'none' }}
                                                    />
                                                </Dropdown>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Title level={3} style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem' }}>
                                            {post.title}
                                        </Title>

                                        <div style={{
                                            height: '0.03em',
                                            background: 'linear-gradient(to right, var(--mac-border), transparent)',
                                        }} />

                                        <div
                                            style={{
                                                margin: '0 0 0.5rem',
                                                fontSize: '0.6rem',
                                                color: 'var(--app-secondary)',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <span>{children} </span>,
                                                    strong: ({ children }) => <strong>{children}</strong>,
                                                    em: ({ children }) => <em>{children}</em>,
                                                    code: ({ children }) => <code style={{
                                                        background: 'rgba(0,0,0,0.05)',
                                                        padding: '2px 4px',
                                                        borderRadius: '3px',
                                                        fontSize: '0.9em',
                                                        fontFamily: 'monospace'
                                                    }}>{children}</code>,
                                                    a: ({ children, href }) => <a href={href} style={{ color: '#007aff' }}>{children}</a>
                                                }}
                                            >
                                                {post.content}
                                            </ReactMarkdown>
                                        </div>

                                        <div style={{
                                            marginTop: 'auto',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.75rem',
                                            color: 'var(--app-secondary)',
                                            fontWeight: 500
                                        }}>
                                            <Space size={8}>
                                                <Avatar size={20} src="/GabrielPhoto.jpg" style={{ border: '1px solid rgba(0,0,0,0.05)' }} />
                                                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                                                    {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </Text>
                                            </Space>
                                            <span>{post.read_time_minutes} min read</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        );
                    }}
                />
            </motion.div>
        </div>
    );
};

export default MagazineGrid;