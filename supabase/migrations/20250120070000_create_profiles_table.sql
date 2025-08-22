-- Migration: Create profiles table
-- Purpose: Set up user profiles table with RLS policies and triggers
-- Affected: public.profiles table, auth.users trigger
-- Date: 2025-01-20 10:00:00 EAT (Africa/Nairobi)

-- create profiles table
create table if not exists public.profiles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade unique not null,
    first_name text,
    avatar_url text,
    email text not null,
    subscription_status text default 'free',
    subscription_tier text default 'free',
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- enable row level security
alter table public.profiles enable row level security;

-- create rls policies for profiles table
-- policy: users can view their own profile
create policy "Users can view own profile" 
    on public.profiles 
    for select 
    using (auth.uid() = user_id);

-- policy: users can insert their own profile
create policy "Users can insert own profile" 
    on public.profiles 
    for insert 
    with check (auth.uid() = user_id);

-- policy: users can update their own profile
create policy "Users can update own profile" 
    on public.profiles 
    for update 
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own profile
create policy "Users can delete own profile" 
    on public.profiles 
    for delete 
    using (auth.uid() = user_id);

-- system-level policies for automatic operations during signup
create policy "System can insert profiles during signup" 
    on public.profiles 
    for insert 
    to postgres
    with check (true);

create policy "System can update profiles during sync" 
    on public.profiles 
    for update 
    to postgres
    using (true)
    with check (true);

-- function to handle updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- trigger to automatically update updated_at column
create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

-- function to automatically create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert profile with all required fields including subscription defaults
  insert into public.profiles (user_id, email, subscription_status, subscription_tier)
  values (new.id, new.email, 'free', 'free')
  on conflict (user_id) do update set
    email = new.email,
    subscription_status = coalesce(public.profiles.subscription_status, 'free'),
    subscription_tier = coalesce(public.profiles.subscription_tier, 'free'),
    updated_at = now();
  
  return new;
exception 
  when others then
    -- Log error but don't fail the signup
    raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

-- trigger to automatically create profile when user signs up
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- create index for better performance
create index if not exists profiles_user_id_idx on public.profiles(user_id);
