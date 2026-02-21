import type { Post, Topic } from '../blog/types';
export type { Post, Topic };

export interface MagazineGridProps {
    selectedPostId: string | null;
    onSelectPost: (id: string) => void;
    onNewPost: () => void;
    onEditPost: (id: string) => void;
    onDeletePost: (id: string) => void;
    isAdmin?: boolean;
    selectedTopic?: string | null;
    posts: Post[];
    topics: Topic[];
    loading: boolean;
    loadMoreContent: (ids: string[]) => Promise<void>;
}

export const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 20
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.15 }
    }
};
