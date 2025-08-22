-- Script to set a user as admin
-- Replace 'your-email@example.com' with your actual email address

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT email, role, created_at 
FROM profiles 
WHERE email = 'your-email@example.com';
