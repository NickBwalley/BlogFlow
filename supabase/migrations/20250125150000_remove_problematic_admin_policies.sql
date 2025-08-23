-- Migration: Remove problematic admin policies causing infinite recursion
-- Purpose: Fix infinite recursion by removing admin policies from profiles table
-- Affected: public.profiles table RLS policies
-- Date: 2025-01-25 15:00:00 EAT (Africa/Nairobi)

-- Remove the admin policies that are causing infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles for any user" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- For admin access to profiles, we'll handle this through server actions only
-- The existing user policies remain:
-- - "Users can view own profile"
-- - "Users can insert own profile" 
-- - "Users can update own profile"
-- - "Users can delete own profile"

-- Clean up the helper functions that might cause issues
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);
DROP FUNCTION IF EXISTS public.check_user_is_admin();

-- Keep only the simpler function for other tables
-- This one is safe because it doesn't trigger policies on profiles table when called from other tables
CREATE OR REPLACE FUNCTION public.is_current_user_admin_safe()
RETURNS boolean AS $$
BEGIN
  -- Use a simple approach that doesn't trigger RLS policies
  -- This will be used for non-profiles tables only
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
EXCEPTION WHEN OTHERS THEN
  -- Return false on any error to be safe
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update other table policies to use the safe function
-- These policies are safe because they don't create circular references

-- Update blogs policies
DROP POLICY IF EXISTS "Admins can view all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can insert blogs for any user" ON public.blogs;

CREATE POLICY "Admins can view all blogs" 
    ON public.blogs 
    FOR SELECT 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can update all blogs" 
    ON public.blogs 
    FOR UPDATE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can delete all blogs" 
    ON public.blogs 
    FOR DELETE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can insert blogs for any user" 
    ON public.blogs 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin_safe() = true);

-- Update subscriptions policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions for any user" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can update all subscriptions" 
    ON public.subscriptions 
    FOR UPDATE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can delete all subscriptions" 
    ON public.subscriptions 
    FOR DELETE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can insert subscriptions for any user" 
    ON public.subscriptions 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin_safe() = true);

-- Update chats policies
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can delete all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can insert chats for any user" ON public.chats;

CREATE POLICY "Admins can view all chats" 
    ON public.chats 
    FOR SELECT 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can update all chats" 
    ON public.chats 
    FOR UPDATE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can delete all chats" 
    ON public.chats 
    FOR DELETE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can insert chats for any user" 
    ON public.chats 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin_safe() = true);

-- Update messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can insert messages for any chat" ON public.messages;

CREATE POLICY "Admins can view all messages" 
    ON public.messages 
    FOR SELECT 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can update all messages" 
    ON public.messages 
    FOR UPDATE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can delete all messages" 
    ON public.messages 
    FOR DELETE 
    USING (public.is_current_user_admin_safe() = true);

CREATE POLICY "Admins can insert messages for any chat" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin_safe() = true);
