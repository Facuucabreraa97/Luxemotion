import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Star, Crown, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionInfo {
  plan_tier: string;
  billing_cycle: string;
  current_period_end: string | null;
  is_active: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  talent:   <Star size={14} className="text-gray-400" />,
  producer: <Zap size={14} className="text-amber-400" />,
  mogul:    <Crown size={14} className="text-purple-400" />,
};

const PLAN_COLORS: Record<string, string> = {
  talent:   'border-gray-500/30 bg-gray-500/5',
  producer: 'border-amber-500/30 bg-amber-500/5',
  mogul:    'border-purple-500/30 bg-purple-500/5',
};

const PLAN_BAR_COLORS: Record<string, string> = {
  talent:   'from-gray-400 to-gray-600',
  producer: 'from-amber-400 to-amber-600',
  mogul:    'from-purple-400 to-purple-600',
};

export const PlanStatusWidget = () => {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('plan_tier, billing_cycle, current_period_end, is_active')
        .eq('id', user.id)
        .single();

      if (data) setSub(data as SubscriptionInfo);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="h-16 bg-white/5 animate-pulse rounded-xl" />;

  // No active plan or free tier
  if (!sub || !sub.is_active || sub.plan_tier === 'free' || !sub.current_period_end) {
    return (
      <Link
        to="/app/billing"
        className="block px-4 py-3 mt-2 bg-white/5 border border-dashed border-white/10 rounded-xl text-center hover:bg-white/10 hover:border-white/20 transition group"
      >
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
          No Active Plan
        </span>
        <div className="text-xs text-gray-400 mt-1 group-hover:text-white transition">
          <Zap size={12} className="inline mr-1" />
          Get a Membership
        </div>
      </Link>
    );
  }

  const tier = sub.plan_tier;
  const endDate = new Date(sub.current_period_end);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = sub.billing_cycle === 'yearly' ? 365 : 30;
  const progressPercent = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  const isExpiring = daysLeft <= 5;
  const isExpired = daysLeft === 0;

  const formattedDate = endDate.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });

  return (
    <div className={`px-4 py-3 mt-2 rounded-xl border transition ${PLAN_COLORS[tier] || 'border-white/10 bg-white/5'} ${isExpiring && !isExpired ? 'animate-pulse' : ''}`}>
      {/* Plan name */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {PLAN_ICONS[tier] || <Zap size={14} />}
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {tier.toUpperCase()}
          </span>
          <span className="text-[9px] text-gray-600 font-mono">
            {sub.billing_cycle === 'yearly' ? 'ANNUAL' : 'MONTHLY'}
          </span>
        </div>
      </div>

      {/* Time bar */}
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${
            isExpiring
              ? 'from-red-500 to-red-700'
              : PLAN_BAR_COLORS[tier] || 'from-blue-400 to-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between">
        {isExpired ? (
          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
            <AlertTriangle size={10} /> Expired
          </span>
        ) : isExpiring ? (
          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
            <AlertTriangle size={10} /> {daysLeft}d left!
          </span>
        ) : (
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock size={10} /> {daysLeft}d — {formattedDate}
          </span>
        )}

        {(isExpiring || isExpired) && (
          <Link
            to="/app/billing"
            className="flex items-center gap-1 text-[9px] font-bold uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 hover:bg-red-500/30 transition"
          >
            <RefreshCw size={8} /> Renew
          </Link>
        )}
      </div>
    </div>
  );
};
