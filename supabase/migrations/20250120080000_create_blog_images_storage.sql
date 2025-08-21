-- Migration: Create storage bucket for blog post images
-- Purpose: Set up a public Supabase storage bucket to store blog post images with RLS policies
-- Affected: storage.buckets, storage.objects policies, public.blogs table
-- Date: 2025-01-20 11:00:00 EAT (Africa/Nairobi)

-- create a public storage bucket for blog post images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images', 
  true,
  5242880, -- 5mb limit per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- note: rls is already enabled on storage.objects by default in supabase

-- rls policy: allow authenticated users to upload images to blog-images bucket
create policy "Authenticated users can upload blog images"
on storage.objects for insert
with check (
  bucket_id = 'blog-images'
  and auth.role() = 'authenticated'
);

-- rls policy: allow authenticated users to update their own uploaded images
create policy "Users can update their own blog images"
on storage.objects for update
using (
  bucket_id = 'blog-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'blog-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- rls policy: allow authenticated users to delete their own uploaded images
create policy "Users can delete their own blog images"
on storage.objects for delete
using (
  bucket_id = 'blog-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- rls policy: allow public read access to all images in blog-images bucket
create policy "Public read access for blog images"
on storage.objects for select
using (bucket_id = 'blog-images');

-- create helper function to get the full url for a blog image
create or replace function public.get_blog_image_url(image_path text)
returns text as $$
begin
  if image_path is null or image_path = '' then
    return null;
  end if;
  
  -- return the full public url for the image
  return 'https://lzumixprwbtxjchwjelc.supabase.co/storage/v1/object/public/blog-images/' || image_path;
end;
$$ language plpgsql;

-- add comment to the function
comment on function public.get_blog_image_url(text) is 
'Helper function to generate full public URLs for blog images stored in the blog-images bucket';

-- update the existing blogs table to add better support for image storage
-- add a new column for storing the bucket path (keeping existing image column for backward compatibility)
alter table public.blogs add column if not exists image_path text;

-- add comment to the new column
comment on column public.blogs.image_path is 
'Path to the image file in the blog-images storage bucket (without the base URL)';

-- create index on image_path for better performance
create index if not exists blogs_image_path_idx on public.blogs(image_path);

-- function to automatically generate image url when image_path is provided
create or replace function public.update_blog_image_url()
returns trigger as $$
begin
  -- if image_path is provided, update the image column with the full url
  if new.image_path is not null and new.image_path != '' then
    new.image := public.get_blog_image_url(new.image_path);
  end if;
  
  return new;
end;
$$ language plpgsql;

-- create trigger to automatically update image url when image_path changes
drop trigger if exists update_blog_image_url_trigger on public.blogs;
create trigger update_blog_image_url_trigger
  before insert or update on public.blogs
  for each row
  execute function public.update_blog_image_url();

-- add comment to the trigger
comment on trigger update_blog_image_url_trigger on public.blogs is 
'Automatically generates the full image URL from image_path when a blog is created or updated';
