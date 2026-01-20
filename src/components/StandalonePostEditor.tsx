import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from "@/hooks/use-toast";
import CherryEditor from './CherryEditor';
import { EditorHeader } from './editor';
import { useTopics } from './TopicProvider';
import { isAdmin as checkAdmin } from '@/lib/auth-utils';
import { Button } from "@/components/ui/button";

interface StandalonePostEditorProps {
    postId?: string;
    // Initial data can be passed from SSR if available, or fetched client-side as fallback
    initialData?: any;
    availableTopics?: any[];
}

const StandalonePostEditor: React.FC<StandalonePostEditorProps> = ({ postId, initialData, availableTopics: initialAvailableTopics }) => {
    // Auth Check
    useEffect(() => {
        const verifyAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !checkAdmin(session.user.id)) {
                window.location.href = '/';
            }
        };
        verifyAdmin();
    }, []);

    // App State
    const { topics: providerTopics, ensureTopicExists, deleteTopicIfEmpty } = useTopics();
    const availableTopics = initialAvailableTopics || providerTopics;

    // Theme State
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

    const [markdown, setMarkdown] = useState('# New Post\n\nStart writing...');
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('Technology');
    const [isPublic, setIsPublic] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [newTopicName, setNewTopicName] = useState('');

    // UI State
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    const { toast } = useToast();

    // -- Theme sync --
    useEffect(() => {
        const syncTheme = () => {
            if (document.documentElement.classList.contains('dark')) {
                setColorMode('dark');
            } else {
                setColorMode('light');
            }
        };
        syncTheme();

        // Listen for changes
        const observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        return () => observer.disconnect();
    }, []);

    // -- File Upload Logic (Supabase) --
    const handleFileUpload = useCallback(async (file: File, callback: (url: string) => void) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `post-assets/${fileName}`;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Authentication required");

            const { error: uploadError } = await supabase.storage
                .from('post-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-assets')
                .getPublicUrl(filePath);

            callback(publicUrl);
            toast({ title: "Uploaded successfully" });
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        }
    }, [toast]);

    // -- Data Loading --
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (initialData) {
                    // Use SSR props if available
                    setTitle(initialData.title);
                    setTopic(initialData.topic);
                    setIsPublic(initialData.is_public);
                    setFeaturedImage(initialData.featured_image);
                    setMarkdown(initialData.content || '');
                } else if (postId) {
                    const { data, error } = await supabase.from('notes').select('*').eq('id', postId).single();
                    if (data) {
                        setTitle(data.title);
                        setTopic(data.topic);
                        setIsPublic(data.is_public);
                        setFeaturedImage(data.featured_image);
                        setMarkdown(data.content || '');
                    }
                } else if (!initialized.current) {
                    const savedDraft = localStorage.getItem('post-draft');
                    if (savedDraft) {
                        try {
                            const draft = JSON.parse(savedDraft);
                            setTitle(draft.title || '');
                            setTopic(draft.topic || availableTopics[0]?.name || 'Technology');
                            setMarkdown(draft.markdown || '# New Post\n\nStart writing...');
                            if (draft.featuredImage) setFeaturedImage(draft.featuredImage);
                            toast({ title: "Draft restored" });
                        } catch (e) { console.error(e) }
                    } else {
                        setTitle('');
                        const initialTopic = availableTopics.length > 0 ? availableTopics[0].name : 'Technology';
                        setTopic(initialTopic);
                        setMarkdown('# New Post\n\nStart writing...');
                    }
                }
                initialized.current = true;
            } catch (err) {
                console.error("Error loading post:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [postId, initialData, toast]); // Removed availableTopics dependency to avoid reset loops

    // -- Auto Save Draft --
    useEffect(() => {
        if (!postId && initialized.current) {
            localStorage.setItem('post-draft', JSON.stringify({ title, topic, markdown, isPublic, featuredImage }));
        }
    }, [title, topic, markdown, isPublic, featuredImage, postId]);

    // -- Handlers --
    const handleClose = () => {
        if (!postId && (title || markdown.length > 50)) {
            if (window.confirm("You have unsaved changes. Draft will be saved locally. Close anyway?")) {
                window.location.href = '/';
            }
        } else {
            if (postId) {
                window.location.href = `/post/${postId}`;
            } else {
                window.location.href = '/';
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });

        setSaving(true);
        try {
            // First ensure the topic exists in the DB so it has a stable color and ID
            const topicId = await ensureTopicExists(topic);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const payload = {
                title,
                topic, // keeping 'topic' string for legacy/fallback but topic_id is primary now
                topic_id: topicId,
                content: markdown,
                user_id: session.user.id,
                is_public: isPublic,
                featured_image: featuredImage || `https://picsum.photos/seed/${encodeURIComponent(title)}/800/400`,
                read_time_minutes: Math.max(1, Math.ceil(markdown.split(/\s+/).length / 200))
            };

            let oldTopic = null;
            if (postId) {
                const { data: currentPost } = await supabase.from('notes').select('topic').eq('id', postId).single();
                oldTopic = currentPost?.topic;
            }

            const { data: savedData, error } = postId
                ? await supabase.from('notes').update(payload).eq('id', postId).select().single()
                : await supabase.from('notes').insert([payload]).select().single();

            if (error) throw error;

            if (oldTopic && oldTopic !== topic) {
                await deleteTopicIfEmpty(oldTopic);
            }

            // We don't need to broadcast manually if we are just navigating, 
            // but keeping it doesn't hurt.

            toast({ title: "Published successfully" });
            localStorage.removeItem('post-draft');

            // Redirect to the post
            if (savedData?.id) {
                window.location.href = `/post/${savedData.id}`;
            } else {
                window.location.href = '/';
            }

        } catch (e: any) {
            toast({ title: "Error saving", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        handleFileUpload(file, (url) => {
            if (isUploadingBanner) {
                setFeaturedImage(url);
            } else {
                setMarkdown(prev => prev + `\n![Image](${url})`);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
            setIsUploadingBanner(false);
        });
    };

    const handleAddTopic = () => {
        if (newTopicName.trim()) {
            setTopic(newTopicName);
            setNewTopicName('');
            toast({ title: `Topic set to ${newTopicName}` });
        }
    };

    const handleUploadBanner = () => {
        setIsUploadingBanner(true);
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100">
            {/* Custom Header Wrapper that includes Back Button */}
            <div className="flex-none">
                <EditorHeader
                    title={title}
                    onTitleChange={setTitle}
                    topic={topic}
                    onTopicChange={setTopic}
                    availableTopics={availableTopics}
                    isPublic={isPublic}
                    onPublicChange={setIsPublic}
                    featuredImage={featuredImage}
                    saving={saving}
                    newTopicName={newTopicName}
                    onNewTopicNameChange={setNewTopicName}
                    onAddTopic={handleAddTopic}
                    onClose={handleClose}
                    onSave={handleSave}
                    onUploadBanner={handleUploadBanner}
                />
            </div>

            {/* Hidden Input for Header Buttons */}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleHeaderUpload} />

            {/* Editor Body */}
            <div className="flex-1 w-full relative overflow-hidden">
                {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <CherryEditor
                        value={markdown}
                        onChange={setMarkdown}
                        onFileUpload={handleFileUpload}
                        colorMode={colorMode}
                    />
                )}
            </div>
        </div>
    );
};

export default StandalonePostEditor;
