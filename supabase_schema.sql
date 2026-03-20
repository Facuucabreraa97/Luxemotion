
-- Update generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Update talents table
ALTER TABLE talents ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';

-- Storage Buckets (These usually need to be created via API or UI, but including SQL just in case extension is available)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;

-- Policies for storage (example)
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Public Access Videos" ON storage.objects FOR SELECT USING ( bucket_id = 'videos' );
CREATE POLICY "Auth Upload Avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
CREATE POLICY "Auth Upload Videos" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'videos' AND auth.role() = 'authenticated' );
