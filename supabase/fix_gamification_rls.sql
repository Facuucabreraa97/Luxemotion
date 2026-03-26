-- ============================================================
-- PATCH C: Gamification Tables RLS Lockdown
-- ============================================================
-- PROBLEM: Gamification tables (quests, user_quest_progress,
--          achievements, user_achievements) likely have no RLS,
--          allowing users to fabricate quest completion and 
--          claim rewards from the browser console.
-- FIX:     Enable RLS with read-only policies. All writes 
--          must go through validated RPC functions.
-- ============================================================
-- 1. Enable RLS on all gamification tables
ALTER TABLE IF EXISTS public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;
-- 2. Quests: Read-only for authenticated users (quest definitions)
DROP POLICY IF EXISTS "Quests are read-only" ON public.quests;
CREATE POLICY "Quests are read-only" ON public.quests FOR
SELECT USING (auth.role() = 'authenticated');
-- 3. Achievements: Read-only for authenticated users
DROP POLICY IF EXISTS "Achievements are read-only" ON public.achievements;
CREATE POLICY "Achievements are read-only" ON public.achievements FOR
SELECT USING (auth.role() = 'authenticated');
-- 4. User Quest Progress: Users can only READ their own progress
--    No INSERT/UPDATE/DELETE — must go through RPC
DROP POLICY IF EXISTS "Users read own progress" ON public.user_quest_progress;
CREATE POLICY "Users read own progress" ON public.user_quest_progress FOR
SELECT USING (auth.uid() = user_id);
-- 5. User Achievements: Users can only READ their own achievements
DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
CREATE POLICY "Users read own achievements" ON public.user_achievements FOR
SELECT USING (auth.uid() = user_id);
-- NOTE: With these policies, the client-side gamification.service.ts
-- methods that INSERT/UPDATE (trackAction, claimQuest) will FAIL.
-- This is INTENTIONAL. These operations must be moved to server-side
-- RPC functions before the gamification feature can be re-enabled.
-- The read-only UI (DailyQuests component) will continue to work.