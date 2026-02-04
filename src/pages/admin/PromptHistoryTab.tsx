import React, { useState, useEffect } from 'react';
import { AdminService, AdminGeneration } from '@/services/admin.service';
import { Search, RefreshCw } from 'lucide-react';

export const PromptHistoryTab = () => {
  const [generations, setGenerations] = useState<AdminGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    setLoading(true);
    const data = await AdminService.getAllGenerations(500);
    setGenerations(data);
    setLoading(false);
  };

  // Filter by search
  const filtered = generations.filter(g => 
    g.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by user email
  const groupedByUser: { [email: string]: AdminGeneration[] } = {};
  filtered.forEach(g => {
    const email = g.user_email || 'Unknown';
    if (!groupedByUser[email]) groupedByUser[email] = [];
    groupedByUser[email].push(g);
  });

  const userEmails = Object.keys(groupedByUser).sort((a, b) => {
    // Sort by most recent generation
    const aLatest = new Date(groupedByUser[a][0].created_at).getTime();
    const bLatest = new Date(groupedByUser[b][0].created_at).getTime();
    return bLatest - aLatest;
  });

  const toggleUser = (email: string) => {
    const newSet = new Set(expandedUsers);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setExpandedUsers(newSet);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColor = (status: string) => {
    if (status === 'succeeded') return 'text-green-400';
    if (status === 'failed') return 'text-red-400';
    if (status === 'processing') return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Prompt History</h2>
      
      {/* Search + Refresh */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search by email or prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-white/30 transition"
          />
        </div>
        <button
          onClick={loadGenerations}
          disabled={loading}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="bg-white/5 px-4 py-2 rounded-lg">
          <span className="text-gray-500">Total Prompts:</span>{' '}
          <span className="font-bold">{generations.length}</span>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-lg">
          <span className="text-gray-500">Users:</span>{' '}
          <span className="font-bold">{userEmails.length}</span>
        </div>
      </div>

      {/* User Groups */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">Loading...</div>
      ) : userEmails.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No prompts found</div>
      ) : (
        <div className="space-y-2">
          {userEmails.map(email => (
            <div key={email} className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
              {/* User Header */}
              <button
                onClick={() => toggleUser(email)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {email[0].toUpperCase()}
                  </div>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{groupedByUser[email].length} prompts</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedUsers.has(email) ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Prompts List */}
              {expandedUsers.has(email) && (
                <div className="border-t border-white/5 max-h-80 overflow-y-auto">
                  {groupedByUser[email].map(gen => (
                    <div key={gen.id} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{formatDate(gen.created_at)}</span>
                        <span className={statusColor(gen.status)}>{gen.status}</span>
                      </div>
                      <p className="text-sm text-gray-300">{gen.prompt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
