import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('blog-theme');
        const theme = (savedTheme as 'light' | 'dark') || 'light';
        setColorMode(theme);
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const theme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
                    setColorMode(theme || 'light');
                    if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = useCallback(() => {
        const newMode = colorMode === 'light' ? 'dark' : 'light';
        setColorMode(newMode);
        document.documentElement.setAttribute('data-theme', newMode);
        if (newMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('blog-theme', newMode);
    }, [colorMode]);

    return { colorMode, toggleTheme };
}
