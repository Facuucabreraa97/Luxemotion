-- 1. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    amount integer NOT NULL, -- Positive for deposit, Negative for spend
    description text NOT NULL,
    type text NOT NULL, -- 'ADMIN_INJECTION', 'PURCHASE', 'REFUND'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Admin sees all
DROP POLICY IF EXISTS "Admin sees all tx" ON public.transactions;
CREATE POLICY "Admin sees all tx" ON public.transactions FOR SELECT USING (auth.email() = 'dmsfak@proton.me');

-- 4. Policy: Users see their own
DROP POLICY IF EXISTS "Users see own tx" ON public.transactions;
CREATE POLICY "Users see own tx" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 5. ATOMIC RPC FUNCTION
-- This ensures money is never lost or created without a trace.
CREATE OR REPLACE FUNCTION add_credits(
    target_user_id uuid, 
    credit_amount int, 
    reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (Admin)
AS $$
BEGIN
    -- 1. Update Profile Balance
    UPDATE public.profiles 
    SET credits = COALESCE(credits, 0) + credit_amount
    WHERE id = target_user_id;

    -- 2. Insert Transaction Log
    INSERT INTO public.transactions (user_id, amount, description, type)
    VALUES (target_user_id, credit_amount, reason, 'ADMIN_INJECTION');

    -- If any error occurs, specific or generic, Postgres automatically ROLLBACKs the transaction.
END;
$$;
