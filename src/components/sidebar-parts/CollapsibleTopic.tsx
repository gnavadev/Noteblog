import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SortableMenuItem from './SortableMenuItem';
import type { Post, Topic } from './types';

interface CollapsibleTopicProps {
    topic: Topic;
    posts: Post[];
    selectedTopic: string | null;
    selectedPostId: string | null;
    onSelectTopic: (topic: string | null) => void;
    onSelectPost: (id: string | null) => void;
    isAdmin: boolean;
}

const CollapsibleTopic: React.FC<CollapsibleTopicProps> = ({
    topic,
    posts,
    selectedTopic,
    selectedPostId,
    onSelectTopic,
    onSelectPost,
    isAdmin
}) => {
    const [isOpen, setIsOpen] = useState(selectedTopic === topic.name);

    useEffect(() => {
        if (selectedTopic === topic.name) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [selectedTopic, topic.name]);

    const topicPosts = useMemo(() =>
        posts.filter(p => (p.topic_id && p.topic_id === topic.id) || (!p.topic_id && p.topic === topic.name)),
        [posts, topic.id, topic.name]
    );

    return (
        <SidebarMenuItem>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
                <SortableMenuItem
                    id={topic.name}
                    isAdmin={isAdmin}
                    label={
                        <div className="flex items-center w-full">
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton
                                    className={cn(
                                        "w-full justify-start h-9 transition-colors",
                                        selectedTopic === topic.name && "bg-primary/5 text-primary font-bold"
                                    )}
                                    onClick={() => onSelectTopic(topic.name)}
                                >
                                    <div className="w-2 h-2 rounded-full mr-3 shrink-0" style={{ backgroundColor: topic.color }} />
                                    <span className="flex-1 truncate">{topic.name}</span>
                                    <span className="text-[11px] font-bold opacity-60 ml-2 shrink-0">{topic.count}</span>
                                    <ChevronRight className="h-4 w-4 ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </div>
                    }
                />
                <CollapsibleContent asChild forceMount>
                    <AnimatePresence initial={false}>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                    height: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                className="overflow-hidden"
                            >
                                <SidebarMenuSub>
                                    {topicPosts.map(post => (
                                        <SidebarMenuSubItem key={post.id}>
                                            <SidebarMenuSubButton
                                                isActive={selectedPostId === post.id}
                                                onClick={() => onSelectPost(post.id)}
                                                className={cn(
                                                    "text-[13px] py-1 h-auto min-h-[1.75rem]",
                                                    selectedPostId === post.id ? "text-primary font-semibold" : "font-normal text-muted-foreground"
                                                )}
                                            >
                                                {post.title}
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
};

export default CollapsibleTopic;
