-- Migration: Create storage bucket for user avatar images
-- Purpose: Set up a public Supabase storage bucket to store user profile avatars with RLS policies
-- Affected: storage.buckets, storage.objects policies
-- Date: 2025-01-21 14:00:00 EAT (Africa/Nairobi)

-- First, check if bucket already exists and delete any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own user avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for user avatars" ON storage.objects;

-- Remove existing bucket if it exists (to recreate cleanly)
DELETE FROM storage.buckets WHERE id = 'user-avatars';

-- Create the user-avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars', 
  true,
  2097152, -- 2MB limit per file (suitable for profile pictures)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policy: allow authenticated users to upload images to user-avatars bucket
CREATE POLICY "Authenticated users can upload user avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: allow authenticated users to update their own uploaded avatars
CREATE POLICY "Users can update their own user avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: allow authenticated users to delete their own uploaded avatars
CREATE POLICY "Users can delete their own user avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policy: allow public read access to all avatars in user-avatars bucket
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Create helper function to get the full URL for a user avatar
CREATE OR REPLACE FUNCTION public.get_user_avatar_url(avatar_path text)
RETURNS text AS $$
BEGIN
  IF avatar_path IS NULL OR avatar_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Return the full public URL for the avatar
  RETURN concat(
    current_setting('app.supabase_url', true),
    '/storage/v1/object/public/user-avatars/',
    avatar_path
  );
END;
$$ LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_avatar_url(text) IS 
'Helper function to generate full public URLs for user avatars stored in the user-avatars bucket';
