-- Update existing blog records to use correct image URLs
-- This fixes any existing blogs that have the placeholder URL

-- Update blogs that have image_path but wrong image URL
UPDATE public.blogs 
SET image = public.get_blog_image_url(image_path)
WHERE image_path IS NOT NULL 
  AND image_path != ''
  AND (image IS NULL OR image LIKE '%your-project-ref%');

-- Also trigger the function for any blogs that should have image URLs generated
UPDATE public.blogs 
SET updated_at = updated_at
WHERE image_path IS NOT NULL 
  AND image_path != ''
  AND (image IS NULL OR image = '');
