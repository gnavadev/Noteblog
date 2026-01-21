import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WelcomeDialog: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenWelcome', 'true');
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-background/95 backdrop-blur-xl border-border/60 shadow-2xl rounded-xl [&>button]:hidden">
                <DialogHeader className="flex flex-col items-center gap-1 py-1">
                    <DialogTitle className="text-2xl font-bold text-center font-['Architects_Daughter'] tracking-wide text-foreground">
                        Welcome!
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm leading-snug text-foreground px-2">
                    <p>
                        This is my <span className="font-bold text-primary"> blog / digital notebook / whatever you want to call it (I call it NoteBlog)</span>.
                        The inspiration for this comes from various note-taking apps I've used over the years, and I found that it would be fun to have a blog that works like a digital notebook.
                    </p>

                    <div>
                        <h4 className="font-bold text-base mb-0.5">What's here?</h4>
                        <p className="opacity-90">
                            Everything, honestly. Food I've tried, weird tech I'm messing with, bizarre corners of the internet (there's literally a website that worships an LLM as a god, search for MakingElle on GitHub if you want to go down that rabbit hole), books, games, projects I'm working on, whatever feels worth sharing.
                        </p>
                    </div>

                    <p className="opacity-90">
                        The <span className="font-bold">topics in the sidebar</span> work like folders in a notes app, and the posts are the notes inside them. Click around, see what catches your eye. If you've got thoughts or suggestions, drop a comment on any post.
                    </p>

                    <p className="opacity-90">
                        The <span className="font-bold text-amber-600 dark:text-amber-500">post-it board is live</span>.
                        Leave your mark, you can type or draw whatever you want. Just a heads up: you need to be authenticated to use it, and <span className="font-bold text-destructive">DO NOT, I REPEAT, DO NOT DRAW NASTY THINGS</span>. Thank you.
                    </p>

                    <p className="text-muted-foreground text-xs italic">
                        Still tweaking things here and there. My dog's 3D model is in progress on Blockbench, and once he's done, he'll be here to annoy you like he annoys me daily.
                    </p>

                    <div className="pt-2 text-center">
                        <p className="italic font-['Architects_Daughter'] text-base">
                            I hope you have fun here!
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">— Gabriel Nava</p>
                    </div>
                </div>

                <DialogFooter className="mt-1 sm:justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-1/2 h-9 text-sm font-bold text-primary-foreground rounded-full shadow-md hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80"
                    >
                        Click Me
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WelcomeDialog;
