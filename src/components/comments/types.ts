export interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_metadata: any;
    parent_id: string | null;
    is_pinned?: boolean;
    replies?: Comment[];
}

export interface CommentsProps {
    postId: string;
    isAdmin: boolean;
}

export interface CommentActionsProps {
    onReply: (content: string, parentId: string) => void;
    onEdit: (id: string, content: string) => void;
    onDelete: (id: string) => void;
    onPin: (id: string, isPinned: boolean) => void;
}
