import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Save,
    Image as ImageIcon,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import CherryEditor from './CherryEditor';

interface PostEditorProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    postId?: string | null;
    availableTopics: { name: string; color: string }[];
    colorMode: 'light' | 'dark';
    toggleTheme: () => void;
}

const PostEditor: React.FC<PostEditorProps> = ({ open, onClose, onSave, postId, availableTopics, colorMode, toggleTheme }) => {
    // App State
    const [markdown, setMarkdown] = useState('# New Post\n\nStart writing...');
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('Technology');
    const [isPublic, setIsPublic] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Loading state
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
            setIsLoading(true); // Reset loading on close
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                if (postId) {
                    // Edit Mode
                    const { data, error } = await supabase.from('notes').select('*').eq('id', postId).single();
                    if (data) {
                        setTitle(data.title);
                        setTopic(data.topic);
                        setIsPublic(data.is_public);
                        setFeaturedImage(data.featured_image);
                        setMarkdown(data.content || '');
                    }
                } else if (!initialized.current) {
                    // New Post / Draft Mode
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
                        // Default Logic
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

    // -- Close Handler --
    const handleClose = () => {
        if (!postId && (title || markdown.length > 50)) {
            if (window.confirm("You have unsaved changes. Draft will be saved locally. Close anyway?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    // -- Save / Publish --
    const handleSave = async () => {
        if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

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

    // -- Header Manual Upload Helper --
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

    if (!open) return null;

    // -- Render: Clean "Admin App" Layout --
    return (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252526] shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" onClick={handleClose} title="Back">
                        <ArrowLeft className="h-5 w-5 opacity-70" />
                    </Button>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Post Title"
                        className="max-w-[300px] bg-white dark:bg-[#333] border-gray-300 dark:border-gray-600 font-semibold"
                    />

                    {/* Topics Selection + Creation */}
                    <div className="flex items-center gap-2">
                        <Select value={topic} onValueChange={setTopic}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-[#333] border-gray-300 dark:border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[3000]">
                                {availableTopics.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                                {topic && !availableTopics.find(t => t.name === topic) && (
                                    <SelectItem value={topic}>{topic}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                            <Input
                                placeholder="New Topic"
                                value={newTopicName}
                                onChange={e => setNewTopicName(e.target.value)}
                                className="w-24 h-9 text-xs bg-white dark:bg-[#333]"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            />
                            <Button size="sm" variant="ghost" onClick={handleAddTopic} disabled={!newTopicName}>
                                +
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full" title="If disabled, only Admin can view">
                        <span className="text-xs font-medium uppercase opacity-50">{isPublic ? 'Public' : 'Private'}</span>
                        <Switch checked={isPublic} onCheckedChange={setIsPublic} className="scale-75" />
                    </div>

                    <Button variant="outline" size="sm" onClick={() => { setIsUploadingBanner(true); fileInputRef.current?.click(); }}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {featuredImage ? 'Change Cover' : 'Add Cover'}
                    </Button>

                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Publish
                    </Button>
                </div>
            </header>

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

