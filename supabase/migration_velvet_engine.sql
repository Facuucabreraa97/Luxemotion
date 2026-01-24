-- 1. AI MODELS (Config Store)
CREATE TABLE IF NOT EXISTS public.ai_models (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    provider_endpoint text NOT NULL,
    api_key_ref text, -- Storing encrypted or reference name
    default_params jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS: Only Admin can manage models
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages models" ON public.ai_models USING (auth.email() = 'dmsfak@proton.me');
CREATE POLICY "Public read active" ON public.ai_models FOR SELECT USING (is_active = true); -- Optional if frontend needs to know features, but maybe restrict

-- 2. GENERATION JOBS (The Queue)
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    model_id uuid REFERENCES public.ai_models(id),
    status text NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    prompt text,
    result_url text,
    error_log text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS: Users see their own jobs, Admin see all
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own jobs" ON public.generation_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin views all jobs" ON public.generation_jobs FOR SELECT USING (auth.email() = 'dmsfak@proton.me');
CREATE POLICY "System/Admin insert jobs" ON public.generation_jobs FOR INSERT WITH CHECK (true); -- Allow inserts (usually via server, so RLS might act diff if using service key)
CREATE POLICY "System update jobs" ON public.generation_jobs FOR UPDATE USING (true); -- Ideally restrict to service role

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON public.generation_jobs(user_id);
