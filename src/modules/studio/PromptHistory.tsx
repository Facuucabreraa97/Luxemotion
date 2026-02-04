import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Clock, History } from 'lucide-react';

interface PromptHistoryItem {
  id: string;
  prompt: string;
  created_at: string;
}

interface GroupedPrompts {
  [date: string]: PromptHistoryItem[];
}

interface PromptHistoryProps {
  onSelect: (prompt: string) => void;
}

export const PromptHistory = ({ onSelect }: PromptHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState<GroupedPrompts>({});
  const [loading, setLoading] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('generations')
        .select('id, prompt, created_at')
        .eq('user_id', user.id)
        .not('prompt', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group by date
      const grouped: GroupedPrompts = {};
      data?.forEach((item) => {
        const date = formatDateGroup(new Date(item.created_at));
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(item);
      });

      setPrompts(grouped);
      
      // Auto-expand first date
      const dates = Object.keys(grouped);
      if (dates.length > 0) setExpandedDate(dates[0]);
    } catch (e) {
      console.error('Failed to fetch prompt history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const formatDateGroup = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSelect = (prompt: string) => {
    onSelect(prompt);
    setIsOpen(false);
  };

  const dateKeys = Object.keys(prompts);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors"
      >
        <History size={12} />
        Prompt History
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-8 left-0 right-0 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm animate-pulse">
              Loading history...
            </div>
          ) : dateKeys.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No prompts yet. Create your first video!
            </div>
          ) : (
            <div className="overflow-y-auto max-h-72">
              {dateKeys.map((date) => (
                <div key={date}>
                  {/* Date Header */}
                  <button
                    onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors sticky top-0"
                  >
                    <span className="text-xs font-bold text-gray-400">{date}</span>
                    <span className="text-[10px] text-gray-600">{prompts[date].length} prompts</span>
                  </button>

                  {/* Prompts for this date */}
                  {expandedDate === date && (
                    <div className="divide-y divide-white/5">
                      {prompts[date].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.prompt)}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={10} className="text-gray-600" />
                            <span className="text-[10px] text-gray-600">{formatTime(item.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white transition-colors">
                            {item.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
