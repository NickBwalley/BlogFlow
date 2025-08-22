-- Migration: Fix admin policies to prevent infinite recursion
-- Purpose: Remove problematic admin policies that cause infinite recursion and simplify signup process
-- Affected: public.profiles table RLS policies, auth trigger functions
-- Date: 2025-01-25 13:00:00 EAT (Africa/Nairobi)

-- First, drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Drop system policies that allow automatic updates (as per user request)
DROP POLICY IF EXISTS "System can insert profiles during signup" ON public.profiles;
DROP POLICY IF EXISTS "System can update profiles during sync" ON public.profiles;

-- Update the handle_new_user function to only set essential defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with minimal required fields and role/subscription defaults
  INSERT INTO public.profiles (user_id, email, role, subscription_status, subscription_tier)
  VALUES (new.id, new.email, 'user', 'free', 'free')
  ON CONFLICT (user_id) DO UPDATE SET
    email = new.email,
    updated_at = now();
  
  RETURN new;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler admin check function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Use a direct query with the authenticated user's ID
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(current_user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create better admin policies for other tables that don't reference profiles table
-- These will work because they don't create circular dependencies

-- Admin policies for blogs table
DROP POLICY IF EXISTS "Admins can view all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can insert blogs for any user" ON public.blogs;

CREATE POLICY "Admins can view all blogs" 
    ON public.blogs 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all blogs" 
    ON public.blogs 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all blogs" 
    ON public.blogs 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert blogs for any user" 
    ON public.blogs 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

-- Admin policies for subscriptions table
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions for any user" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all subscriptions" 
    ON public.subscriptions 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all subscriptions" 
    ON public.subscriptions 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert subscriptions for any user" 
    ON public.subscriptions 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

-- Admin policies for chats table
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can delete all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can insert chats for any user" ON public.chats;

CREATE POLICY "Admins can view all chats" 
    ON public.chats 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all chats" 
    ON public.chats 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all chats" 
    ON public.chats 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert chats for any user" 
    ON public.chats 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

-- Admin policies for messages table
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can insert messages for any chat" ON public.messages;

CREATE POLICY "Admins can view all messages" 
    ON public.messages 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all messages" 
    ON public.messages 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all messages" 
    ON public.messages 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert messages for any chat" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

-- For profiles table, we'll handle admin access differently in the application layer
-- Keep only the basic user policies for profiles table
-- The existing policies "Users can view own profile", "Users can insert own profile", 
-- "Users can update own profile", "Users can delete own profile" remain active

-- Update the helper functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_user_role();

-- Create a simpler role getter that won't cause recursion issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
