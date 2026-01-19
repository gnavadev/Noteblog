import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from "@/hooks/use-toast";
import CherryEditor from './CherryEditor';
import { EditorHeader } from './editor';
import { useTopics } from './TopicProvider';
import type { PostEditorProps } from './editor/types';

const PostEditor: React.FC<PostEditorProps> = ({ open, onClose, onSave, postId, availableTopics, colorMode, toggleTheme }) => {
    // App State
    const { ensureTopicExists } = useTopics();
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
        if (!open) {
            initialized.current = false;
            setIsLoading(true);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                if (postId) {
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
    }, [open, postId, availableTopics, toast]);

    // -- Auto Save Draft --
    useEffect(() => {
        if (open && !postId && initialized.current) {
            localStorage.setItem('post-draft', JSON.stringify({ title, topic, markdown, isPublic, featuredImage }));
        }
    }, [title, topic, markdown, isPublic, featuredImage, open, postId]);

    // -- Handlers --
    const handleClose = () => {
        if (!postId && (title || markdown.length > 50)) {
            if (window.confirm("You have unsaved changes. Draft will be saved locally. Close anyway?")) {
                onClose();
            }
        } else {
            onClose();
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

            const { error } = postId
                ? await supabase.from('notes').update(payload).eq('id', postId)
                : await supabase.from('notes').insert([payload]);

            if (error) throw error;

            await supabase.channel('blog_updates').send({
                type: 'broadcast',
                event: 'refresh',
                payload: { action: 'saved', postId: postId || 'new' }
            });

            toast({ title: "Published successfully" });
            localStorage.removeItem('post-draft');
            onSave();
            onClose();
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

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100">
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

export default PostEditor;
