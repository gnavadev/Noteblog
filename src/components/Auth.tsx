import React, { useState, useEffect } from 'react';
import { Button, Avatar, Space, Dropdown, Typography, Menu } from 'antd';
import { GithubOutlined, LinkedinOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
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

    const loginWithGithub = () => supabase.auth.signInWithOAuth({ provider: 'github' });
    const loginWithLinkedin = () => supabase.auth.signInWithOAuth({ provider: 'linkedin' });
    const logout = () => supabase.auth.signOut();

    if (user) return null;

    return (
        <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button icon={<GithubOutlined />} onClick={loginWithGithub} block>
                GitHub Login
            </Button>
            <Button icon={<LinkedinOutlined />} onClick={loginWithLinkedin} block>
                LinkedIn Login
            </Button>
        </div>
    );
};

export default Auth;
