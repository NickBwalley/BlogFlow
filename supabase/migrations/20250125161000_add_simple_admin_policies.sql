-- Migration: Add simple admin policies for profiles table
-- Purpose: Give admins full CRUD access using a safe approach
-- Affected: public.profiles table RLS policies
-- Date: 2025-01-25 16:10:00 EAT (Africa/Nairobi)

-- Strategy: Use an admin_users table to avoid recursion issues

-- Create a simple admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read admin_users (for checking admin status)
CREATE POLICY "Anyone can view admin users" ON public.admin_users FOR SELECT USING (true);

-- Only existing admins can manage admin_users
CREATE POLICY "Admins can manage admin users" ON public.admin_users 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            JOIN auth.users u ON u.email = au.email
            WHERE u.id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            JOIN auth.users u ON u.email = au.email
            WHERE u.id = auth.uid()
        )
    );

-- Create a safe function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin_by_email()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN auth.users u ON u.email = au.email
    WHERE u.id = auth.uid()
    LIMIT 1
  );
$$;

-- Add admin policies for profiles table using email-based check
CREATE POLICY "Email-based admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (public.is_current_user_admin_by_email() = true);

CREATE POLICY "Email-based admins can insert profiles" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (public.is_current_user_admin_by_email() = true);

CREATE POLICY "Email-based admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (public.is_current_user_admin_by_email() = true)
    WITH CHECK (public.is_current_user_admin_by_email() = true);

CREATE POLICY "Email-based admins can delete all profiles" 
    ON public.profiles 
    FOR DELETE 
    USING (public.is_current_user_admin_by_email() = true);

-- Create helper functions for managing admin users
CREATE OR REPLACE FUNCTION public.add_admin_by_email(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is already admin or if no admins exist yet
  IF public.is_current_user_admin_by_email() OR NOT EXISTS (SELECT 1 FROM public.admin_users) THEN
    INSERT INTO public.admin_users (email, created_by) 
    VALUES (admin_email, auth.uid()) 
    ON CONFLICT (email) DO NOTHING;
    
    RETURN 'Admin added successfully';
  ELSE
    RETURN 'Permission denied: Only admins can add other admins';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_by_email(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF public.is_current_user_admin_by_email() THEN
    DELETE FROM public.admin_users WHERE email = admin_email;
    RETURN 'Admin removed successfully';
  ELSE
    RETURN 'Permission denied: Only admins can remove other admins';
  END IF;
END;
$$;
