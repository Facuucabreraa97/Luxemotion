-- ADD BILLING COLUMNS
-- Run this in Supabase SQL Editor
-- As per the Pricing Strategy, we need to track when a subscription/quota resets.
-- Adding 'billing_period_end' to profiles.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_period_end timestamptz;
-- Optional: Comments for documentation
COMMENT ON COLUMN public.profiles.plan IS 'Subscription Tier: talent, producer, mogul';
COMMENT ON COLUMN public.profiles.billing_period_end IS 'Date when the current plan credits expire or refresh';