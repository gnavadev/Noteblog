import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import { isAdmin } from '../lib/auth-utils';

/** Minimal context shape shared by Astro Actions handlers */
type ActionCtx = {
    request: Request;
    cookies: AstroCookies;
};

function createActionSupabase(context: ActionCtx) {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new ActionError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server configuration error',
        });
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return parseCookieHeader(context.request.headers.get('Cookie') ?? '')
                    .filter((c): c is { name: string; value: string } => c.value !== undefined);
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    context.cookies.set(name, value, options);
                });
            },
        },
    });
}

async function requireUser(context: ActionCtx) {
    const supabase = createActionSupabase(context);
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) {
        throw new ActionError({
            code: 'UNAUTHORIZED',
            message: 'Sign in to continue.',
        });
    }
    return { supabase, user };
}

export const server = {
    createComment: defineAction({
        input: z.object({
            postId: z.string().min(1),
            content: z.string().trim().min(1).max(5000),
            parentId: z.string().min(1).nullable().optional(),
        }),
        handler: async (input, context) => {
            const { supabase, user } = await requireUser(context);
            const { error } = await supabase.from('comments').insert([
                {
                    post_id: input.postId,
                    content: input.content,
                    user_id: user.id,
                    user_metadata: user.user_metadata,
                    parent_id: input.parentId ?? null,
                },
            ]);
            if (error) {
                throw new ActionError({
                    code: 'BAD_REQUEST',
                    message: error.message,
                });
            }
            return { ok: true as const };
        },
    }),

    editComment: defineAction({
        input: z.object({
            commentId: z.string().min(1),
            content: z.string().trim().min(1).max(5000),
        }),
        handler: async (input, context) => {
            const { supabase, user } = await requireUser(context);
            const { error } = await supabase
                .from('comments')
                .update({ content: input.content })
                .eq('id', input.commentId)
                .eq('user_id', user.id);
            if (error) {
                throw new ActionError({
                    code: 'BAD_REQUEST',
                    message: error.message,
                });
            }
            return { ok: true as const };
        },
    }),

    deleteComment: defineAction({
        input: z.object({
            commentId: z.string().min(1),
        }),
        handler: async (input, context) => {
            const { supabase, user } = await requireUser(context);
            // RLS should enforce ownership/admin; admin path uses pin-style admin check client-side
            let query = supabase.from('comments').delete().eq('id', input.commentId);
            if (!isAdmin(user.id)) {
                query = query.eq('user_id', user.id);
            }
            const { error } = await query;
            if (error) {
                throw new ActionError({
                    code: 'BAD_REQUEST',
                    message: error.message,
                });
            }
            return { ok: true as const };
        },
    }),

    pinComment: defineAction({
        input: z.object({
            commentId: z.string().min(1),
            isPinned: z.boolean(),
        }),
        handler: async (input, context) => {
            const { supabase, user } = await requireUser(context);
            if (!isAdmin(user.id)) {
                throw new ActionError({
                    code: 'FORBIDDEN',
                    message: 'Only the author can pin comments.',
                });
            }
            const { error } = await supabase
                .from('comments')
                .update({ is_pinned: input.isPinned })
                .eq('id', input.commentId);
            if (error) {
                throw new ActionError({
                    code: 'BAD_REQUEST',
                    message: error.message,
                });
            }
            return { ok: true as const };
        },
    }),
};
