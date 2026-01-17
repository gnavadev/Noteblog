import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Trash2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DrawingCanvas, { type DrawingCanvasHandle } from './DrawingCanvas';
import { cn } from '@/lib/utils';

export interface PostItData {
    id: string;
    user_id: string;
    content: string;
    drawing_data: any[];
    position_x: number;
    position_y: number;
    color: string;
}

interface PostItProps {
    data: PostItData;
    tool: 'text' | 'pencil' | 'eraser';
    pencilSize: number;
    eraserSize: number;
    canEdit: boolean;
    isAdmin: boolean;
    onUpdate: (id: string, updates: Partial<PostItData>) => void;
    onDelete: (id: string) => void;
    onDragEnd: (id: string, x: number, y: number) => void;
    onInteract?: () => void;
}

const PostIt = forwardRef<DrawingCanvasHandle, PostItProps>(({
    data,
    tool,
    pencilSize,
    eraserSize,
    canEdit,
    isAdmin,
    onUpdate,
    onDelete,
    onDragEnd,
    onInteract
}, ref) => {
    const [isEditingText, setIsEditingText] = useState(false);
    const [localContent, setLocalContent] = useState(data.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const canvasRef = useRef<DrawingCanvasHandle>(null);
    const dragControls = useDragControls();

    useImperativeHandle(ref, () => ({
        undo: () => canvasRef.current?.undo(),
        redo: () => canvasRef.current?.redo()
    }));

    useEffect(() => {
        setLocalContent(data.content);
    }, [data.content]);

    useEffect(() => {
        if (isEditingText && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isEditingText]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalContent(e.target.value);
    };

    const handleTextBlur = () => {
        setIsEditingText(false);
        if (localContent !== data.content) {
            onUpdate(data.id, { content: localContent });
        }
    };

    const handleDrawingChange = (newStrokes: any[]) => {
        onUpdate(data.id, { drawing_data: newStrokes });
    };

    const rotation = (parseInt(data.id.substring(0, 2), 16) % 6) - 3; // Random-ish rotation between -3 and 3

    return (
        <motion.div
            drag={canEdit || isAdmin}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            onDragEnd={(_, info) => {
                const newX = data.position_x + info.offset.x;
                const newY = data.position_y + info.offset.y;
                console.log(`Dragging ended: id=${data.id}, offset=[${info.offset.x}, ${info.offset.y}], newPos=[${newX}, ${newY}]`);
                onDragEnd(data.id, newX, newY);
            }}
            initial={{ scale: 0.8, opacity: 0, rotate: rotation }}
            animate={{
                scale: 1,
                opacity: 1,
                rotate: rotation,
                x: data.position_x,
                y: data.position_y
            }}
            style={{
                backgroundColor: data.color,
                position: 'absolute',
                zIndex: isEditingText ? 50 : 10
            }}
            onPointerDown={() => onInteract?.()}
            className={cn(
                "w-64 h-64 p-4 shadow-xl flex flex-col group transition-shadow",
                (canEdit || isAdmin) ? "cursor-grab active:cursor-grabbing" : "cursor-default",
                "before:absolute before:inset-0 before:bg-white/5 before:pointer-events-none"
            )}
        >
            {/* Header / Drag Handle */}
            <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                    className="flex items-center gap-1 text-black/40 cursor-grab active:cursor-grabbing p-1 -m-1"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    {(canEdit || isAdmin) && <GripHorizontal className="h-4 w-4" />}
                </div>
                {(canEdit || isAdmin) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-black/10 text-black/60 hover:text-black"
                        onClick={() => {
                            onDelete(data.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Text Layer */}
                {tool === 'text' && (canEdit || isAdmin) ? (
                    <textarea
                        ref={textareaRef}
                        value={localContent}
                        onChange={handleTextChange}
                        onBlur={handleTextBlur}
                        className="w-full h-full bg-transparent resize-none border-none focus:ring-0 text-black font-['Architects_Daughter'] text-lg"
                        placeholder="Type something..."
                    />
                ) : (
                    <div
                        className="w-full h-full text-black font-['Architects_Daughter'] text-lg whitespace-pre-wrap invisible prose"
                    >
                        {localContent || " "}
                    </div>
                )}

                {/* Visible Text (non-editable or overlay) */}
                {!(tool === 'text' && (canEdit || isAdmin)) && (
                    <div
                        className="absolute inset-0 pointer-events-none text-black font-['Architects_Daughter'] text-lg whitespace-pre-wrap overflow-hidden"
                    >
                        {localContent}
                    </div>
                )}

                {/* Drawing Layer */}
                <div className={cn(
                    "absolute inset-0",
                    (tool === 'pencil' || tool === 'eraser') && (canEdit || isAdmin) ? "pointer-events-auto" : "pointer-events-none"
                )}>
                    <DrawingCanvas
                        ref={canvasRef}
                        initialData={data.drawing_data}
                        onChange={handleDrawingChange}
                        tool={tool === 'eraser' ? 'eraser' : 'pencil'}
                        readOnly={!(canEdit || isAdmin) || tool === 'text'}
                        lineWidth={tool === 'eraser' ? eraserSize : pencilSize}
                        color="#000000"
                        onMouseDown={onInteract}
                        onTouchStart={onInteract}
                    />
                </div>
            </div>

            {/* Bottom highlight for shadow effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5" />
        </motion.div>
    );
});

export default PostIt;
