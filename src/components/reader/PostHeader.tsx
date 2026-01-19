import React from 'react';
import { Share2, Maximize2, Minimize2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Post } from './types';

interface PostHeaderProps {
    post: Post;
    topicColor: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
}

const PostHeader: React.FC<PostHeaderProps> = ({
    post,
    topicColor,
    isExpanded,
    onToggleExpand,
    onClose
}) => {
    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.5 }
            }}
            className={cn(
                "relative flex items-end p-8 transition-[height] duration-700 ease-in-out",
                isExpanded ? "h-[45vh]" : "h-[25vh]"
            )}
            style={{
                background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${post.featured_image}) center/cover no-repeat`,
            }}
        >
            <div className="absolute top-6 right-6 flex items-center gap-3">
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                    onClick={onToggleExpand}
                >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-none h-10 w-10"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Badge
                    className="mb-4 font-extrabold px-4 py-1.5 rounded-lg text-sm uppercase tracking-wider backdrop-blur-md shadow-lg border-none"
                    style={{ backgroundColor: `${topicColor}dd`, color: 'white' }}
                >
                    {post.topic}
                </Badge>
            </motion.div>
        </motion.div>
    );
};

export default PostHeader;
