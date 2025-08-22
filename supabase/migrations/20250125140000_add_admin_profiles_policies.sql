-- Migration: Add admin policies for profiles table operations
-- Purpose: Allow admins to perform all CRUD operations on profiles table
-- Affected: public.profiles table RLS policies
-- Date: 2025-01-25 14:00:00 EAT (Africa/Nairobi)

-- Create admin policies for profiles table using a different approach to avoid recursion
-- We'll use a subquery that directly checks the role without causing circular dependency

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT user_id FROM public.profiles p 
                WHERE p.role = 'admin' AND p.user_id = auth.uid()
            )
        )
    );

-- Admin can insert profiles for any user
CREATE POLICY "Admins can insert profiles for any user" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT user_id FROM public.profiles p 
                WHERE p.role = 'admin' AND p.user_id = auth.uid()
            )
        )
    );

-- Admin can update all profiles
CREATE POLICY "Admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT user_id FROM public.profiles p 
                WHERE p.role = 'admin' AND p.user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT user_id FROM public.profiles p 
                WHERE p.role = 'admin' AND p.user_id = auth.uid()
            )
        )
    );

-- Admin can delete all profiles
CREATE POLICY "Admins can delete all profiles" 
    ON public.profiles 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id IN (
                SELECT user_id FROM public.profiles p 
                WHERE p.role = 'admin' AND p.user_id = auth.uid()
            )
        )
    );

-- Alternative approach: Create a safer admin check function that uses a different method
-- This function will be used if the above policies still cause issues

CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- If no user_uuid provided, use current authenticated user
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the role directly using the provided UUID
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- If the above policies cause recursion, we can replace them with these simpler ones:
-- (Commented out for now, uncomment if needed)

/*
-- Drop the complex policies if they cause issues
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles for any user" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Create simpler admin policies using the function
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (public.is_user_admin());

CREATE POLICY "Admins can insert profiles for any user" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (public.is_user_admin())
    WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can delete all profiles" 
    ON public.profiles 
    FOR DELETE 
    USING (public.is_user_admin());
*/
