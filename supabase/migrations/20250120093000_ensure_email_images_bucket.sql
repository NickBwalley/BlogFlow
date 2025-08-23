-- Migration: Ensure email-images storage bucket exists
-- Purpose: Explicitly create email-images bucket with proper error handling
-- Affected: storage.buckets, storage.objects policies
-- Date: 2025-01-20 12:30:00 EAT (Africa/Nairobi)

-- First, check if bucket already exists and delete any existing policies to avoid conflicts
drop policy if exists "Authenticated users can upload email images" on storage.objects;
drop policy if exists "Users can update their own email images" on storage.objects;
drop policy if exists "Users can delete their own email images" on storage.objects;
drop policy if exists "Public read access for email images" on storage.objects;

-- Remove existing bucket if it exists (to recreate cleanly)
delete from storage.buckets where id = 'email-images';

-- Create the email-images storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'email-images',
  'email-images', 
  true,
  10485760, -- 10mb limit per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
);

-- rls policy: allow authenticated users to upload images to email-images bucket
create policy "Authenticated users can upload email images"
on storage.objects for insert
with check (
  bucket_id = 'email-images'
  and auth.role() = 'authenticated'
);

-- rls policy: allow authenticated users to update their own uploaded images
create policy "Users can update their own email images"
on storage.objects for update
using (
  bucket_id = 'email-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'email-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- rls policy: allow authenticated users to delete their own uploaded images
create policy "Users can delete their own email images"
on storage.objects for delete
using (
  bucket_id = 'email-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- rls policy: allow public read access to all images in email-images bucket
create policy "Public read access for email images"
on storage.objects for select
using (bucket_id = 'email-images');

-- create helper function to get the full url for an email image (recreate to ensure it exists)
create or replace function public.get_email_image_url(image_path text)
returns text as $$
begin
  if image_path is null or image_path = '' then
    return null;
  end if;
  
  -- return the full public url for the image
  return 'https://lzumixprwbtxjchwjelc.supabase.co/storage/v1/object/public/email-images/' || image_path;
end;
$$ language plpgsql;

-- add comment to the function
comment on function public.get_email_image_url(text) is 
'Helper function to generate full public URLs for email images stored in the email-images bucket';
