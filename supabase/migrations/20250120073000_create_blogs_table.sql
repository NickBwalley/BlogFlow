-- Migration: Create blogs table
-- Purpose: Set up blogs table with RLS policies, triggers, and slug generation
-- Affected: public.blogs table
-- Date: 2025-01-20 10:30:00 EAT (Africa/Nairobi)

-- create blogs table
create table if not exists public.blogs (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    subtitle text,
    image text,
    content text not null,
    author text not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- enable row level security
alter table public.blogs enable row level security;

-- create rls policies for blogs table
-- policy: anyone can view blogs (public read access)
create policy "Anyone can view blogs" 
    on public.blogs 
    for select 
    using (true);

-- policy: users can insert their own blogs
create policy "Users can insert own blogs" 
    on public.blogs 
    for insert 
    with check (auth.uid() = user_id);

-- policy: users can update their own blogs
create policy "Users can update own blogs" 
    on public.blogs 
    for update 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own blogs
create policy "Users can delete own blogs" 
    on public.blogs 
    for delete 
    using (auth.uid() = user_id);

-- trigger to automatically update updated_at column
create trigger update_blogs_updated_at
    before update on public.blogs
    for each row
    execute function public.handle_updated_at();

-- create indexes for better performance
create index if not exists blogs_user_id_idx on public.blogs(user_id);
create index if not exists blogs_slug_idx on public.blogs(slug);
create index if not exists blogs_created_at_idx on public.blogs(created_at desc);

-- function to generate slug from title
create or replace function public.generate_slug(title text)
returns text as $$
begin
    return lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
end;
$$ language plpgsql;

-- function to ensure unique slug
create or replace function public.ensure_unique_slug()
returns trigger as $$
declare
    base_slug text;
    new_slug text;
    counter integer := 1;
begin
    -- generate base slug from title
    base_slug := public.generate_slug(new.title);
    new_slug := base_slug;
    
    -- check if slug already exists (excluding current record on update)
    while exists (
        select 1 from public.blogs 
        where slug = new_slug 
        and (tg_op = 'INSERT' or id != new.id)
    ) loop
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    end loop;
    
    new.slug := new_slug;
    return new;
end;
$$ language plpgsql;

-- trigger to automatically generate slug before insert/update
create trigger ensure_unique_slug_trigger
    before insert or update on public.blogs
    for each row
    execute function public.ensure_unique_slug();
