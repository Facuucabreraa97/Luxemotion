import React, { useEffect, useState } from 'react';
import { GamificationService } from '@/services/gamification.service';
import { supabase } from '@/lib/supabase';
import { Sparkles, Trophy } from 'lucide-react';

export const LevelProgress = () => {
  const [stats, setStats] = useState({ xp: 0, level: 1, current_streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const s = await GamificationService.getUserStats(user.id);
      if (s) setStats(s);
      setLoading(false);
    };
    load();
    
    // Listen for XP changes if we had realtime, 
    // for now we rely on mount or parent triggers.
    // Ideally we'd subscribe to 'profiles' changes.
  }, []);

  if (loading) return <div className="h-10 w-32 bg-white/5 animate-pulse rounded-full" />;

  // Calculate Progress to next level
  // Level L requires 100 * (L-1)^2 XP ? 
  // No, we used: Level = floor(sqrt(XP/100)) + 1
  // So Next Level L+1 requires:
  // XP = (L)^2 * 100
  const nextLevelXP = Math.pow(stats.level, 2) * 100;
  const currentLevelBaseXP = Math.pow(stats.level - 1, 2) * 100;
  
  const progressPercent = Math.min(100, Math.max(0, 
    ((stats.xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100
  ));

  return (
    <div className="flex items-center gap-3 bg-[#111] border border-white/10 px-4 py-2 rounded-full">
      <div className="relative">
        <Trophy size={16} className="text-yellow-500" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold">
            {stats.level}
        </span>
      </div>
      
      <div className="flex flex-col w-24 md:w-32">
        <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 mb-1">
            <span>Lvl {stats.level}</span>
            <span>{Math.floor(stats.xp)} / {nextLevelXP} XP</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
            />
        </div>
      </div>
      
      {stats.current_streak > 0 && (
          <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-orange-400">
               <Sparkles size={10} /> {stats.current_streak} Day Streak
          </div>
      )}
    </div>
  );
};
