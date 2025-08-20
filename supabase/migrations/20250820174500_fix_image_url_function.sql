-- Fix the get_blog_image_url function to use correct project reference
-- This updates the function that was still using the placeholder URL

CREATE OR REPLACE FUNCTION public.get_blog_image_url(image_path text)
RETURNS text AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Return the full public URL for the image with correct project reference
  RETURN 'https://lzumixprwbtxjchwjelc.supabase.co/storage/v1/object/public/blog-images/' || image_path;
END;
$$ LANGUAGE plpgsql;
