import React, { useState, useEffect } from 'react';
import { List, Input, Button, Avatar, message } from 'antd';
import { supabase } from '../lib/supabase';

const { TextArea } = Input;

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user_metadata: any;
}

interface CommentsProps {
    postSlug: string;
}

const Comments: React.FC<CommentsProps> = ({ postSlug }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        fetchComments();
    }, [postSlug]);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_slug', postSlug)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data || []);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setLoading(true);

        const { error } = await supabase.from('comments').insert([
            {
                post_slug: postSlug,
                content: newComment,
                user_id: user.id,
                user_metadata: user.user_metadata,
            },
        ]);

        setLoading(false);
        if (error) {
            message.error('Failed to post comment');
        } else {
            setNewComment('');
            fetchComments();
            message.success('Comment posted!');
        }
    };

    return (
        <div style={{ marginTop: '60px' }}>
            <h3>Comments</h3>
            <List
                dataSource={comments}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={item.user_metadata?.avatar_url} />}
                            title={item.user_metadata?.full_name || 'Anonymous'}
                            description={item.content}
                        />
                        <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </div>
                    </List.Item>
                )}
            />

            {user ? (
                <div style={{ marginTop: '24px' }}>
                    <TextArea
                        rows={4}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                    />
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        style={{ marginTop: '12px' }}
                    >
                        Post Comment
                    </Button>
                </div>
            ) : (
                <p style={{ marginTop: '24px', color: 'rgba(0,0,0,0.5)' }}>
                    Please log in to leave a comment.
                </p>
            )}
        </div>
    );
};

export default Comments;
