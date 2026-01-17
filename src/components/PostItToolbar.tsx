import React from 'react';
import { Type, Pencil, Eraser, Plus, Save, Trash2, X, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type PostItTool = 'text' | 'pencil' | 'eraser';

interface PostItToolbarProps {
    activeTool: PostItTool;
    onToolChange: (tool: PostItTool) => void;
    pencilSize: number;
    onPencilSizeChange: (size: number) => void;
    eraserSize: number;
    onEraserSizeChange: (size: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onAddPostIt: () => void;
    canAdd: boolean;
    isAdmin?: boolean;
    className?: string;
}

const PostItToolbar: React.FC<PostItToolbarProps> = ({
    activeTool,
    onToolChange,
    pencilSize,
    onPencilSizeChange,
    eraserSize,
    onEraserSizeChange,
    onUndo,
    onRedo,
    onAddPostIt,
    canAdd,
    isAdmin = false,
    className = ""
}) => {
    const SIZES = [2, 5, 10, 20];
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

                {/* Size Selection */}
                <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
                    {SIZES.map(size => (
                        <Button
                            key={size}
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-full p-0 flex items-center justify-center transition-all",
                                activeTool === 'pencil' && pencilSize === size && "bg-primary text-primary-foreground hover:bg-primary/90",
                                activeTool === 'eraser' && eraserSize === size && "bg-primary text-primary-foreground hover:bg-primary/90",
                                activeTool === 'text' && "opacity-20 cursor-not-allowed"
                            )}
                            onClick={() => {
                                if (activeTool === 'pencil') onPencilSizeChange(size);
                                if (activeTool === 'eraser') onEraserSizeChange(size);
                            }}
                            disabled={activeTool === 'text'}
                        >
                            <div
                                className="rounded-full bg-current"
                                style={{
                                    width: Math.max(2, size / 2) + 'px',
                                    height: Math.max(2, size / 2) + 'px'
                                }}
                            />
                        </Button>
                    ))}
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0" onClick={onUndo}>
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0" onClick={onRedo}>
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
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
