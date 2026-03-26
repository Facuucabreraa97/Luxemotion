-- ASEGURAR COLUMNAS EN PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- TELEMETRY COLUMNS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_info text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS traffic_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- POLÍTICA DE SEGURIDAD (RLS) PARA ADMIN
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin sees all" ON public.profiles;
CREATE POLICY "Admin sees all" ON public.profiles FOR SELECT USING (auth.email() = 'dmsfak@proton.me');

DROP POLICY IF EXISTS "Admin updates all" ON public.profiles;
CREATE POLICY "Admin updates all" ON public.profiles FOR UPDATE USING (auth.email() = 'dmsfak@proton.me');

-- Allow Users to update their own telemetry on login
DROP POLICY IF EXISTS "Users update own" ON public.profiles;
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
