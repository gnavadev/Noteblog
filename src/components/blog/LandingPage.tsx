import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, FileText, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com/gnavadev', icon: Github },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gabriel-nava-dev/', icon: Linkedin },
    { label: 'Resume', href: 'https://drive.google.com/file/d/1c4-B4ya3pvI6oEkuEeFBcxsyQtJgWAUA/view', icon: FileText },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 260, damping: 22 }
    }
};

interface LandingPageProps {
    onBrowsePosts: () => void;
    avatarUrl?: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onBrowsePosts, avatarUrl }) => {
    return (
        <div className="h-full overflow-y-auto flex items-center justify-center px-6 py-12">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-xl w-full flex flex-col items-center text-center gap-6"
            >
                <motion.div variants={itemVariants}>
                    <Avatar className="h-28 w-28 bg-primary ring-4 ring-primary/15 shadow-xl transition-transform hover:scale-105">
                        <AvatarImage src={avatarUrl || '/GabrielPhoto.jpg'} alt="Gabriel Nava" />
                        <AvatarFallback className="text-white text-3xl">G</AvatarFallback>
                    </Avatar>
                </motion.div>

                <motion.h1
                    variants={itemVariants}
                    className="text-4xl font-bold font-sketch tracking-wide text-foreground"
                >
                    Hi, I'm Gabriel!
                </motion.h1>

                <motion.div variants={itemVariants} className="space-y-3 text-[0.95rem] leading-relaxed text-foreground/90">
                    <p>
                        Welcome to my corner of the internet — part blog, part digital notebook
                        (I call it <span className="font-bold text-primary">NoteBlog</span>).
                        I'm a software developer who enjoys poking at security, hardware,
                        and whatever tech rabbit hole finds me next.
                    </p>
                    <p>
                        Here you'll find the projects I'm building, LeetCode write-ups, hot takes,
                        games I'm playing, and anything else that feels worth sharing. The topics in
                        the sidebar work like folders in a notes app — click around and see what
                        catches your eye.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center gap-4">
                    {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={label}
                            className="flex flex-col items-center gap-1.5 group"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all duration-300 group-hover:scale-110 group-hover:border-primary group-hover:text-primary">
                                <Icon className="h-6 w-6" />
                            </span>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                {label}
                            </span>
                        </a>
                    ))}
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Button
                        onClick={onBrowsePosts}
                        className="rounded-full px-6 h-11 font-bold shadow-md hover:scale-105 transition-all duration-300"
                    >
                        Browse my posts
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
