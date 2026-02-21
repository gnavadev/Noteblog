export interface Post {
    id: string;
    title: string;
    content?: string;
    topic: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
}

export interface Topic {
    name: string;
    color: string;
}

export interface ReaderPanelProps {
    selectedPostId: string | null;
    initialPost: Post | null;
    topics: Topic[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
    colorMode: 'light' | 'dark';
    isAdmin: boolean;
}

export const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};
