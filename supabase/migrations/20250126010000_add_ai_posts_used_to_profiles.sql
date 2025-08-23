-- Migration: Add ai_posts_used column to profiles table
-- Purpose: Track AI post usage for free users who don't have subscriptions
-- Affected: public.profiles table
-- Date: 2025-01-26 01:00:00

-- Add ai_posts_used column to profiles table for free user tracking
ALTER TABLE public.profiles 
ADD COLUMN ai_posts_used integer DEFAULT 0 NOT NULL
CHECK (ai_posts_used >= 0);

-- Create index for ai_posts_used column for better performance
CREATE INDEX IF NOT EXISTS profiles_ai_posts_used_idx ON public.profiles(ai_posts_used);

-- Update existing profiles to have 0 ai_posts_used
UPDATE public.profiles 
SET ai_posts_used = 0 
WHERE ai_posts_used IS NULL;

-- Update the handle_new_user function to include ai_posts_used default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile with all required fields including role, subscription, and AI usage defaults
  INSERT INTO public.profiles (user_id, email, role, subscription_status, subscription_tier, ai_posts_used)
  VALUES (new.id, new.email, 'user', 'free', 'free', 0)
  ON CONFLICT (user_id) DO UPDATE SET
    email = new.email,
    role = COALESCE(public.profiles.role, 'user'),
    subscription_status = COALESCE(public.profiles.subscription_status, 'free'),
    subscription_tier = COALESCE(public.profiles.subscription_tier, 'free'),
    ai_posts_used = COALESCE(public.profiles.ai_posts_used, 0),
    updated_at = now();
  
  RETURN new;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
