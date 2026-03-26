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
  Mail,
  Languages,
  Cpu,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminService, AdminStats, AdminUserView } from '@/services/admin.service';
import { PaymentService } from '@/services/payment.service';
import { useToast } from '@/modules/core/ui/Toast';
import { PromptHistoryTab } from './admin/PromptHistoryTab';
import { PaymentConfigTab } from './admin/PaymentConfigTab';
import { PaymentApprovalsTab } from './admin/PaymentApprovalsTab';
import { TranslationsTab } from './admin/TranslationsTab';
import { ModelsTab } from './admin/ModelsTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { MarketplaceManageTab } from './admin/MarketplaceManageTab';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'analytics' | 'overview' | 'users' | 'whitelist' | 'prompts' | 'pay_config' | 'pay_approvals' | 'translations' | 'models' | 'marketplace_mgr'>('analytics');
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return navigate('/login');

        // ── SERVER-SIDE ADMIN VERIFICATION ──
        const { data: adminProfile, error: adminCheckError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (adminCheckError || !adminProfile?.is_admin) {
          console.error('Admin verification failed — access denied');
          return navigate('/app/studio');
        }

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
    if (!window.confirm('Are you sure you want to perform this action?'))
      return;
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
  const approvedUsers = users.filter((u) => u.whitelist_status === 'approved');

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
          {/* ── NEW: Analytics (default tab) ── */}
          <SidebarItem
            icon={<TrendingUp size={18} />}
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />

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

          <div className="border-t border-white/10 my-3" />

          <SidebarItem
            icon={<Languages size={18} />}
            label="Translations"
            active={activeTab === 'translations'}
            onClick={() => setActiveTab('translations')}
          />
          <SidebarItem
            icon={<Cpu size={18} />}
            label="Models"
            active={activeTab === 'models'}
            onClick={() => setActiveTab('models')}
          />

          {/* ── NEW: Marketplace Manager ── */}
          <SidebarItem
            icon={<ShoppingBag size={18} />}
            label="Marketplace"
            active={activeTab === 'marketplace_mgr'}
            onClick={() => setActiveTab('marketplace_mgr')}
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
                <h2 className="text-2xl font-bold capitalize">{activeTab.replace('pay_', 'Payment ').replace('marketplace_mgr', 'Marketplace Manager').replace('_', ' ')}</h2>
                <p className="text-gray-500">Real-time system metrics and controls</p>
              </div>
              <button
                onClick={() => setRefreshTrigger((p) => p + 1)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </header>

            {/* ── NEW: ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <AnalyticsTab />
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                  <p className="text-gray-500 text-xs mb-1">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                  <p className="text-gray-500 text-xs mb-1">Approved Users</p>
                  <p className="text-3xl font-bold text-emerald-400">{stats.approvedUsers}</p>
                </div>
                <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                  <p className="text-gray-500 text-xs mb-1">Total Credits</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalCredits?.toLocaleString()}</p>
                </div>
                <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                  <p className="text-gray-500 text-xs mb-1">Total Generations</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.totalGenerations}</p>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                <div className="relative mb-6">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-gray-500 text-xs">
                          Credits: {user.credits?.toLocaleString()} | Status:{' '}
                          {user.whitelist_status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          title="Add 100 Credits"
                          onClick={() =>
                            handleAction(
                              () => AdminService.updateCredits(user.email, 100),
                              '+100 CR'
                            )
                          }
                          className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        >
                          <CreditCard size={14} />
                        </button>
                        <button
                          title={user.is_banned ? 'Unban' : 'Ban'}
                          onClick={() =>
                            handleAction(
                              () =>
                                AdminService.toggleBan(user.email, !user.is_banned),
                              user.is_banned ? 'Unbanned' : 'Banned'
                            )
                          }
                          className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20"
                        >
                          <Ban size={14} />
                        </button>
                        <button
                          title="Delete User"
                          onClick={() =>
                            handleAction(
                              () => AdminService.deleteUser(user.email),
                              'User deleted'
                            )
                          }
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WHITELIST TAB */}
            {activeTab === 'whitelist' && (
              <div className="bg-[#111] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold mb-4">
                  Pending ({pendingRequests.length})
                </h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500">No pending requests</p>
                ) : (
                  <>
                    {pendingRequests.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-2"
                      >
                        <div>
                          <p className="text-white">{user.email}</p>
                          <p className="text-gray-600 text-xs">
                            {user.last_sign_in_at
                              ? `Last login: ${new Date(user.last_sign_in_at).toLocaleDateString()}`
                              : 'Never logged in'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAction(
                                () => AdminService.approveUser(user.email),
                                'User approved!'
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition flex items-center gap-1.5"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              handleAction(
                                () => AdminService.rejectUser(user.email),
                                'User rejected'
                              )
                            }
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition flex items-center gap-1.5"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <h3 className="text-lg font-bold mt-8 mb-4">
                  Approved ({approvedUsers.length})
                </h3>
                {approvedUsers.length === 0 ? (
                  <p className="text-gray-500">No approved users yet</p>
                ) : (
                  <>
                    {approvedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-2"
                      >
                        <div>
                          <p className="text-white flex items-center gap-2">
                            {user.email}
                            <ShieldCheck size={14} className="text-emerald-400" />
                          </p>
                          <p className="text-gray-600 text-xs">
                            {user.last_sign_in_at
                              ? `Last login: ${new Date(user.last_sign_in_at).toLocaleDateString()}`
                              : 'Never logged in'}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAction(
                              () => AdminService.sendWelcomeEmail(user.email),
                              'Invite re-sent!'
                            )
                          }
                          className="px-3 py-1.5 bg-white/5 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/10 transition flex items-center gap-1.5"
                        >
                          <Mail size={14} /> Re-send Invite
                        </button>
                      </div>
                    ))}
                  </>
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

            {/* TRANSLATIONS CMS TAB */}
            {activeTab === 'translations' && (
              <TranslationsTab />
            )}

            {/* MODELS CONFIG TAB */}
            {activeTab === 'models' && (
              <ModelsTab />
            )}

            {/* ── NEW: ANALYTICS TAB ── */}
            {activeTab === 'marketplace_mgr' && (
              <MarketplaceManageTab />
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
        ? 'bg-white/10 text-white border border-white/10'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium">{label}</span>
    </div>
    {count > 0 && (
      <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
        {count}
      </span>
    )}
  </button>
);

// Admin Route Guard
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!data?.is_admin) {
        navigate('/app/studio');
        return;
      }
      setIsAdmin(true);
    };
    check();
  }, [navigate]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
        Verifying Admin Access...
      </div>
    );
  }

  return <>{children}</>;
};
