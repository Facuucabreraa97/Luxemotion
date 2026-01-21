-- ASEGURAR COLUMNAS EN PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_status text DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- POLÍTICA DE SEGURIDAD (RLS) PARA ADMIN
-- Nota: Habilita RLS si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crea la política (o reemplázala si ya existe, tendrás que borrarla primero manualmente si da error de duplicado)
DROP POLICY IF EXISTS "Admin sees all" ON public.profiles;
CREATE POLICY "Admin sees all" ON public.profiles FOR SELECT USING (auth.email() = 'dmsfak@proton.me');

-- Política para permitir al Admin ACTUALIZAR (Critical for Actions)
DROP POLICY IF EXISTS "Admin updates all" ON public.profiles;
CREATE POLICY "Admin updates all" ON public.profiles FOR UPDATE USING (auth.email() = 'dmsfak@proton.me');
