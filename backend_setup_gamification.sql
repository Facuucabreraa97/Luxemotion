-- GAMIFICATION SETUP SCRIPT
-- Run this in Supabase SQL Editor
-- 1. EXTEND PROFILES
-- Add XP, Level, Streak trackers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;
-- 2. EXTEND TALENTS (For "Realism Tycoon" Achievement)
-- Add Realism Score
ALTER TABLE public.talents
ADD COLUMN IF NOT EXISTS realism_score float DEFAULT 0;
-- 3. CREATE ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon_url text,
    -- Lucide icon name or URL
    xp_reward integer DEFAULT 0
);
-- 4. CREATE USER_ACHIEVEMENTS (Tracking unlocks)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id uuid REFERENCES auth.users NOT NULL,
    achievement_id uuid REFERENCES public.achievements NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);
-- 5. CREATE QUESTS TABLE
CREATE TABLE IF NOT EXISTS public.quests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    frequency text CHECK (frequency IN ('DAILY', 'WEEKLY', 'EPIC')),
    title text NOT NULL,
    target_count integer DEFAULT 1,
    xp_reward integer DEFAULT 0,
    credits_reward integer DEFAULT 0
);
-- 6. CREATE USER_QUEST_PROGRESS
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
    user_id uuid REFERENCES auth.users NOT NULL,
    quest_id uuid REFERENCES public.quests NOT NULL,
    current_count integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    is_claimed boolean DEFAULT false,
    cycle_start date DEFAULT CURRENT_DATE,
    PRIMARY KEY (user_id, quest_id, cycle_start)
);
-- 7. ENABLE RLS (Security)
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
-- Allow users to read their own achievements/progress
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can view own quest progress" ON public.user_quest_progress FOR
SELECT USING (auth.uid() = user_id);
-- Depending on architecture, you might need INSERT/UPDATE policies if frontend writes directly,
-- or keep it strict if only Postgres Functions/Edge Functions write. 
-- For MVP/Service Layer approach:
DROP POLICY IF EXISTS "Users can update own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can update own quest progress" ON public.user_quest_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own quest progress" ON public.user_quest_progress;
CREATE POLICY "Users can insert own quest progress" ON public.user_quest_progress FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- 8. SEED DATA (Achievements & Quests)
-- Clean existing to avoid duplicates if re-running
DELETE FROM public.achievements;
DELETE FROM public.quests;
-- Seed Achievements
INSERT INTO public.achievements (code, title, description, xp_reward, icon_url)
VALUES (
        'ENTREPRENEUR',
        'Entrepreneur',
        'Make your first sale',
        500,
        'DollarSign'
    ),
    (
        'FLASH_SALES',
        'Flash Sales',
        'Sell an influencer within 24h of publishing',
        300,
        'Zap'
    ),
    (
        'REALISM_TYCOON',
        'Realism Tycoon',
        'Own 3 influencers with Realism Score > 9.5',
        1000,
        'Eye'
    ),
    (
        'STAR_COLLECTOR',
        'Star Collector',
        'Buy 5 different influencers',
        800,
        'Star'
    ),
    (
        'MILLIONAIRE_VISION',
        'Millionaire Vision',
        'Reach 1M volume in sales',
        5000,
        'TrendingUp'
    ),
    (
        'INFLUENCER',
        'Influencer',
        'Get 100 Likes on your profile',
        600,
        'Heart'
    );
-- Seed Quests
INSERT INTO public.quests (
        code,
        frequency,
        title,
        target_count,
        xp_reward,
        credits_reward
    )
VALUES -- Daily
    (
        'DAILY_GEN_3',
        'DAILY',
        'Generate 3 Images',
        3,
        30,
        0
    ),
    (
        'DAILY_IMPROVE_DESC',
        'DAILY',
        'Improve an Influencer Description',
        1,
        50,
        0
    ),
    -- Weekly
    (
        'WEEKLY_LIKE_REMIX',
        'WEEKLY',
        'Receive a Like on a Remix',
        1,
        100,
        10
    ),
    (
        'WEEKLY_PUBLISH_5',
        'WEEKLY',
        'Publish 5 Assets',
        5,
        200,
        20
    ),
    -- Epic
    (
        'EPIC_TRANSACTION',
        'EPIC',
        'Complete a Buy/Sell Transaction',
        1,
        1000,
        100
    );