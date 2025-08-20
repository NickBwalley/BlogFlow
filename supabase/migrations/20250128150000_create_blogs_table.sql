-- Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subtitle TEXT,
    image TEXT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view all published blogs (public read access)
CREATE POLICY "Anyone can view blogs" 
    ON public.blogs 
    FOR SELECT 
    USING (true);

-- Users can insert their own blogs
CREATE POLICY "Users can insert own blogs" 
    ON public.blogs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own blogs
CREATE POLICY "Users can update own blogs" 
    ON public.blogs 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own blogs
CREATE POLICY "Users can delete own blogs" 
    ON public.blogs 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at column
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS blogs_user_id_idx ON public.blogs(user_id);
CREATE INDEX IF NOT EXISTS blogs_slug_idx ON public.blogs(slug);
CREATE INDEX IF NOT EXISTS blogs_created_at_idx ON public.blogs(created_at DESC);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to ensure unique slug
CREATE OR REPLACE FUNCTION public.ensure_unique_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug from title
    base_slug := public.generate_slug(NEW.title);
    new_slug := base_slug;
    
    -- Check if slug already exists (excluding current record on update)
    WHILE EXISTS (
        SELECT 1 FROM public.blogs 
        WHERE slug = new_slug 
        AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate slug before insert/update
CREATE TRIGGER ensure_unique_slug_trigger
    BEFORE INSERT OR UPDATE ON public.blogs
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_unique_slug();
