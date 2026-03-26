import React, { useEffect, useState } from 'react';
import { GamificationService } from '@/services/gamification.service';
import { Achievement } from '@/types';
import { supabase } from '@/lib/supabase';
import { Trophy, Lock, DollarSign, Zap, Eye, Star, TrendingUp, Heart } from 'lucide-react';

// Icon Map helper
const IconMap: Record<string, any> = {
    'DollarSign': DollarSign,
    'Zap': Zap,
    'Eye': Eye,
    'Star': Star,
    'TrendingUp': TrendingUp,
    'Heart': Heart,
    'default': Trophy
};

export const AchievementsGrid = () => {
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [userUnlocked, setUserUnlocked] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;
             
             const [all, stats] = await Promise.all([
                 GamificationService.getAchievements(),
                 GamificationService.getUserStats(user.id)
             ]);
             
             setAllAchievements(all);
             if (stats) setUserUnlocked(stats.achievements);
        };
        load();
    }, []);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {allAchievements.map(achi => {
                const isUnlocked = userUnlocked.includes(achi.id);
                const IconComponent = IconMap[achi.icon_url] || IconMap['default'];

                return (
                    <div key={achi.id} className={`p-4 rounded-xl border flex flex-col items-center text-center gap-3 transition-all ${isUnlocked ? 'bg-gradient-to-br from-white/10 to-transparent border-yellow-500/30' : 'bg-black/40 border-white/5 opacity-50 grayscale'}`}>
                        <div className={`p-3 rounded-full ${isUnlocked ? 'bg-yellow-500/20 text-yellow-500 ring-2 ring-yellow-500/20' : 'bg-white/5 text-gray-500'}`}>
                            {isUnlocked ? <IconComponent size={24} /> : <Lock size={20} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">{achi.title}</h4>
                            <p className="text-[10px] text-gray-400 leading-tight">{achi.description}</p>
                        </div>
                        {isUnlocked && (
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">Unlocked</span>
                        )}
                    </div>
                )
            })}
        </div>
    );
};
