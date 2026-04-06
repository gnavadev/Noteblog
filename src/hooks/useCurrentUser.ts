import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/auth-utils';

export function useCurrentUser() {
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

    const loginWithProvider = (provider: 'github' | 'linkedin_oidc') =>
        supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: getAuthRedirectUrl(), scopes: 'openid profile email' }
        });

    const signOut = () => supabase.auth.signOut();

    return { user, loginWithProvider, signOut };
}
