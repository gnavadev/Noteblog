import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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

    const getTopicColor = (topicName: string): string => {
        const existing = topics.find(t => t.name === topicName);
        if (existing) return existing.color;

        if (!topicName) return DEFAULT_COLOR;
        let hash = 0;
        for (let i = 0; i < topicName.length; i++) {
            hash = topicName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % TOPIC_COLOR_PALETTE.length;
        return TOPIC_COLOR_PALETTE[index];
    };

    const ensureTopicExists = async (topicName: string): Promise<string | null> => {
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
    };

    const refreshTopics = async () => {
        setLoading(true);
        await fetchTopics();
    };

    return (
        <TopicContext.Provider value={{ topics, loading, getTopicColor, refreshTopics, ensureTopicExists }}>
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
