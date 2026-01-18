import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X,
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

// --- Cherry Markdown Configuration ---
// Documentation: https://github.com/Tencent/cherry-markdown
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import 'cherry-markdown/dist/cherry-markdown.css';

// Plugin: Mermaid
// @ts-ignore
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// Register Plugins immediately
Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid,
});

interface CherryEditorProps {
    value: string;
    onChange: (value: string) => void;
    onFileUpload: (file: File, callback: (url: string) => void) => void;
    colorMode: 'light' | 'dark';
}

const CherryEditorComponent = React.memo(({ value, onChange, onFileUpload, colorMode }: CherryEditorProps) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);

    // Initialize Editor
    useEffect(() => {
        if (!editorContainerRef.current) return;
        if (editorInstanceRef.current) return;

        editorInstanceRef.current = new Cherry({
            id: 'cherry-markdown-container',
            value: value,
            locale: 'en_US',
            // External dependencies (disable to avoid auto-loading issues)
            externals: {
                echarts: false,
                katex: false,
                MathJax: false,
            },
            // Engine Configuration
            engine: {
                global: {
                    urlProcessor(url: string, srcType: string) {
                        return url;
                    },
                },
                syntax: {
                    codeBlock: {
                        theme: 'twilight',
                        wrap: true,
                        lineNumber: true,
                    },
                    table: {
                        enableChart: true,
                    },
                    fontEmphasis: {
                        allowWhitespace: false, // Fix for CJK
                    },
                    strikethrough: {
                        needWhitespace: false,
                    },
                    mathBlock: {
                        engine: 'MathJax',
                    },
                    inlineMath: {
                        engine: 'MathJax',
                    },
                    emoji: {
                        useUnicode: true,
                    },
                },
            },
            // Editor UI Settings
            editor: {
                defaultModel: 'edit&preview',
                theme: colorMode === 'dark' ? 'dark' : 'light',
                height: '100%',
                showFullWidthMark: true,
                showSuggestList: true,
                convertWhenPaste: true,
            },
            // Toolbar Configuration (Full Model)
            toolbars: {
                theme: colorMode === 'dark' ? 'dark' : 'light',
                showToolbar: true,
                toolbar: [
                    'bold', 'italic',
                    { strikethrough: ['strikethrough', 'underline', 'sub', 'sup', 'ruby'] },
                    'size', '|',
                    'color', 'header', '|',
                    'drawIo', '|',
                    'ol', 'ul', 'checklist', 'panel', 'justify', 'detail', '|',
                    'formula',
                    {
                        insert: ['image', 'audio', 'video', 'link', 'hr', 'br', 'code', 'formula', 'toc', 'table', 'pdf', 'word', 'file']
                    },
                    'graph', 'settings'
                ],
                toolbarRight: ['fullScreen', '|', 'export', 'changeLocale', 'wordCount'],
                sidebar: ['mobilePreview', 'copy', 'theme', 'toc'],
                toc: {
                    defaultModel: 'full',
                },
                // Bubble Toolbar (Selection)
                bubble: ['bold', 'italic', 'underline', 'strikethrough', 'sub', 'sup', 'quote', '|', 'size', 'color'],
                // Float Toolbar (New Line)
                float: ['h1', 'h2', 'h3', '|', 'checklist', 'quote', 'table', 'code'],
            },
            // File Upload Handling
            fileModule: {
                fileUpload: onFileUpload,
            },
            // Callbacks
            callback: {
                afterChange: (markdown: string) => {
                    onChange(markdown);
                },
                fileUpload: onFileUpload,
            },
        });

        return () => {
            // Cherry destructor if available
            if (editorInstanceRef.current) {
                editorInstanceRef.current = null;
            }
        };
    }, []);

    // Handle Theme Changes
    useEffect(() => {
        if (editorInstanceRef.current && editorInstanceRef.current.setTheme) {
            editorInstanceRef.current.setTheme(colorMode === 'dark' ? 'dark' : 'light');
            if (editorInstanceRef.current.toolbar && editorInstanceRef.current.toolbar.setTheme) {
                editorInstanceRef.current.toolbar.setTheme(colorMode === 'dark' ? 'dark' : 'light');
            }
        }
    }, [colorMode]);

    return <div id="cherry-markdown-container" ref={editorContainerRef} className="h-full w-full" />;
});
CherryEditorComponent.displayName = 'CherryEditorComponent';


// --- Main Editor Application Component ---
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
            return;
        }

        const loadData = async () => {
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
                        setMarkdown(draft.markdown || '');
                        toast({ title: "Draft restored" });
                    } catch (e) { console.error(e) }
                } else {
                    setTitle('');
                    setMarkdown('# New Post\n\nStart writing...');
                }
            }
            initialized.current = true;
        };

        loadData();
    }, [open, postId, availableTopics, toast]);

    // -- Auto Save Draft --
    useEffect(() => {
        if (open && !postId && initialized.current) {
            localStorage.setItem('post-draft', JSON.stringify({ title, topic, markdown, isPublic, featuredImage }));
        }
    }, [title, topic, markdown, isPublic, featuredImage, open, postId]);

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

    if (!open) return null;

    // -- Render: Clean "Admin App" Layout --
    return (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252526] shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="ghost" size="icon" onClick={onClose} title="Back">
                        <ArrowLeft className="h-5 w-5 opacity-70" />
                    </Button>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Post Title"
                        className="max-w-[400px] bg-white dark:bg-[#333] border-gray-300 dark:border-gray-600 font-semibold"
                    />
                    <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-[#333] border-gray-300 dark:border-gray-600">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTopics.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full">
                        <span className="text-xs font-medium uppercase opacity-50">Public</span>
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
                <CherryEditorComponent
                    value={markdown}
                    onChange={setMarkdown}
                    onFileUpload={handleFileUpload}
                    colorMode={colorMode}
                />
            </div>
        </div>
    );
};

export default PostEditor;
