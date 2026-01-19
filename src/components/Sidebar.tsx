import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutGrid } from 'lucide-react';
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
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import from sidebar subfolder
import {
    CollapsibleTopic,
    UserSection,
    sidebarItemVariants,
    sidebarContainerVariants,
    type SidebarProps
} from './sidebar-parts';

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
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            <SidebarHeader className="p-4 pb-2">
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
                                                "py-4 px-4 h-10",
                                                (!selectedTopic && !selectedPostId && !isSelectedPostIt) && "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            <FileText className="mr-3 h-4 w-4" />
                                            <span className="text-[0.9rem]">All Posts</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </motion.div>
                                <motion.div variants={sidebarItemVariants}>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={isSelectedPostIt}
                                            onClick={() => onSelectPostIt?.()}
                                            className={cn(
                                                "py-4 px-4 h-10",
                                                isSelectedPostIt && "bg-primary/10 text-primary font-bold"
                                            )}
                                        >
                                            <LayoutGrid className="mr-3 h-4 w-4" />
                                            <span className="text-[0.9rem]">Gabriel's Post-it Board</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </motion.div>
                            </SidebarMenu>
                        </SidebarGroup>

                        <SidebarGroup className="mt-1">
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
                <UserSection />
            </SidebarFooter>
        </Sidebar>
    );
};

export default SidebarComponent;
