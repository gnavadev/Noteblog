-- =====================================================
-- Post-its Table Migration
-- =====================================================
-- This migration creates the post_its table for the native
-- post-it board feature with Row Level Security policies

-- Create the post_its table
CREATE TABLE IF NOT EXISTS public.post_its (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Removed REFERENCES to allow placeholder IDs in dev
    content TEXT DEFAULT '',
    drawing_data JSONB DEFAULT '[]'::jsonb,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    color TEXT DEFAULT '#ffd700',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the foreign key constraint is removed if it was previously created
ALTER TABLE public.post_its DROP CONSTRAINT IF EXISTS post_its_user_id_fkey;

-- Note: In a production environment, you would typically keep the REFERENCES auth.users(id)
-- but we remove it here to support the request of "no login required" in dev mode
-- via a placeholder UUID.

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS post_its_user_id_idx ON public.post_its(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS post_its_created_at_idx ON public.post_its(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.post_its ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow re-running the script
DROP POLICY IF EXISTS "Anyone can view all post-its" ON public.post_its;
DROP POLICY IF EXISTS "Users can create one post-it, admin unlimited" ON public.post_its;
DROP POLICY IF EXISTS "Users can update own post-its, admin can update any" ON public.post_its;
DROP POLICY IF EXISTS "Users can delete own post-its, admin can delete any" ON public.post_its;

-- Policy 1: Everyone can view all post-its
CREATE POLICY "Anyone can view all post-its"
    ON public.post_its
    FOR SELECT
    USING (true);

-- Policy 2: Users can insert their own, admin unlimited, and anon can insert placeholder in dev
-- Enforces one post-it per user (including anon) unless admin
CREATE POLICY "Users can create one post-it, admin unlimited"
    ON public.post_its
    FOR INSERT
    WITH CHECK (
        (
            -- Admin override: Admin can create unlimited post-its
            (auth.uid() = '403fcc1a-e806-409f-b0da-7623da7b64a1'::uuid)
        )
        OR
        (
            -- Regular users (logged in) or Anon (dev placeholder)
            (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'::uuid)
            AND
            -- Ensure they don't already have one
            NOT EXISTS (
                SELECT 1 FROM public.post_its
                WHERE user_id = public.post_its.user_id
            )
        )
    );

-- Policy 3: Users can update their own post-its, admin can update any, anon can update placeholder
CREATE POLICY "Users can update own post-its, admin can update any"
    ON public.post_its
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = '403fcc1a-e806-409f-b0da-7623da7b64a1'::uuid
        OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.uid() = '403fcc1a-e806-409f-b0da-7623da7b64a1'::uuid
        OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- Policy 4: Users can delete their own post-its, admin can delete any, anon can delete placeholder
CREATE POLICY "Users can delete own post-its, admin can delete any"
    ON public.post_its
    FOR DELETE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = '403fcc1a-e806-409f-b0da-7623da7b64a1'::uuid
        OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_post_its_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
DROP TRIGGER IF EXISTS update_post_its_updated_at_trigger ON public.post_its;
CREATE TRIGGER update_post_its_updated_at_trigger
    BEFORE UPDATE ON public.post_its
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_its_updated_at();

-- Grant permissions
GRANT ALL ON public.post_its TO authenticated;
GRANT ALL ON public.post_its TO anon;
GRANT ALL ON public.post_its TO service_role;

-- Enable realtime for this table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'post_its'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_its;
    END IF;
END $$;

-- Add comment to table for documentation
COMMENT ON TABLE public.post_its IS 'Stores user post-it notes with text content and drawing data for the interactive post-it board';
