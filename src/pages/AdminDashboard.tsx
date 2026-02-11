import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Search,
  Check,
  X,
  Trash2,
  Ban,
  ShieldCheck,
  RefreshCw,
  LogOut,
  History,
  CreditCard as CreditCardIcon,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminService, AdminStats, AdminUserView } from '@/services/admin.service';
import { PaymentService } from '@/services/payment.service';
import { useToast } from '@/modules/core/ui/Toast';
import { PromptHistoryTab } from './admin/PromptHistoryTab';
import { PaymentConfigTab } from './admin/PaymentConfigTab';
import { PaymentApprovalsTab } from './admin/PaymentApprovalsTab';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'whitelist' | 'prompts' | 'pay_config' | 'pay_approvals'>('overview');
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Check Admin Access (Frontend check only, backend is secured strictly)
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return navigate('/login');

        // Parallel Fetch
        const [statsData, usersData] = await Promise.all([
          AdminService.getStats(),
          AdminService.getUsers(),
        ]);

        setStats(statsData);
        setUsers(usersData || []);

        // Fetch pending payment count for badge
        const pendingPay = await PaymentService.getPendingPayments();
        setPendingPaymentsCount(pendingPay.length);
      } catch (e) {
        console.error(e);
        toast('Failed to load admin data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, refreshTrigger, navigate, toast]);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    if (!window.confirm('Are you sure you want to perform this action?')) return;
    try {
      await action();
      toast(successMessage, 'success');
      setRefreshTrigger((prev) => prev + 1); // Reload data
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Action Failed';
      toast(message, 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.whitelist_status === searchTerm.toLowerCase()
  );

  const pendingRequests = users.filter((u) => u.whitelist_status === 'pending');

  return (
    <div className="min-h-screen bg-black text-white font-sans flex text-sm">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-white/10">
          <img src="/branding/logo-white.png" alt="MivideoAI" className="h-6 mb-3" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2">
            GOD MODE
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />

          <SidebarItem
            icon={<Users size={18} />}
            label="User Management"
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />
          <SidebarItem
            icon={<UserPlus size={18} />}
            label="Waitlist Requests"
            count={pendingRequests.length}
            active={activeTab === 'whitelist'}
            onClick={() => setActiveTab('whitelist')}
          />
          <SidebarItem
            icon={<History size={18} />}
            label="Prompt History"
            active={activeTab === 'prompts'}
            onClick={() => setActiveTab('prompts')}
          />

          <div className="border-t border-white/10 my-3" />

          <SidebarItem
            icon={<Settings size={18} />}
            label="Payment Config"
            active={activeTab === 'pay_config'}
            onClick={() => setActiveTab('pay_config')}
          />
          <SidebarItem
            icon={<CreditCardIcon size={18} />}
            label="Payment Approvals"
            count={pendingPaymentsCount}
            active={activeTab === 'pay_approvals'}
            onClick={() => setActiveTab('pay_approvals')}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition w-full p-2 rounded-lg hover:bg-white/5"
          >
            <LogOut size={16} /> Exit to App
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {loading && !stats ? (
          <div className="text-center mt-20 text-gray-500 animate-pulse">
            Initializing Admin Core...
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-2xl font-bold capitalize">{activeTab.replace('pay_', 'Payment ').replace('_', ' ')}</h2>
                <p className="text-gray-500">Real-time system metrics and controls</p>
              </div>
              <button
                onClick={() => setRefreshTrigger((p) => p + 1)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </header>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Total Approved Users"
                  value={stats.total_users}
                  icon={<Users className="text-blue-500" />}
                />
                <StatCard
                  label="Pending Requests"
                  value={stats.pending_requests}
                  icon={<UserPlus className="text-yellow-500" />}
                />
                <StatCard
                  label="Credits vs Liabilities"
                  value={stats.total_credits}
                  icon={<CreditCard className="text-emerald-500" />}
                />
                <StatCard
                  label="Active (24h)"
                  value={stats.active_users_24h}
                  icon={<ShieldCheck className="text-purple-500" />}
                />
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Search email..."
                      className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-white/30 transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Credits</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {filteredUsers.map((user) => (
                        <tr key={user.email} className="hover:bg-white/5 transition group">
                          <td className="p-4">
                            <div className="font-medium text-white">{user.email}</div>
                            <div className="text-xs text-gray-500">
                              {user.user_id || 'Not Registered'}
                            </div>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={user.whitelist_status} />
                          </td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">
                            {user.credits || 0}
                          </td>
                          <td className="p-4 text-gray-500">
                            {new Date(user.applied_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <ActionBtn
                              icon={<CreditCard size={14} />}
                              tooltip="Manage Credits"
                              onClick={() => {
                                const amountStr = window.prompt(
                                  `Enter credits to add/remove for ${user.email} (Use negative for removal):`,
                                  '100'
                                );
                                if (!amountStr) return;
                                const amount = parseInt(amountStr);
                                if (isNaN(amount)) return alert('Invalid number');

                                handleAction(
                                  () => AdminService.updateCredits(user.email, amount),
                                  `Successfully updated credits by ${amount}`
                                );
                              }}
                              color="text-emerald-400 hover:bg-emerald-400/10"
                            />
                            <ActionBtn
                              icon={<Ban size={14} />}
                              tooltip={user.whitelist_status === 'rejected' ? 'Unban' : 'Ban User'}
                              onClick={() =>
                                handleAction(
                                  () =>
                                    AdminService.toggleBan(
                                      user.email,
                                      user.whitelist_status !== 'rejected'
                                    ),
                                  'Ban Status toggled'
                                )
                              }
                              color="text-orange-400 hover:bg-orange-400/10"
                            />
                            <ActionBtn
                              icon={<Trash2 size={14} />}
                              tooltip="Delete User"
                              onClick={() =>
                                handleAction(
                                  () => AdminService.deleteUser(user.email),
                                  'User Deleted'
                                )
                              }
                              color="text-red-500 hover:bg-red-500/10"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WHITELIST TAB */}
            {activeTab === 'whitelist' && (
              <div className="grid grid-cols-1 gap-4">
                {pendingRequests.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 bg-[#111] rounded-xl border border-white/10">
                    No pending requests. All caught up!
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req.email}
                      className="bg-[#111] p-6 rounded-xl border border-white/10 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-lg">{req.email}</h3>
                        <p className="text-gray-500 text-xs">
                          Applied: {new Date(req.applied_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleAction(
                              () => AdminService.toggleBan(req.email, false),
                              'Approved!'
                            )
                          }
                          className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition flex items-center gap-2"
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button
                          onClick={() =>
                            handleAction(() => AdminService.toggleBan(req.email, true), 'Rejected')
                          }
                          className="px-4 py-2 bg-white/5 text-white font-bold rounded-lg hover:bg-red-500/20 hover:text-red-500 transition flex items-center gap-2"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PROMPTS TAB */}
            {activeTab === 'prompts' && (
              <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                <PromptHistoryTab />
              </div>
            )}

            {/* PAYMENT CONFIG TAB */}
            {activeTab === 'pay_config' && (
              <PaymentConfigTab />
            )}

            {/* PAYMENT APPROVALS TAB */}
            {activeTab === 'pay_approvals' && (
              <PaymentApprovalsTab />
            )}
          </>
        )}
      </main>
    </div>
  );
};

// --- Subcomponents ---

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

const SidebarItem = ({ icon, label, active, onClick, count = 0 }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
      active
        ? 'bg-white text-black font-bold shadow-lg shadow-white/10'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}</span>
    </div>
    {count > 0 && (
      <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

const StatCard = ({ label, value, icon }: StatCardProps) => (
  <div className="bg-[#111] p-6 rounded-xl border border-white/10 hover:border-white/20 transition group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</h3>
      <div className="p-2 bg-white/5 rounded-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold font-display">{value}</div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    approved: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${colors[status as keyof typeof colors] || colors.pending}`}
    >
      {status}
    </span>
  );
};

interface ActionBtnProps {
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  tooltip: string;
}

const ActionBtn = ({ icon, onClick, color, tooltip }: ActionBtnProps) => (
  <button onClick={onClick} title={tooltip} className={`p-2 rounded-lg transition ${color}`}>
    {icon}
  </button>
);
