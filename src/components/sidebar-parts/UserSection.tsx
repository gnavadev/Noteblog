import React, { useState, useEffect } from 'react';
import { Mail, LogOut, User, MoreHorizontal, Github, Linkedin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserSection: React.FC = () => {
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
        provider: 'linkedin_oidc',
        options: { redirectTo: getRedirectUrl() }
    });

    return (
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
                                    <AvatarImage src={user.user_metadata?.avatar_url || user.user_metadata?.picture} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-foreground truncate flex-1">
                                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
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
                <div className="py-4 px-6 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        onClick={loginWithGithub}
                        className="w-full justify-start gap-2 h-10"
                    >
                        <Github className="w-4 h-4" />
                        <span className="text-sm">GitHub Login</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={loginWithLinkedin}
                        className="w-full justify-start gap-2 h-10"
                    >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">LinkedIn Login</span>
                    </Button>
                </div>
            )}
        </SidebarMenu>
    );
};

export default UserSection;
