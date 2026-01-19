import React from 'react';
import { Share2, Maximize2, Minimize2, X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import type { Post } from './types';

interface PostHeaderProps {
    post: Post;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onClose: () => void;
}

const PostHeader: React.FC<PostHeaderProps> = ({
    post,
    isExpanded,
    onToggleExpand,
    onClose
}) => {
    const { toast } = useToast();

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link copied!",
                description: "The post URL has been copied to your clipboard.",
            });
        } catch (err) {
            toast({
                title: "Failed to copy",
                description: "Could not copy link to clipboard.",
                variant: "destructive"
            });
        }
    };

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
            <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border-none h-10 w-10 transition-colors"
                    onClick={handleShare}
                >
                    <Share2 className="h-4 w-4" />
                </Button>

                {/* Mobile: Focus View Button (New Tab) */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border-none h-10 w-10 transition-colors flex sm:hidden"
                    onClick={() => window.open(`/post/${post.id}`, '_blank')}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>

                {/* Desktop: Minimize/Maximize Toggle */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border-none h-10 w-10 transition-colors hidden sm:flex"
                    onClick={onToggleExpand}
                >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border-none h-10 w-10 transition-colors"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
};

export default PostHeader;
