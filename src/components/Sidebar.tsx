import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Mail,
    LogOut,
    User,
    GripVertical,
    LayoutGrid,
    ChevronRight,
    MoreHorizontal
} from 'lucide-react';
import Auth from './Auth';
import { supabase } from '../lib/supabase';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

const sidebarItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
        opacity: 1,
        x: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
};

const sidebarContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2
        }
    }
};

interface Post {
    id: string;
    title: string;
    topic: string;
}

interface SidebarProps {
    onNewPost: () => void;
    selectedPostId: string | null;
    onSelectPost: (id: string | null) => void;
    selectedTopic: string | null;
    onSelectTopic: (topic: string | null) => void;
    posts: Post[];
    topics: { name: string; count: number; color: string }[];
    isAdmin: boolean;
    onUpdateTopicOrder?: (newOrder: string[]) => void;
    adminAvatar: string | null;
    isSelectedPostIt?: boolean;
    onSelectPostIt?: () => void;
}

const SortableMenuItem: React.FC<{
    id: string;
    label: React.ReactNode;
    isAdmin: boolean;
}> = ({ id, label, isAdmin }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: !isAdmin });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
        cursor: isAdmin ? 'grab' : 'default',
        width: '100%'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="flex items-center w-full group/sortable"
        >
            {isAdmin && (
                <div {...listeners} className="mr-1 p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded opacity-0 group-hover/sortable:opacity-100 transition-opacity">
                    <GripVertical className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </div>
            )}
            <div className="flex-1">{label}</div>
        </div>
    );
};

const CollapsibleTopic: React.FC<{
    topic: { name: string; count: number; color: string };
    posts: Post[];
    selectedTopic: string | null;
    selectedPostId: string | null;
    onSelectTopic: (topic: string | null) => void;
    onSelectPost: (id: string | null) => void;
    isAdmin: boolean;
}> = ({ topic, posts, selectedTopic, selectedPostId, onSelectTopic, onSelectPost, isAdmin }) => {
    const [isOpen, setIsOpen] = useState(selectedTopic === topic.name);

    useEffect(() => {
        if (selectedTopic === topic.name) {
            setIsOpen(true);
        }
    }, [selectedTopic, topic.name]);

    const topicPosts = useMemo(() => posts.filter(p => p.topic === topic.name), [posts, topic.name]);

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

const SidebarComponent: React.FC<SidebarProps> = ({
    onNewPost,
    selectedPostId,
    onSelectPost,
    selectedTopic,
    onSelectTopic,
    posts,
    topics,
    isAdmin,
    onUpdateTopicOrder,
    adminAvatar,
    isSelectedPostIt,
    onSelectPostIt
}) => {
    const [user, setUser] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = topics.findIndex(t => t.name === active.id);
            const newIndex = topics.findIndex(t => t.name === over.id);
            onUpdateTopicOrder?.(arrayMove(topics, oldIndex, newIndex).map(t => t.name));
        }
    };

    return (
        <Sidebar className="border-r border-border bg-sidebar/50 backdrop-blur-sm">
            <SidebarHeader className="p-6 pb-4">
                <motion.div variants={sidebarItemVariants} initial="hidden" animate="show" className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 bg-primary ring-2 ring-primary/10 transition-transform hover:scale-105">
                        <AvatarImage src={adminAvatar || '/GabrielPhoto.jpg'} alt="Gabriel" />
                        <AvatarFallback className="text-white text-lg">G</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold m-0 text-foreground leading-tight truncate">Gabriel's Blog</h2>
                        <span className="text-muted-foreground text-xs font-medium">← Looking for a job</span>
                    </div>
                </motion.div>
            </SidebarHeader>

            <SidebarContent>
                <ScrollArea className="flex-1">
                    <motion.div variants={sidebarContainerVariants} initial="hidden" animate="show">
                        <SidebarGroup>
                            <SidebarMenu className="px-2">
                                <motion.div variants={sidebarItemVariants}>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={!selectedTopic && !selectedPostId && !isSelectedPostIt}
                                            onClick={() => { onSelectPost(null); onSelectTopic(null); }}
                                            className={cn(
                                                "py-6 px-4 h-12",
                                                (!selectedTopic && !selectedPostId && !isSelectedPostIt) && "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            <FileText className="mr-3 h-5 w-5" />
                                            <span className="text-[1rem]">All Posts</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </motion.div>
                                <motion.div variants={sidebarItemVariants}>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={isSelectedPostIt}
                                            onClick={() => onSelectPostIt?.()}
                                            className={cn(
                                                "py-6 px-4 h-12",
                                                isSelectedPostIt && "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            <LayoutGrid className="mr-3 h-5 w-5" />
                                            <span className="text-[1rem]">Gabriel's Post-it Board</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </motion.div>
                            </SidebarMenu>
                        </SidebarGroup>

                        <SidebarGroup className="mt-4">
                            <motion.div variants={sidebarItemVariants}>
                                <SidebarGroupLabel className="px-6 pb-2 text-[0.8rem] font-bold text-muted-foreground uppercase tracking-widest">
                                    Categories
                                </SidebarGroupLabel>
                            </motion.div>
                            <SidebarMenu className="px-2">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={topics.map(t => t.name)} strategy={verticalListSortingStrategy}>
                                        {topics.map(topic => (
                                            <motion.div
                                                key={topic.name}
                                                variants={sidebarItemVariants}
                                                whileHover={{ x: 4 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                <CollapsibleTopic
                                                    topic={topic}
                                                    posts={posts}
                                                    selectedTopic={selectedTopic}
                                                    selectedPostId={selectedPostId}
                                                    onSelectTopic={onSelectTopic}
                                                    onSelectPost={onSelectPost}
                                                    isAdmin={isAdmin}
                                                />
                                            </motion.div>
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </SidebarMenu>
                        </SidebarGroup>
                    </motion.div>
                </ScrollArea>
            </SidebarContent>

            <SidebarFooter className="p-0 border-t border-border mt-auto bg-sidebar/50">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => window.open('https://linktr.ee/gabrielnavainfo', '_blank')}
                            className="py-6 px-4 h-12"
                        >
                            <Mail className="mr-3 h-5 w-5" />
                            <span className="text-[1rem]">Contact</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {user ? (
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton className="py-8 px-4 h-16">
                                        <Avatar className="h-10 w-10 mr-3 shrink-0">
                                            <AvatarImage src={user.user_metadata?.avatar_url} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold text-foreground truncate flex-1">
                                            {user.user_metadata?.full_name || user.email}
                                        </span>
                                        <MoreHorizontal className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width] z-[1000]">
                                    <DropdownMenuItem onClick={() => supabase.auth.signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    ) : (
                        <div className="py-4">
                            <Auth />
                        </div>
                    )}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};

export default SidebarComponent;
