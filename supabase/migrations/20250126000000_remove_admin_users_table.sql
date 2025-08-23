-- Migration: Remove admin_users table and use only profile.role for admin access
-- Purpose: Simplify admin system by using only the role field in profiles table
-- Affected: admin_users table, related functions, and policies
-- Date: 2025-01-26 00:00:00

-- Drop all policies that reference admin_users table
DROP POLICY IF EXISTS "Email-based admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Email-based admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Email-based admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Email-based admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

-- Drop functions that reference admin_users table
DROP FUNCTION IF EXISTS public.is_current_user_admin_by_email();
DROP FUNCTION IF EXISTS public.add_admin_by_email(text);
DROP FUNCTION IF EXISTS public.remove_admin_by_email(text);

-- Drop the admin_users table
DROP TABLE IF EXISTS public.admin_users;

-- Create a simple function to check if current user is admin using profile.role
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
    LIMIT 1
  );
$$;

-- Create admin policies for profiles table using role-based check
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert profiles" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true)
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all profiles" 
    ON public.profiles 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

-- Drop existing admin policies for blogs table if they exist
DROP POLICY IF EXISTS "Admins can view all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update all blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete all blogs" ON public.blogs;

-- Create admin policies for blogs table
CREATE POLICY "Admins can view all blogs" 
    ON public.blogs 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert blogs" 
    ON public.blogs 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all blogs" 
    ON public.blogs 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true)
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all blogs" 
    ON public.blogs 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

-- Drop existing admin policies for chats table if they exist
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can update all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can delete all chats" ON public.chats;

-- Create admin policies for chats table
CREATE POLICY "Admins can view all chats" 
    ON public.chats 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert chats" 
    ON public.chats 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all chats" 
    ON public.chats 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true)
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all chats" 
    ON public.chats 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

-- Drop existing admin policies for subscriptions table if they exist
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON public.subscriptions;

-- Create admin policies for subscriptions table
CREATE POLICY "Admins can view all subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (public.is_current_user_admin() = true);

CREATE POLICY "Admins can insert subscriptions" 
    ON public.subscriptions 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can update all subscriptions" 
    ON public.subscriptions 
    FOR UPDATE 
    USING (public.is_current_user_admin() = true)
    WITH CHECK (public.is_current_user_admin() = true);

CREATE POLICY "Admins can delete all subscriptions" 
    ON public.subscriptions 
    FOR DELETE 
    USING (public.is_current_user_admin() = true);

-- Create a helper function to promote a user to admin (can only be called by existing admins or if no admins exist)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Check if there are any existing admins
  SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin';
  
  -- Allow promotion if caller is admin OR if no admins exist yet
  IF public.is_current_user_admin() OR admin_count = 0 THEN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now() 
    WHERE user_id = target_user_id;
    
    IF FOUND THEN
      RETURN 'User promoted to admin successfully';
    ELSE
      RETURN 'User not found';
    END IF;
  ELSE
    RETURN 'Permission denied: Only admins can promote users';
  END IF;
END;
$$;

-- Create a helper function to demote an admin to user (can only be called by admins)
CREATE OR REPLACE FUNCTION public.demote_admin_to_user(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF public.is_current_user_admin() THEN
    UPDATE public.profiles 
    SET role = 'user', updated_at = now() 
    WHERE user_id = target_user_id AND role = 'admin';
    
    IF FOUND THEN
      RETURN 'Admin demoted to user successfully';
    ELSE
      RETURN 'Admin user not found';
    END IF;
  ELSE
    RETURN 'Permission denied: Only admins can demote other admins';
  END IF;
END;
$$;
