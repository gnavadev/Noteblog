import React from 'react';
import { Type, Pencil, Eraser, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PostItTool = 'text' | 'pencil' | 'eraser';

interface PostItToolbarProps {
    activeTool: PostItTool;
    onToolChange: (tool: PostItTool) => void;
    onAddPostIt: () => void;
    canAdd: boolean;
    isAdmin?: boolean;
    className?: string;
}

const PostItToolbar: React.FC<PostItToolbarProps> = ({
    activeTool,
    onToolChange,
    onAddPostIt,
    canAdd,
    isAdmin = false,
    className = ""
}) => {
    return (
        <TooltipProvider>
            <div className={cn(
                "flex items-center gap-2 p-3 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg",
                className
            )}>
                <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle
                                pressed={activeTool === 'text'}
                                onPressedChange={() => onToolChange('text')}
                                aria-label="Text tool"
                                size="sm"
                                className="rounded-full"
                            >
                                <Type className="h-4 w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Text Tool</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle
                                pressed={activeTool === 'pencil'}
                                onPressedChange={() => onToolChange('pencil')}
                                aria-label="Pencil tool"
                                size="sm"
                                className="rounded-full"
                            >
                                <Pencil className="h-4 w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Pencil Tool</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Toggle
                                pressed={activeTool === 'eraser'}
                                onPressedChange={() => onToolChange('eraser')}
                                aria-label="Eraser tool"
                                size="sm"
                                className="rounded-full"
                            >
                                <Eraser className="h-4 w-4" />
                            </Toggle>
                        </TooltipTrigger>
                        <TooltipContent>Eraser Tool</TooltipContent>
                    </Tooltip>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            onClick={onAddPostIt}
                            disabled={!canAdd && !isAdmin}
                            size="sm"
                            className="rounded-full gap-2 px-4 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Post-it</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {!canAdd && !isAdmin ? "You already have a post-it!" : "Add a new post-it"}
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default PostItToolbar;
