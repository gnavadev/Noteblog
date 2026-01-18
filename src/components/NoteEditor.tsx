import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Save,
    Image as ImageIcon,
    Globe,
    ArrowLeft,
    Upload,
    Plus,
    Sun,
    Moon,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import CherryEditor from 'cherry-markdown/dist/cherry-markdown.core';
import 'cherry-markdown/dist/cherry-markdown.css';
// @ts-ignore
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin.js';
import mermaid from 'mermaid';

// Register the Mermaid plugin before instantiation
if (CherryMermaidPlugin) {
    CherryEditor.usePlugin(CherryMermaidPlugin, {
        mermaid,
    });
}

interface CherryEditorWrapperProps {
    initialValue: string;
    onChange: (val: string) => void;
    colorMode: 'light' | 'dark';
    editorRef: React.MutableRefObject<any>;
}

// Memoized wrapper to prevent React from re-rendering the editor container
const CherryEditorWrapper = React.memo(({ initialValue, onChange, colorMode, editorRef }: CherryEditorWrapperProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && !editorRef.current) {
            editorRef.current = new CherryEditor({
                id: 'cherry-editor-instance',
                value: initialValue,
                locale: 'en_US',
                externals: {
                    echarts: false,
                    katex: false,
                    MathJax: false,
                },
                editor: {
                    defaultModel: 'edit&preview',
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                    height: '100%',
                },
                toolbars: {
                    theme: colorMode === 'dark' ? 'dark' : 'light',
                },
                callback: {
                    afterChange: (val: string) => {
                        onChange(val);
                    },
                    afterAsyncRender: (md: string, html: string) => {
                        // Optional: handle post-async-render logic if needed
                        // console.log('Async render finished');
                    }
                },
            });
        }

        return () => {
            if (editorRef.current) {
                if (typeof editorRef.current.destroy === 'function') {
                    editorRef.current.destroy();
                }
                editorRef.current = null;
            }
        };
    }, []); // Only initialize once

    // Update theme when colorMode changes
    useEffect(() => {
        if (editorRef.current) {
            const theme = colorMode === 'dark' ? 'dark' : 'light';
            editorRef.current.setTheme(theme);
        }
    }, [colorMode]);

    return (
        <div
            id="cherry-editor-instance"
            ref={containerRef}
            className="h-full w-full"
        />
    );
});

