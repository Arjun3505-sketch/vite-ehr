-- Emergency Fix: Add 'doctor' role to existing doctors who don't have it in user_roles
-- Run this ONCE in Supabase SQL Editor to fix existing users

-- Step 1: Add doctor role to all users who have a record in doctors table but no role in user_roles
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT d.user_id, 'doctor'::app_role
FROM doctors d
WHERE d.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = d.user_id AND ur.role = 'doctor'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Verify the fix - This should show all doctors with their roles
SELECT 
  d.id as doctor_id,
  d.name as doctor_name,
  d.user_id,
  ur.role,
  CASE 
    WHEN ur.role = 'doctor' THEN '✅ Has doctor role'
    ELSE '❌ Missing doctor role'
  END as status
FROM doctors d
LEFT JOIN user_roles ur ON d.user_id = ur.user_id AND ur.role = 'doctor'
WHERE d.user_id IS NOT NULL
ORDER BY d.created_at DESC;

-- Step 3: Check if current user has doctor role (replace with your user_id or run with auth.uid())
SELECT 
  ur.role,
  d.id as doctor_id,
  d.name,
  'Can upload files' as permission_status
FROM user_roles ur
LEFT JOIN doctors d ON d.user_id = ur.user_id
WHERE ur.user_id = auth.uid() AND ur.role = 'doctor';

-- If the above returns no rows, your user doesn't have the doctor role yet!
-- After running this script, log out and log back in, or refresh your session.
