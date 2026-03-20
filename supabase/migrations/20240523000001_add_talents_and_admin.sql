/*
  Migration: Add talents table and admin flag
  Description: Adds is_admin to profiles, creates talents table, and sets up RLS.
  Created at: 2024-05-23
*/

-- Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create talents table
CREATE TABLE IF NOT EXISTS talents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  dna_prompt text,
  role text DEFAULT 'model',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies (Ensure they exist or create if not)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END
$$;

-- Talents Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'talents'
        AND policyname = 'Users can view own talents'
    ) THEN
        CREATE POLICY "Users can view own talents" ON talents
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'talents'
        AND policyname = 'Users can insert own talents'
    ) THEN
        CREATE POLICY "Users can insert own talents" ON talents
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'talents'
        AND policyname = 'Users can delete own talents'
    ) THEN
        CREATE POLICY "Users can delete own talents" ON talents
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;