CherryEditorWrapper.displayName = 'CherryEditorWrapper';

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
    const [markdown, setMarkdown] = useState('');
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('Technology');
    const [isPublic, setIsPublic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [featuredImage, setFeaturedImage] = useState<string | null>(null);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const { toast } = useToast();
    const [newTopicName, setNewTopicName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cherryRef = useRef<any>(null);
    const hasBeenInitialized = useRef(false);

    // Stable callback for editor changes
    const handleMarkdownChange = React.useCallback((val: string) => {
        setMarkdown(val);
    }, []);

    useEffect(() => {
        if (open) {
            if (postId) {
                fetchPostData(postId);
            } else if (!hasBeenInitialized.current) {
                // Check for draft in localStorage
                const savedDraft = localStorage.getItem('post-draft');
                if (savedDraft) {
                    try {
                        const draft = JSON.parse(savedDraft);
                        setTitle(draft.title || '');
                        setTopic(draft.topic || availableTopics[0]?.name || 'Technology');
                        setIsPublic(draft.isPublic || false);
                        setFeaturedImage(draft.featuredImage || null);
                        const content = draft.markdown || '# Untitled Post\n\nStart writing here...';
                        setMarkdown(content);
                        if (cherryRef.current) cherryRef.current.setValue(content);
                        toast({ title: "Draft restored", description: "Your unsaved changes were recovered." });
                    } catch (e) {
                        console.error('Failed to load draft:', e);
                    }
                } else {
                    const defaultContent = '# Untitled Post\n\nStart writing here...';
                    setMarkdown(defaultContent);
                    if (cherryRef.current) cherryRef.current.setValue(defaultContent);
                    setTitle('');
                    setTopic(availableTopics[0]?.name || 'Technology');
                    setIsPublic(false);
                    setFeaturedImage(null);
                }
                hasBeenInitialized.current = true;
            }
        } else {
            hasBeenInitialized.current = false;
        }
    }, [open, postId]);

    // Save draft to localStorage
    useEffect(() => {
        if (open && !postId && hasBeenInitialized.current) {
            const draft = { title, topic, markdown, isPublic, featuredImage };
            localStorage.setItem('post-draft', JSON.stringify(draft));
        }
    }, [title, topic, markdown, isPublic, featuredImage, open, postId]);

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
                if (cherryRef.current) {
                    cherryRef.current.setValue(data.content || '');
                }
            }
        } catch (error: any) {
            toast({ title: "Failed to load post", description: error.message, variant: "destructive" });
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

            const userId = session.user.id;

            const { error: uploadError } = await supabase.storage
                .from('post-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-assets')
                .getPublicUrl(filePath);

            if (isUploadingBanner) {
                setFeaturedImage(publicUrl);
                toast({ title: "Banner updated" });
            } else {
                const newMarkdown = `${markdown}\n![Image](${publicUrl})\n`;
                setMarkdown(newMarkdown);
                if (cherryRef.current) {
                    cherryRef.current.setValue(newMarkdown);
                }
                toast({ title: "Image added" });
            }
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
            setIsUploadingBanner(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ title: "Title required", description: "Please enter a title for your post", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Authentication required');

            const userId = session.user.id;

            const payload = {
                title,
                topic,
                content: markdown,
                user_id: userId,
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

            toast({ title: "Post published successfully" });
            localStorage.removeItem('post-draft');
            await onSave();
            onClose();
        } catch (error: any) {
            toast({ title: "Save failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const addNewTopic = () => {
        if (newTopicName && !availableTopics.find(t => t.name === newTopicName)) {
            setTopic(newTopicName);
            setNewTopicName('');
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col text-foreground">
            <header className="px-6 py-4 bg-sidebar border-b border-border flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (!postId && title.trim() && title.trim() !== 'Untitled Post') {
                            if (confirm("You have unsaved changes. Are you sure you want to close? You can recover this draft later.")) {
                                onClose();
                            }
                        } else {
                            onClose();
                        }
                    }} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <Input
                        placeholder="Post Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-extrabold border-none shadow-none focus-visible:ring-0 bg-transparent px-0 w-full max-w-[400px]"
                    />

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-tight opacity-40 ml-1">Topic</span>
                            <Select value={topic} onValueChange={setTopic}>
                                <SelectTrigger className="w-[160px] h-9 bg-background/50 border-muted-foreground/20">
                                    <SelectValue placeholder="General" />
                                </SelectTrigger>
                                <SelectContent className="z-[2100]">
                                    <SelectGroup>
                                        {availableTopics.map(t => (
                                            <SelectItem key={t.name} value={t.name}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                        {topic && !availableTopics.find(t => t.name === topic) && (
                                            <SelectItem value={topic}>{topic}</SelectItem>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-tight opacity-40 ml-1">New</span>
                            <div className="flex items-center gap-1 group">
                                <Input
                                    placeholder="Add..."
                                    value={newTopicName}
                                    className="h-9 w-24 text-xs bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addNewTopic();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={addNewTopic}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 px-4">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-primary">
                        {colorMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <Globe className={cn("h-4 w-4", isPublic ? "text-primary" : "text-muted-foreground opacity-50")} />
                        <span className="text-sm font-semibold">Public</span>
                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="flex items-center gap-2">
                        <Button
                            variant={featuredImage ? "default" : "outline"}
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                setIsUploadingBanner(true);
                                fileInputRef.current?.click();
                            }}
                        >
                            <ImageIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">{featuredImage ? 'Change Banner' : 'Set Banner'}</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                setIsUploadingBanner(false);
                                fileInputRef.current?.click();
                            }}
                        >
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Image</span>
                        </Button>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 font-bold px-6 shadow-lg shadow-primary/20"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Publish</span>
                    </Button>

                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main
                className="flex-1 min-h-0"
                data-color-mode={colorMode}
            >
                <CherryEditorWrapper
                    initialValue={markdown}
                    onChange={handleMarkdownChange}
                    colorMode={colorMode}
                    editorRef={cherryRef}
                />
            </main>
        </div>
    );
};

export default PostEditor;
