import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Github, Linkedin } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const getRedirectUrl = () => {
        // Use current window origin for all environments (localhost in dev, vercel in prod)
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return "https://noteblog-self.vercel.app/";
    };

    const loginWithGithub = () => supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: getRedirectUrl() }
    });
    const loginWithLinkedin = () => supabase.auth.signInWithOAuth({
        provider: 'linkedin',
        options: { redirectTo: getRedirectUrl() }
    });

    if (user) return null;

    return (
        <div className="px-6 flex flex-col gap-2">
            <Button variant="outline" onClick={loginWithGithub} className="w-full justify-start gap-2">
                <Github className="w-4 h-4" />
                GitHub Login
            </Button>
            <Button variant="outline" onClick={loginWithLinkedin} className="w-full justify-start gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn Login
            </Button>
        </div>
    );
};

export default Auth;
