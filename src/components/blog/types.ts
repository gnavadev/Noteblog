export interface Post {
    id: string;
    title: string;
    content?: string;
    topic: string;
    topic_id?: string;
    created_at: string;
    read_time_minutes: number;
    featured_image?: string;
    is_public?: boolean;
    user_id?: string;
    color?: string;
    category_color?: string;
    layout_json?: any;
}

export interface Topic {
    id: string;
    name: string;
    count: number;
    color: string;
}
