-- Enable Row Level Security on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a secure function to check for admin status without recursion
-- This function uses SECURITY DEFINER to bypass RLS when checking the user's role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- Policy to allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- Basic policy for users to view their own profile (if not already present)
-- Note: The OR clause in the admin policy above handles the "own profile" case for admins,
-- but standard users need a policy too if one doesn't exist.
-- To be safe and avoid conflict, we can add a specific one if needed, or assume the Admin one covers Admins.
-- Usually, a separate policy for "Users can view own profile" is standard:
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
