-- Migration: Backup fix for admin profiles policies if recursion occurs
-- Purpose: Replace complex admin policies with simpler function-based ones if needed
-- Affected: public.profiles table RLS policies
-- Date: 2025-01-25 14:10:00 EAT (Africa/Nairobi)

-- This migration provides an alternative approach if the previous policies cause recursion
-- Only run the commands below if you experience infinite recursion errors

-- Step 1: Create a more robust admin check function that avoids recursion
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS boolean AS $$
DECLARE
  current_user_id UUID;
  user_role text;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Use a direct query with explicit user ID to avoid policy recursion
  EXECUTE format('SELECT role FROM public.profiles WHERE user_id = %L LIMIT 1', current_user_id) 
  INTO user_role;
  
  -- Return true if user is admin
  RETURN COALESCE(user_role, 'user') = 'admin';
  
EXCEPTION WHEN OTHERS THEN
  -- Return false on any error to be safe
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The policies from the previous migration should work fine.
-- This migration provides backup functions in case they don't.
-- If you experience recursion errors, manually run these commands:

-- MANUAL COMMANDS TO RUN IF RECURSION OCCURS:
-- (Copy and paste these into Supabase SQL editor if needed)

/*

-- Drop the complex policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles for any user" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Create new admin policies using the safe function
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (public.check_user_is_admin());

CREATE POLICY "Admins can insert profiles for any user" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (public.check_user_is_admin())
    WITH CHECK (public.check_user_is_admin());

CREATE POLICY "Admins can delete all profiles" 
    ON public.profiles 
    FOR DELETE 
    USING (public.check_user_is_admin());

*/
