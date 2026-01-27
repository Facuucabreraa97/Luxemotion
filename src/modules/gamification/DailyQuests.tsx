import React, { useEffect, useState } from 'react';
import { GamificationService } from '@/services/gamification.service';
import { Quest, UserQuestProgress } from '@/types';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Circle, Gift } from 'lucide-react';

export const DailyQuests = () => {
    const [quests, setQuests] = useState<(Quest & { progress?: UserQuestProgress })[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const q = await GamificationService.getQuests(user.id);
        // Filter mainly for Daily/Weekly active ones
        setQuests(q);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleClaim = async (questId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        try {
            await GamificationService.claimQuest(user.id, questId);
            // Reload to show claimed state
            await load();
            alert("Reward Claimed!"); // Replace with Toast
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-2">Daily Quests</h3>
            <div className="grid gap-3">
                {quests.map(q => {
                    const p = q.progress;
                    const isCompleted = p?.is_completed || false;
                    const isClaimed = p?.is_claimed || false;
                    const current = p?.current_count || 0;
                    const percent = Math.min(100, (current / q.target_count) * 100);

                    return (
                        <div key={q.id} className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}>
                                    {isClaimed ? <CheckCircle2 size={16} /> : (isCompleted ? <Gift size={16} className="animate-bounce" /> : <Circle size={16} />)}
                                </div>
                                <div>
                                    <h4 className={`text-sm font-medium ${isClaimed ? 'text-gray-500 line-through' : 'text-white'}`}>{q.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">{current}/{q.target_count}</span>
                                        <span className="text-[10px] font-bold text-yellow-500 ml-2">+{q.xp_reward} XP</span>
                                    </div>
                                </div>
                            </div>

                            {isCompleted && !isClaimed && (
                                <button 
                                    onClick={() => handleClaim(q.id)}
                                    className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg hover:scale-105 transition-transform"
                                >
                                    Claim
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
