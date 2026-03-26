import { supabase } from '@/lib/supabase';
import { Achievement, Quest, UserGamificationStats, UserQuestProgress } from '@/types';

export const GamificationService = {
  // --- READS ---

  async getUserStats(userId: string): Promise<UserGamificationStats | null> {
    // 1. Get Profile Stats
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('xp, level, current_streak')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching gamification stats:', error instanceof Error ? error.message : 'Unknown');
      return null;
    }

    // 2. Get Unlocked Achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    return {
      xp: profile.xp || 0,
      level: profile.level || 1,
      current_streak: profile.current_streak || 0,
      achievements: achievements?.map((a) => a.achievement_id) || [],
    };
  },

  async getQuests(userId: string): Promise<(Quest & { progress?: UserQuestProgress })[]> {
    // 1. Get All Quests
    const { data: quests, error } = await supabase.from('quests').select('*');
    if (error) return [];

    // 2. Get User Progress for TODAY (or current cycle)
    const { data: progress } = await supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', userId);
      // Note: Filtering by date ideally happens here or in DB view, 
      // but for MVP we load all and filter in JS if needed, 
      // or assume the DB only keeps relevant active rows if configured so. 
      // For this implementation, we will map simply.

    return quests.map((q) => {
      const p = progress?.find((up) => up.quest_id === q.id && !this.isExpired(q, up.cycle_start));
      return { ...q, progress: p };
    });
  },

  async getAchievements(): Promise<Achievement[]> {
    const { data } = await supabase.from('achievements').select('*');
    return (data as Achievement[]) || [];
  },

  // --- ACTIONS ---

  async addXP(_userId: string, _amount: number) {
    // DISABLED: Gamification tables are READ-ONLY via RLS (fix_gamification_rls.sql).
    // Requires server-side RPC implementation before reactivation.
    console.warn('[GAMIFICATION] addXP is disabled — requires server-side RPC');
    return;
  },

  async trackAction(_userId: string, _actionCode: string) {
    // DISABLED: Gamification tables are READ-ONLY via RLS (fix_gamification_rls.sql).
    // Requires server-side RPC implementation before reactivation.
    console.warn('[GAMIFICATION] trackAction is disabled — requires server-side RPC');
    return;
  },

  async claimQuest(_userId: string, _questId: string) {
    // DISABLED: Gamification tables are READ-ONLY via RLS (fix_gamification_rls.sql).
    // Requires server-side RPC implementation before reactivation.
    console.warn('[GAMIFICATION] claimQuest is disabled — requires server-side RPC');
    return;
  },

  // Helpers
  isExpired(quest: Quest, startDateStr?: string): boolean {
    if (!startDateStr) return false;
    const start = new Date(startDateStr);
    const now = new Date();
    // Daily: Expire if not same day
    if (quest.frequency === 'DAILY') {
       return start.getDate() !== now.getDate() || start.getMonth() !== now.getMonth();
    }
    // Weekly: Expire if > 7 days
    // ... logic ...
    return false;
  }
};


