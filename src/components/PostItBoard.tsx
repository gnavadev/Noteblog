import React, { useState } from 'react';
import PostIt from './PostIt';
import PostItToolbar, { type PostItTool } from './PostItToolbar';
import { usePostItBoard, type PostItData } from './postit-parts';

interface PostItBoardProps {
    user: any;
    isAdmin: boolean;
}

const PostItBoard: React.FC<PostItBoardProps> = ({ user, isAdmin }) => {
    const [activeTool, setActiveTool] = useState<PostItTool>('pencil');
    const [pencilSize, setPencilSize] = useState(3);
    const [eraserSize, setEraserSize] = useState(10);

    const {
        postIts,
        loading,
        isAdding,
        effectiveUserId,
        userHasPostIt,
        canvasRefs,
        setActivePostItId,
        handleAddPostIt,
        handleUpdatePostIt,
        handleDeletePostIt,
        handleUndo,
        handleRedo,
        handleSaveAll,
        hasUnsavedChanges
    } = usePostItBoard({ userId: user?.id, isAdmin });

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#e5e5f7] dark:bg-[#1a1c24] border-inner shadow-inner flex flex-col">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px), radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}>
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <PostItToolbar
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    onAddPostIt={handleAddPostIt}
                    canAdd={!userHasPostIt && !isAdding}
                    isAdmin={isAdmin}
                    pencilSize={pencilSize}
                    onPencilSizeChange={setPencilSize}
                    eraserSize={eraserSize}
                    onEraserSizeChange={setEraserSize}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onSave={handleSaveAll}
                    hasChanges={hasUnsavedChanges}
                />
            </div>

            {/* Board Content */}
            <div className="flex-1 relative overflow-auto p-20 min-h-[800px] min-w-[800px]">
                {!loading && (
                    postIts.map(postIt => (
                        <PostIt
                            key={postIt.id}
                            ref={el => { canvasRefs.current[postIt.id] = el; }}
                            data={postIt}
                            tool={activeTool}
                            pencilSize={pencilSize}
                            eraserSize={eraserSize}
                            canEdit={postIt.user_id === effectiveUserId}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdatePostIt}
                            onDelete={handleDeletePostIt}
                            onDragEnd={(id, x, y) => handleUpdatePostIt(id, { position_x: Math.round(x), position_y: Math.round(y) })}
                            onInteract={() => setActivePostItId(postIt.id)}
                        />
                    ))
                )}

                {postIts.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center opacity-30 select-none">
                            <h3 className="text-4xl font-bold mb-2">The board is empty</h3>
                            <p className="text-xl">Be the first to leave a note!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostItBoard;
