-- Golden Gate Authorization Schema
-- Adds status tracking for Waitlist -> Approved -> Active flow

-- Create Enum for User Status
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'ACTIVE');

-- Add status column to profiles (assuming profiles table exists and is linked to auth.users)
-- If profiles doesn't exist, we create a basic version.
CREATE TABLE IF NOT EXISTS public.profiles (
  id TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status user_status DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- If profiles exists, we add the column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status user_status DEFAULT 'PENDING';
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all statuses. Users can seeing their own is tricky if they are not logged in.
-- For the Login check, we might need a Public RPC function to check status without exposing all data.

-- Function to check user status (Publicly accessible for Login flow)
CREATE OR REPLACE FUNCTION check_user_status(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (Admin)
AS $$
DECLARE
  u_status TEXT;
BEGIN
  SELECT status::TEXT INTO u_status FROM public.profiles WHERE email = user_email;
  RETURN u_status;
END;
$$;
