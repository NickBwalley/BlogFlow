-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'starter', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  ai_posts_used INTEGER NOT NULL DEFAULT 0,
  ai_posts_limit INTEGER NOT NULL DEFAULT 3,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System-level policies for automatic operations during signup
CREATE POLICY "System can insert subscriptions during signup" 
    ON subscriptions 
    FOR INSERT 
    TO postgres
    WITH CHECK (true);

CREATE POLICY "System can update subscriptions during sync" 
    ON subscriptions 
    FOR UPDATE 
    TO postgres
    USING (true)
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);

-- Function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert subscription with error handling
  INSERT INTO subscriptions (user_id, plan_type, status, ai_posts_limit)
  VALUES (NEW.id, 'free', 'active', 3)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create subscription for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default subscription
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE create_default_subscription();

-- Function to update subscription limits based on plan
CREATE OR REPLACE FUNCTION update_subscription_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type = 'free' THEN
    NEW.ai_posts_limit := 3;
  ELSIF NEW.plan_type = 'starter' THEN
    NEW.ai_posts_limit := 10;
  ELSIF NEW.plan_type = 'pro' THEN
    NEW.ai_posts_limit := 30;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update limits when plan changes
CREATE TRIGGER on_subscription_plan_change
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW 
  WHEN (OLD.plan_type IS DISTINCT FROM NEW.plan_type)
  EXECUTE PROCEDURE update_subscription_limits();

-- Add subscription columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
END $$;

-- Function to sync profiles table when subscription changes
CREATE OR REPLACE FUNCTION sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile if it exists
  UPDATE profiles 
  SET 
    subscription_status = NEW.status,
    subscription_tier = NEW.plan_type,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- If no rows were updated, try to create profile
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, email, subscription_status, subscription_tier)
    SELECT 
      NEW.user_id,
      au.email,
      NEW.status,
      NEW.plan_type
    FROM auth.users au 
    WHERE au.id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
      subscription_status = NEW.status,
      subscription_tier = NEW.plan_type,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Failed to sync profile for user %: %', NEW.user_id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync profile when subscription changes
CREATE TRIGGER on_subscription_change_sync_profile
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW 
  EXECUTE PROCEDURE sync_profile_subscription();