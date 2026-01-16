import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Menu, Badge, Avatar, Space, Typography, Dropdown } from 'antd';
import {
    FileTextOutlined,
    MailOutlined,
    LogoutOutlined,
    UserOutlined,
    MenuOutlined
} from '@ant-design/icons';
import Auth from './Auth';
import { supabase } from '../lib/supabase';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

const sidebarItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

const sidebarContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};

interface Post {
    id: string;
    title: string;
    topic: string;
}

interface SidebarProps {
    onNewPost: () => void;
    selectedPostId: string | null;
    onSelectPost: (id: string | null) => void;
    selectedTopic: string | null;
    onSelectTopic: (topic: string | null) => void;
    posts: Post[];
    topics: { name: string; count: number; color: string }[];
    isAdmin: boolean;
    onUpdateTopicOrder?: (newOrder: string[]) => void;
    adminAvatar: string | null;
}

const SortableMenuItem: React.FC<{
    id: string;
    label: React.ReactNode;
    isAdmin: boolean;
}> = ({ id, label, isAdmin }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !isAdmin });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        cursor: isAdmin ? 'grab' : 'default',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        margin: '2px 0'
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            variants={sidebarItemVariants}
            whileHover={{ x: 4, background: 'rgba(0,0,0,0.03)' }}
        >
            {isAdmin && <MenuOutlined style={{ marginRight: 8, opacity: 0.3, fontSize: '12px' }} />}
            <div style={{ flex: 1 }}>{label}</div>
        </motion.div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({
    onNewPost,
    selectedPostId,
    onSelectPost,
    selectedTopic,
    onSelectTopic,
    posts,
    topics,
    isAdmin,
    onUpdateTopicOrder,
    adminAvatar
}) => {
    const [user, setUser] = useState<any>(null);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            setOpenKeys([selectedTopic]);
        }
    }, [selectedTopic]);

    const handleOpenChange = (keys: string[]) => {
        const latestOpenKey = keys.find((key) => !openKeys.includes(key));
        setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = topics.findIndex(t => t.name === active.id);
            const newIndex = topics.findIndex(t => t.name === over.id);
            onUpdateTopicOrder?.(arrayMove(topics, oldIndex, newIndex).map(t => t.name));
        }
    };

    const mainMenuItems = useMemo(() => [
        {
            key: 'all',
            icon: <FileTextOutlined />,
            label: 'All Posts',
            style: {
                padding: '0.5rem 1.3rem',
                background: (!selectedTopic && !selectedPostId) ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                borderRadius: '8px',
                margin: '4px 8px'
            },
            onClick: () => {
                onSelectPost(null);
                onSelectTopic(null);
                setOpenKeys([]);
            }
        }
    ], [selectedTopic, selectedPostId, onSelectPost, onSelectTopic]);

    const categoryMenuItems = useMemo(() => topics.map((topic) => ({
        key: topic.name,
        onTitleClick: () => onSelectTopic(topic.name),
        label: (
            <SortableMenuItem
                id={topic.name}
                isAdmin={isAdmin}
                label={
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        color: selectedTopic === topic.name ? '#007aff' : undefined,
                        fontWeight: selectedTopic === topic.name ? 700 : 500
                    }}>
                        <Badge color={topic.color} style={{ marginRight: 12 }} />
                        <span style={{ flex: 1 }}>{topic.name}</span>
                        <Text type="secondary" style={{ fontSize: '11px', fontWeight: 700 }}>{topic.count}</Text>
                    </div>
                }
            />
        ),
        children: posts
            .filter((p) => p.topic === topic.name)
            .map((post) => ({
                key: post.id,
                label: post.title,
                onClick: () => onSelectPost(post.id),
                style: {
                    fontSize: '13px',
                    color: selectedPostId === post.id ? '#007aff' : undefined,
                    fontWeight: selectedPostId === post.id ? 600 : 400
                }
            }))
    })), [topics, posts, selectedTopic, selectedPostId, isAdmin, onSelectTopic, onSelectPost]);

    const footerMenuItems = [
        {
            key: 'contact',
            icon: <MailOutlined style={{ fontSize: '1.8rem', marginLeft: -5 }} />,
            label: 'Contact',
            style: { fontSize: '1rem' },
            onClick: () => window.open('https://linktr.ee/gabrielnavainfo', '_blank')
        }
    ];

    const allFooterItems = useMemo(() => [
        ...footerMenuItems,
        ...(user ? [{
            key: 'profile',
            icon: <Avatar size={40} src={user.user_metadata?.avatar_url} icon={<UserOutlined />} style={{ marginLeft: -11 }} />,
            label: (
                <Dropdown
                    menu={{
                        items: [{
                            key: 'logout',
                            label: 'Logout',
                            icon: <LogoutOutlined />,
                            onClick: () => supabase.auth.signOut()
                        }]
                    }}
                    placement="topRight"
                >
                    <Typography.Text strong style={{ fontSize: '1rem', cursor: 'pointer', marginLeft: 2 }}>
                        {user.user_metadata?.full_name || user.email}
                    </Typography.Text>
                </Dropdown>
            )
        }] : [])
    ], [user]);

    return (
        <motion.div
            variants={sidebarContainerVariants}
            initial="hidden"
            animate="show"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--app-sidebar)'
            }}
        >
            <motion.div variants={sidebarItemVariants} style={{ padding: '2rem 1.5rem 1.5rem' }}>
                <Space size={16}>
                    <Avatar size={70} src={adminAvatar || '/GabrielPhoto.jpg'} style={{ backgroundColor: '#007aff' }}>G</Avatar>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--app-text)', lineHeight: 1.2 }}>Gabriel's Blog</h2>
                        <Text type="secondary" style={{ fontSize: '0.9rem' }}> ← Looking for a job</Text>
                    </div>
                </Space>
            </motion.div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <motion.div variants={sidebarItemVariants}>
                    <Menu
                        mode="inline"
                        selectedKeys={[(!selectedTopic && !selectedPostId) ? 'all' : '']}
                        items={mainMenuItems}
                        style={{ border: 'none', background: 'transparent' }}
                    />
                </motion.div>

                <motion.div variants={sidebarItemVariants} style={{ padding: '0.5rem 1.6rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--app-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Categories
                </motion.div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={topics.map(t => t.name)}
                        strategy={verticalListSortingStrategy}
                    >
                        <motion.div variants={sidebarItemVariants}>
                            <Menu
                                mode="inline"
                                selectedKeys={[selectedTopic || '', selectedPostId || '']}
                                openKeys={openKeys}
                                onOpenChange={handleOpenChange}
                                items={categoryMenuItems}
                                style={{ border: 'none', background: 'transparent' }}
                            />
                        </motion.div>
                    </SortableContext>
                </DndContext>
            </div>

            <motion.div variants={sidebarItemVariants} style={{ padding: '1rem 0', borderTop: '1px solid var(--mac-border)' }}>
                <Menu
                    mode="inline"
                    selectable={false}
                    items={allFooterItems}
                    style={{ border: 'none', background: 'transparent' }}
                />
                {!user && (
                    <div style={{ marginTop: '12px', padding: '0 1rem' }}>
                        <Auth />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Sidebar;
