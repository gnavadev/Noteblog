import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { TOPIC_COLOR_PALETTE } from '@/lib/constants';

export interface Topic {
    id: string;
    name: string;
    color: string;
}

interface TopicContextValue {
    topics: Topic[];
    loading: boolean;
    getTopicColor: (topicName: string) => string;
    refreshTopics: () => Promise<void>;
    ensureTopicExists: (topicName: string) => Promise<string | null>;
    deleteTopicIfEmpty: (topicName: string) => Promise<void>;
}

const TopicContext = createContext<TopicContextValue | null>(null);

const DEFAULT_COLOR = '#007aff';

export function TopicProvider({ children, initialTopics = [] }: { children: ReactNode, initialTopics?: Topic[] }) {
    const [topics, setTopics] = useState<Topic[]>(initialTopics);
    const [loading, setLoading] = useState(initialTopics.length === 0);

    const fetchTopics = async () => {
        try {
            const { data, error } = await supabase
                .from('topics')
                .select('id, name, color')
                .order('order', { ascending: true });

            if (!error && data) {
                setTopics(data as Topic[]);
            } else if (error && error.code === 'PGRST205') {
                console.info('Topics table not found, using dynamic colors from palette.');
                setTopics([]);
            }
        } catch (err) {
            console.error('Failed to fetch topics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const getTopicColor = useCallback((topicName: string): string => {
        const existing = topics.find(t => t.name === topicName);
        if (existing) return existing.color;

        if (!topicName) return DEFAULT_COLOR;
        let hash = 0;
        for (let i = 0; i < topicName.length; i++) {
            hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % TOPIC_COLOR_PALETTE.length;
        return TOPIC_COLOR_PALETTE[index];
    }, [topics]);

    const ensureTopicExists = useCallback(async (topicName: string): Promise<string | null> => {
        if (!topicName) return null;

        const existing = topics.find(t => t.name === topicName);
        if (existing) return existing.id;

        const color = getTopicColor(topicName);
        try {
            const { data, error } = await supabase
                .from('topics')
                .upsert(
                    { name: topicName, color },
                    { onConflict: 'name' }
                )
                .select('id')
                .single();

            if (!error && data) {
                await fetchTopics();
                return data.id;
            }
            return null;
        } catch (err) {
            console.error('Failed to ensure topic exists:', err);
            return null;
        }
    }, [topics, getTopicColor]);

    const deleteTopicIfEmpty = useCallback(async (topicName: string) => {
        if (!topicName) return;

        try {
            // Check if any notes still use this topic
            const { count, error: countError } = await supabase
                .from('notes')
                .select('*', { count: 'exact', head: true })
                .eq('topic', topicName);

            if (countError) throw countError;

            if (count === 0) {
                console.log(`Topic "${topicName}" has 0 posts. Deleting from topics table.`);
                const { error: deleteError } = await supabase
                    .from('topics')
                    .delete()
                    .eq('name', topicName);

                if (deleteError) throw deleteError;
                await fetchTopics();
            }
        } catch (err) {
            console.error('Failed to cleanup empty topic:', err);
        }
    }, [fetchTopics]);

    const refreshTopics = useCallback(async () => {
        setLoading(true);
        await fetchTopics();
    }, []);

    const contextValue = useMemo(() => ({
        topics,
        loading,
        getTopicColor,
        refreshTopics,
        ensureTopicExists,
        deleteTopicIfEmpty
    }), [topics, loading, getTopicColor, refreshTopics, ensureTopicExists, deleteTopicIfEmpty]);

    return (
        <TopicContext.Provider value={contextValue}>
            {children}
        </TopicContext.Provider>
    );
}

export function useTopics() {
    const context = useContext(TopicContext);
    if (!context) {
        throw new Error('useTopics must be used within a TopicProvider');
    }
    return context;
}

// Hook for getting a single topic's color (convenience)
export function useTopicColor(topicName: string): string {
    const { getTopicColor } = useTopics();
    return getTopicColor(topicName);
}

export default TopicProvider;
