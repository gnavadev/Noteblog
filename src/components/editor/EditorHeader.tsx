import React from 'react';
import { Save, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Topic } from './types';

interface EditorHeaderProps {
    title: string;
    onTitleChange: (value: string) => void;
    topic: string;
    onTopicChange: (value: string) => void;
    availableTopics: Topic[];
    isPublic: boolean;
    onPublicChange: (value: boolean) => void;
    featuredImage: string | null;
    saving: boolean;
    newTopicName: string;
    onNewTopicNameChange: (value: string) => void;
    onAddTopic: () => void;
    onClose: () => void;
    onSave: () => void;
    onUploadBanner: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
    title,
    onTitleChange,
    topic,
    onTopicChange,
    availableTopics,
    isPublic,
    onPublicChange,
    featuredImage,
    saving,
    newTopicName,
    onNewTopicNameChange,
    onAddTopic,
    onClose,
    onSave,
    onUploadBanner
}) => {
    return (
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252526] shrink-0">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" onClick={onClose} title="Back">
                    <ArrowLeft className="h-5 w-5 opacity-70" />
                </Button>
                <Input
                    value={title}
                    onChange={e => onTitleChange(e.target.value)}
                    placeholder="Post Title"
                    className="max-w-[300px] bg-white dark:bg-[#333] border-gray-300 dark:border-gray-600 font-semibold"
                />

                {/* Topics Selection + Creation */}
                <div className="flex items-center gap-2">
                    <Select value={topic} onValueChange={onTopicChange}>
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
                            onChange={e => onNewTopicNameChange(e.target.value)}
                            className="w-24 h-9 text-xs bg-white dark:bg-[#333]"
                            onKeyDown={(e) => e.key === 'Enter' && onAddTopic()}
                        />
                        <Button size="sm" variant="ghost" onClick={onAddTopic} disabled={!newTopicName}>
                            +
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full" title="If disabled, only Admin can view">
                    <span className="text-xs font-medium uppercase opacity-50">{isPublic ? 'Public' : 'Private'}</span>
                    <Switch checked={isPublic} onCheckedChange={onPublicChange} className="scale-75" />
                </div>

                <Button variant="outline" size="sm" onClick={onUploadBanner}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {featuredImage ? 'Change Cover' : 'Add Cover'}
                </Button>

                <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Publish
                </Button>
            </div>
        </header>
    );
};

export default EditorHeader;
