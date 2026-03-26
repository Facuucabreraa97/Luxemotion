// src/pages/admin/AnalyticsTab.tsx
// Business Intelligence Dashboard — Admin Only
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Coins, Video, ShoppingBag, TrendingUp,
  AlertTriangle, Cpu, Activity, RefreshCw
} from 'lucide-react';

interface DashboardData {
  success: boolean;
  users?: {
    total: number;
    admins: number;
    active_plans: number;
    whitelisted?: number;
    new_last_7d?: number;
    new_last_30d?: number;
  };
  credits?: {
    total_in_circulation: number;
    avg_per_user: number;
    total_approved_revenue: number;
    pending_review_count: number;
    pending_review_credits?: number;
  };
  generations?: {
    total: number;
    succeeded: number;
    failed: number;
    processing?: number;
    total_credits_spent: number;
    last_7d?: number;
    by_tier?: Array<{ tier: string; count: number; credits_spent: number }>;
    by_model?: Array<{ model: string; count: number }>;
  };
  marketplace?: {
    total_assets: number;
    drafts: number;
    listed_for_sale: number;
    total_sales: number;
    avg_price?: number;
  };
  system?: {
    active_master: string;
    active_draft: string;
    active_image: string;
    cron_jobs_active?: number;
    success_rate?: number;
    zombie_gens?: number;
  };
  top_creators?: Array<{
    email: string;
    credits: number;
    plan_tier: string;
    gen_count: number;
    asset_count: number;
    total_sales: number;
  }>;
  revenue_timeline?: Array<{ day: string; credits_approved: number; tx_count: number }>;
  generation_timeline?: Array<{ day: string; total: number; succeeded: number; failed: number; credits_consumed: number }>;
  payment_methods?: Array<{ payment_method: string; count: number; total_credits: number; approved: number; pending: number }>;
}

// ── Stat Card Component ──
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}> = ({ icon, label, value, sub, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="opacity-60">{icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
};

// ── Mini Bar Chart ──
const MiniBar: React.FC<{ data: Array<{ label: string; value: number }>; color?: string }> = ({ data, color = '#3b82f6' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              backgroundColor: color,
              opacity: 0.7,
              minHeight: '2px',
            }}
          />
          <span className="text-[9px] text-gray-600 mt-1 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Component ──
export const AnalyticsTab: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/admin-dashboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch dashboard');
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-500" size={24} />
        <span className="ml-3 text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="mx-auto text-red-400 mb-2" size={24} />
        <p className="text-red-400">{error}</p>
        <button onClick={fetchDashboard} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-red-300 text-sm hover:bg-red-500/30">
          Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const u = d.users || { total: 0, admins: 0, active_plans: 0 };
  const c = d.credits || { total_in_circulation: 0, avg_per_user: 0, total_approved_revenue: 0, pending_review_count: 0 };
  const g = d.generations || { total: 0, succeeded: 0, failed: 0, total_credits_spent: 0 };
  const m = d.marketplace || { total_assets: 0, drafts: 0, listed_for_sale: 0, total_sales: 0 };
  const s = d.system || { active_master: '-', active_draft: '-', active_image: '-' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Business Intelligence</h2>
          <p className="text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 text-sm transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Users size={16} />} label="Users" value={u.total} sub={`${u.active_plans} on paid plans`} color="blue" />
        <StatCard icon={<Coins size={16} />} label="CR in circulation" value={c.total_in_circulation} sub={`Avg ${c.avg_per_user} per user`} color="green" />
        <StatCard icon={<TrendingUp size={16} />} label="Revenue (CR)" value={c.total_approved_revenue} sub={`${c.pending_review_count} pending`} color="purple" />
        <StatCard icon={<Video size={16} />} label="Generations" value={g.total} sub={`${g.succeeded} succeeded`} color="cyan" />
        <StatCard icon={<ShoppingBag size={16} />} label="Assets" value={m.total_assets + m.drafts} sub={`${m.listed_for_sale} for sale`} color="amber" />
        <StatCard icon={<Activity size={16} />} label="Success Rate" value={`${s.success_rate || 0}%`} sub={`${s.zombie_gens || 0} zombies`} color={g.failed > g.succeeded ? 'red' : 'green'} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Generation by Tier */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Cpu size={14} /> Generation Breakdown
          </h3>
          {g.by_tier && g.by_tier.length > 0 ? (
            <div className="space-y-2">
              {g.by_tier.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 capitalize">{t.tier || 'unknown'}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">{t.count} gen{t.count !== 1 ? 's' : ''}</span>
                    <span className="text-gray-500">{t.credits_spent} CR</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No generation data yet</p>
          )}
        </div>

        {/* Active Models */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Cpu size={14} /> Active Models
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Master</span>
              <span className="text-white font-medium">{s.active_master}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Draft</span>
              <span className="text-white font-medium">{s.active_draft}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Image</span>
              <span className="text-white font-medium">{s.active_image}</span>
            </div>
            {s.cron_jobs_active !== undefined && (
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-gray-400">Cron Jobs</span>
                <span className="text-emerald-400 font-medium">{s.cron_jobs_active} active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Creators */}
      {d.top_creators && d.top_creators.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Top Creators</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left pb-2">Email</th>
                  <th className="text-right pb-2">Credits</th>
                  <th className="text-right pb-2">Gens</th>
                  <th className="text-right pb-2">Assets</th>
                  <th className="text-right pb-2">Sales</th>
                  <th className="text-right pb-2">Plan</th>
                </tr>
              </thead>
              <tbody>
                {d.top_creators.map((creator, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-2 text-gray-300 max-w-[200px] truncate">{creator.email}</td>
                    <td className="py-2 text-right text-white font-medium">{Number(creator.credits).toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-400">{creator.gen_count}</td>
                    <td className="py-2 text-right text-gray-400">{creator.asset_count}</td>
                    <td className="py-2 text-right text-gray-400">{creator.total_sales}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        creator.plan_tier === 'mogul' ? 'bg-amber-500/20 text-amber-300' :
                        creator.plan_tier === 'producer' ? 'bg-purple-500/20 text-purple-300' :
                        creator.plan_tier === 'talent' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {creator.plan_tier || 'free'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marketplace Stats */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <ShoppingBag size={14} /> Marketplace Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">{m.total_assets}</p>
            <p className="text-xs text-gray-500">Published</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{m.drafts}</p>
            <p className="text-xs text-gray-500">Drafts</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{m.listed_for_sale}</p>
            <p className="text-xs text-gray-500">Listed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{m.total_sales}</p>
            <p className="text-xs text-gray-500">Total Sales</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{m.avg_price || 0} CR</p>
            <p className="text-xs text-gray-500">Avg Price</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {d.payment_methods && d.payment_methods.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Payment Methods</h3>
          <div className="space-y-2">
            {d.payment_methods.map((pm, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 capitalize">{pm.payment_method?.replace(/_/g, ' ') || 'Unknown'}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">{pm.approved} approved</span>
                  <span className="text-amber-400">{pm.pending} pending</span>
                  <span className="text-gray-400">{pm.total_credits} CR total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
