import React, { useState, useRef, useEffect } from 'react';
import { Button, Space, Input, Select, App, Switch, Divider, Typography } from 'antd';
import {
    CloseOutlined,
    SaveOutlined,
    PictureOutlined,
    GlobalOutlined,
    ArrowLeftOutlined,
    UploadOutlined,
    PlusOutlined,
    SunOutlined,
    MoonOutlined
} from '@ant-design/icons';
import { supabase } from '../lib/supabase';

import MDEditor from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

interface PostEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    postId?: string | null;
    availableTopics: { name: string; color: string }[];
}

const PostEditor: React.FC<PostEditorProps> = ({ open, onClose, onSave, postId, availableTopics }) => {
    const [markdown, setMarkdown] = useState('');
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('Technology');
    const [isPublic, setIsPublic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
    const { message: messageApi } = App.useApp();
    const [newTopicName, setNewTopicName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasBeenInitialized = useRef(false);

    const toggleTheme = () => {
        const newMode = colorMode === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newMode);
        localStorage.setItem('theme', newMode);
        setColorMode(newMode);
    };

    useEffect(() => {
        const syncTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
            setColorMode(theme || 'light');
        };

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    syncTheme();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        syncTheme();

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (open) {
            if (postId) {
                fetchPostData(postId);
            } else if (!hasBeenInitialized.current) {
                setMarkdown('# Untitled Post\n\nStart writing here...');
                setTitle('');
                setTopic(availableTopics[0]?.name || 'Technology');
                setIsPublic(false);
                setFeaturedImage(null);
                hasBeenInitialized.current = true;
            }
        } else {
            hasBeenInitialized.current = false;
        }
    }, [open, postId]);

    const fetchPostData = async (id: string) => {
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setTitle(data.title);
                setTopic(data.topic);
                setIsPublic(data.is_public);
                setFeaturedImage(data.featured_image);
                setMarkdown(data.content || '');
            }
        } catch (error: any) {
            messageApi.error(`Failed to load post: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `post-assets/${fileName}`;

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required');

            const { error: uploadError } = await supabase.storage
                .from('post-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-assets')
                .getPublicUrl(filePath);

            if (isUploadingBanner) {
                setFeaturedImage(publicUrl);
                messageApi.success('Banner updated');
            } else {
                setMarkdown(prev => `${prev}\n![Image](${publicUrl})\n`);
                messageApi.success('Image added');
            }
        } catch (error: any) {
            messageApi.error(error.message);
        } finally {
            setSaving(false);
            setIsUploadingBanner(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            messageApi.error('Please enter a title');
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required');

            const payload = {
                title,
                topic,
                content: markdown,
                user_id: session.user.id,
                is_public: isPublic,
                featured_image: featuredImage || `https://picsum.photos/seed/${encodeURIComponent(title)}/800/400`,
                read_time_minutes: Math.max(1, Math.ceil(markdown.split(/\s+/).length / 200))
            };

            const { error } = postId
                ? await supabase.from('notes').update(payload).eq('id', postId)
                : await supabase.from('notes').insert([payload]);

            if (error) throw error;

            await supabase.channel('blog_updates').send({
                type: 'broadcast',
                event: 'refresh',
                payload: { action: 'saved', postId: postId || 'new' }
            });

            messageApi.success('Post published successfully');
            await onSave(); // Ensure BlogShell fetches new data before closing
            onClose();
        } catch (error: any) {
            messageApi.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const topicDropdownHeader = (menu: React.ReactElement) => (
        <div>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ padding: '0 12px 12px' }}>
                <Typography.Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                    New Topic
                </Typography.Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                        placeholder="Type and enter..."
                        value={newTopicName}
                        size="small"
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newTopicName && !availableTopics.find(t => t.name === newTopicName)) {
                                    setTopic(newTopicName);
                                    setNewTopicName('');
                                }
                            }
                            e.stopPropagation();
                        }}
                    />
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            if (newTopicName && !availableTopics.find(t => t.name === newTopicName)) {
                                setTopic(newTopicName);
                                setNewTopicName('');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'var(--app-bg)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <header style={{
                padding: '0.75rem 2rem',
                background: 'var(--app-sidebar)',
                borderBottom: '1px solid var(--mac-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Space size={32}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={onClose}
                        style={{ color: 'var(--app-text)' }}
                    />
                    <Input
                        placeholder="Post Title"
                        variant="borderless"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontSize: '1.4rem', fontWeight: 800, width: '22rem', padding: 0, color: 'var(--app-text)' }}
                    />
                    <Divider orientation="vertical" />
                    <Select
                        placeholder="Select Topic"
                        value={topic}
                        onChange={setTopic}
                        options={availableTopics.map(t => ({ label: t.name, value: t.name }))}
                        popupRender={topicDropdownHeader}
                        style={{ width: 220 }}
                        variant="outlined"
                        getPopupContainer={trigger => trigger.parentElement}
                    />
                </Space>

                <Space size={24}>
                    <Button
                        type="text"
                        icon={colorMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                        onClick={toggleTheme}
                        style={{ color: '#007aff', fontSize: '1.2rem' }}
                    />
                    <Divider orientation="vertical" />
                    <Space size={8}>
                        <GlobalOutlined style={{ color: isPublic ? '#007aff' : undefined, opacity: isPublic ? 1 : 0.5 }} />
                        <Typography.Text strong style={{ fontSize: '0.9rem', color: 'var(--app-text)' }}>Public</Typography.Text>
                        <Switch size="small" checked={isPublic} onChange={setIsPublic} />
                    </Space>
                    <Divider orientation="vertical" />
                    <Button
                        icon={<PictureOutlined />}
                        onClick={() => {
                            setIsUploadingBanner(true);
                            fileInputRef.current?.click();
                        }}
                        type={featuredImage ? "primary" : "default"}
                    >
                        {featuredImage ? 'Change Banner' : 'Set Banner'}
                    </Button>
                    <Button
                        icon={<UploadOutlined />}
                        onClick={() => {
                            setIsUploadingBanner(false);
                            fileInputRef.current?.click();
                        }}
                    >
                        Add Image
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                        style={{ borderRadius: '0.75rem', padding: '0 1.5rem', height: '2.5rem', fontWeight: 700 }}
                    >
                        Publish
                    </Button>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={onClose}
                        style={{ color: 'var(--app-text)' }}
                    />
                </Space>
            </header>

            <main style={{ flex: 1, overflow: 'hidden' }} data-color-mode={colorMode}>
                <MDEditor
                    value={markdown}
                    onChange={(val) => setMarkdown(val || '')}
                    height="100%"
                    preview="live"
                    style={{ border: 'none', background: 'var(--app-bg)' }}
                />
            </main>
        </div>
    );
};

export default PostEditor;
