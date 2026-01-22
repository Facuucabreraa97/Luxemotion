import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Zap, Crown, Ban, Check, X, Terminal, Activity, DollarSign, Ghost } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Configuration (mirroring App.tsx)
const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  url = url.replace(/\/$/, "");
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const API_URL = getApiUrl();
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

const AdminPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>(['> System initialized...', '> Waiting for input...']);

  const addLog = (msg: string) => setLogs(prev => [`> ${msg}`, ...prev.slice(0, 9)]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!search) return;

    setLoading(true);
    addLog(`Searching for "${search}"...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog("Error: No session found.");
        return;
      }

      const res = await fetch(`${API_URL}/admin/users?email=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setUsers(data);
      addLog(`Found ${data.length} users.`);
    } catch (err) {
      console.error(err);
      addLog("Error: Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = async (userId: string, newAmount: number) => {
    setActionLoading(`${userId}-credits`);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${API_URL}/admin/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId, credits: newAmount })
      });

      if (!res.ok) throw new Error();

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: newAmount } : u));
      addLog(`Updated credits for ${userId} to ${newAmount}`);
    } catch (e) {
      addLog("Error updating credits");
    } finally {
      setActionLoading(null);
    }
  };

  const togglePlan = async (userId: string, currentPlan: string) => {
    setActionLoading(`${userId}-plan`);
    const plans = ['starter', 'creator', 'agency'];
    const nextPlan = plans[(plans.indexOf(currentPlan) + 1) % plans.length];

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${API_URL}/admin/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId, plan: nextPlan })
      });

      if (!res.ok) throw new Error();

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: nextPlan } : u));
      addLog(`Changed plan for ${userId} to ${nextPlan.toUpperCase()}`);
    } catch (e) {
      addLog("Error updating plan");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVelvet = async (userId: string, currentStatus: boolean) => {
    setActionLoading(`${userId}-velvet`);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Since velvet_access might not be in UserProfile type strictly in frontend but is in DB
      // We assume the backend handles the toggling
      const res = await fetch(`${API_URL}/admin/velvet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId, status: !currentStatus })
      });

      if (!res.ok) throw new Error();

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, velvet_access: !currentStatus } : u));
      addLog(`${!currentStatus ? 'GRANTED' : 'REVOKED'} Velvet access for ${userId}`);
    } catch (e) {
      addLog("Error toggling velvet");
    } finally {
      setActionLoading(null);
    }
  };

  const banUser = async (userId: string) => {
     if (!confirm("Are you sure you want to BAN this user? This action interacts with Auth.")) return;
     setActionLoading(`${userId}-ban`);
     try {
       const { data: { session } } = await supabase.auth.getSession();
       const res = await fetch(`${API_URL}/admin/ban`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
         body: JSON.stringify({ userId })
       });

       if (!res.ok) throw new Error();

       addLog(`User ${userId} has been banned.`);
       setUsers(prev => prev.filter(u => u.id !== userId));
     } catch (e) {
       addLog("Error banning user");
     } finally {
       setActionLoading(null);
     }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8 selection:bg-green-900 selection:text-white">
      <div className="max-w-7xl mx-auto">

        {}
        <header className="flex justify-between items-center mb-12 border-b border-green-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-widest uppercase">God Mode</h1>
              <p className="text-xs text-green-700 mt-1 tracking-[0.5em]">INTERNAL ADMIN CONSOLE</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="px-6 py-2 border border-green-900 rounded hover:bg-green-900/20 transition-colors text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Terminal size={14} /> Exit Console
          </button>
        </header>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {}
          <div className="lg:col-span-2">
            <div className="bg-black border border-green-800 rounded-xl p-6 shadow-[0_0_30px_rgba(0,255,0,0.05)]">
              <h2 className="text-xs uppercase tracking-widest text-green-700 mb-4 flex items-center gap-2"><Search size={14}/> User Database Search</h2>
              <form onSubmit={handleSearch} className="flex gap-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter user email..."
                  className="flex-1 bg-green-900/10 border border-green-900 p-4 rounded text-green-400 placeholder:text-green-900 outline-none focus:border-green-500 transition-colors"
                />
                <button type="submit" disabled={loading} className="px-8 bg-green-900/20 border border-green-700 text-green-500 hover:bg-green-500 hover:text-black transition-all uppercase font-bold tracking-wider text-xs rounded">
                  {loading ? 'Scanning...' : 'Execute'}
                </button>
              </form>
            </div>
          </div>

          {}
          <div className="bg-black border border-green-900 rounded-xl p-4 font-mono text-xs h-40 overflow-hidden relative">
             <div className="absolute top-2 right-2 text-[10px] text-green-800">SYS.LOG</div>
             <div className="space-y-1 opacity-80 mt-4">
               {logs.map((log, i) => (
                 <div key={i} className="truncate">{log}</div>
               ))}
             </div>
             <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
          </div>
        </div>

        {}
        <div className="bg-green-900/5 border border-green-900/50 rounded-xl overflow-hidden">
           <div className="p-4 border-b border-green-900/50 bg-green-900/10 flex justify-between items-center">
             <span className="text-xs uppercase tracking-widest text-green-600">Query Results</span>
             <span className="text-xs uppercase tracking-widest text-green-800">{users.length} RECORDS FOUND</span>
           </div>

           {users.length === 0 ? (
             <div className="p-12 text-center text-green-900 text-sm uppercase tracking-widest">
                No data available. Initiate search sequence.
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-green-900/30 text-[10px] uppercase tracking-widest text-green-700">
                     <th className="p-6 font-normal">User ID / Email</th>
                     <th className="p-6 font-normal">Status</th>
                     <th className="p-6 font-normal">Credits</th>
                     <th className="p-6 font-normal">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                   {users.map((user) => (
                     <tr key={user.id} className="border-b border-green-900/10 hover:bg-green-900/5 transition-colors group">
                       <td className="p-6">
                         <div className="font-bold text-green-400">{user.email}</div>
                         <div className="text-[10px] text-green-800 mt-1 font-mono">{user.id}</div>
                       </td>
                       <td className="p-6">
                         <div className="flex flex-col gap-2 items-start">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${user.plan === 'agency' ? 'border-purple-500 text-purple-400' : (user.plan === 'creator' ? 'border-blue-500 text-blue-400' : 'border-green-800 text-green-700')}`}>
                                {user.plan}
                            </span>
                            {user.velvet_access && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase border border-pink-500 text-pink-500 flex items-center gap-1">
                                    <Ghost size={8} /> Velvet
                                </span>
                            )}
                         </div>
                       </td>
                       <td className="p-6 font-mono text-xl">
                         {user.credits}
                       </td>
                       <td className="p-6">
                         <div className="flex items-center gap-2">
                           {}
                           <div className="flex items-center bg-green-900/20 rounded border border-green-900/30 p-1 gap-1">
                              <button onClick={() => updateCredits(user.id, user.credits - 50)} disabled={!!actionLoading} className="p-1 hover:bg-green-900/40 text-green-600 hover:text-green-400 transition-colors text-[10px]">-50</button>
                              <input
                                type="number"
                                className="w-16 bg-black border border-green-900 text-green-500 text-[10px] p-1 text-center outline-none focus:border-green-500"
                                placeholder={user.credits}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = parseInt((e.target as HTMLInputElement).value);
                                        if (!isNaN(val)) updateCredits(user.id, val);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                              />
                              <button onClick={() => updateCredits(user.id, user.credits + 50)} disabled={!!actionLoading} className="p-1 hover:bg-green-900/40 text-green-600 hover:text-green-400 transition-colors text-[10px]">+50</button>
                           </div>

                           {}
                           <button
                             onClick={() => togglePlan(user.id, user.plan)}
                             disabled={!!actionLoading}
                             title="Toggle Plan"
                             className="p-2.5 rounded border border-blue-900/30 text-blue-600 hover:bg-blue-900/20 hover:text-blue-400 transition-all"
                           >
                             <Crown size={16} />
                           </button>

                           {}
                           <button
                             onClick={() => toggleVelvet(user.id, user.velvet_access)}
                             disabled={!!actionLoading}
                             title="Toggle Velvet Mode"
                             className={`p-2.5 rounded border transition-all ${user.velvet_access ? 'border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]' : 'border-pink-900/30 text-pink-900 hover:text-pink-600 hover:border-pink-600'}`}
                           >
                             <Ghost size={16} />
                           </button>

                           {}
                           <button
                              onClick={() => banUser(user.id)}
                              disabled={!!actionLoading}
                              title="Ban User"
                              className="p-2.5 rounded border border-red-900/30 text-red-900 hover:bg-red-900/20 hover:text-red-500 transition-all ml-4"
                           >
                             <Ban size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default AdminPage;
