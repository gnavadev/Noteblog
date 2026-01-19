import type { Post, Topic } from '../blog/types';
export type { Post, Topic };

export interface SidebarProps {
    onNewPost: () => void;
    selectedPostId: string | null;
    onSelectPost: (id: string | null) => void;
    selectedTopic: string | null;
    onSelectTopic: (topic: string | null) => void;
    posts: Post[];
    topics: Topic[];
    isAdmin: boolean;
    onUpdateTopicOrder?: (newOrder: string[]) => void;
    adminAvatar: string | null;
    isSelectedPostIt?: boolean;
    onSelectPostIt?: () => void;
}

export const sidebarItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

export const sidebarContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};
