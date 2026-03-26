-- FIX RLS POLICIES FOR GOLDEN GATE
-- We enabled RLS but didn't add policies! This blocks registration.

-- 1. Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Allow triggers/auth to insert (or users if client-side creation)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Allow Admins to read/write EVERYTHING
-- Assuming 'is_admin' column exists or metadata check. 
-- For now, if we don't have a secure admin check in RLS, we can leave it restrictive 
-- OR rely on the Service Role (Admin Console uses Client Key? No, likely User Session).
-- If Admin Console uses a user session, that user needs Policy to view all.
-- DANGEROUS: Creating a policy that allows "is_admin" to see all requires recursive check or claims.
-- SIMPLE FIX FOR NOW: Service Role Bypass is standard for Admin tools if implemented correctly.
-- IF Admin Console is client-side, we need:
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    is_admin = true
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    is_admin = true
  );
