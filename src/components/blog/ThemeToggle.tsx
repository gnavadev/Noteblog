import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from './useTheme';

export const ThemeToggle: React.FC = () => {
    const { colorMode, toggleTheme } = useTheme();

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shadow-lg bg-background/80 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all hover:scale-105 active:scale-95"
            onClick={toggleTheme}
        >
            {colorMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
    );
};
