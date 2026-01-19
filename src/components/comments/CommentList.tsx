import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import CommentItem from './CommentItem';
import type { Comment, CommentActionsProps } from './types';

interface CommentListProps extends CommentActionsProps {
    comments: Comment[];
    user: any;
    isAdmin: boolean;
    level: number;
}

const CommentList: React.FC<CommentListProps> = ({
    comments,
    user,
    isAdmin,
    onReply,
    onEdit,
    onDelete,
    onPin,
    level
}) => {
    return (
        <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
                <React.Fragment key={comment.id}>
                    <CommentItem
                        comment={comment}
                        user={user}
                        isAdmin={isAdmin}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPin={onPin}
                        level={level}
                    />
                    {level === 0 && index < comments.length - 1 && (
                        <Separator className="my-1 opacity-20" />
                    )}
                </React.Fragment>
            ))}
        </AnimatePresence>
    );
};

export default CommentList;
