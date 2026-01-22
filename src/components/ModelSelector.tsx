import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Zap, Crown } from 'lucide-react';

interface Model {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

interface ModelSelectorProps {
    selectedModelId: string | null;
    onSelect: (id: string, name: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModelId, onSelect }) => {
    const [models, setModels] = useState<Model[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            // In a real scenario, we might want to show ALL models available to user, not just 'active' system wide.
            // But based on "Control Tower", 'is_active' usually means 'System Default'.
            // Let's fetch ALL so user can choose "Velvet Pro" vs "Flash"
            const { data, error } = await supabase.from('ai_models').select('*');
            if (data) {
                setModels(data);
                // Auto Select first active if none selected
                if (!selectedModelId) {
                    const active = data.find(m => m.is_active);
                    if (active) onSelect(active.id, active.name);
                }
            }
            setLoading(false);
        };
        fetchModels();
    }, []);

    const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

    return (
        <div className="relative z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium text-slate-300 backdrop-blur-md"
            >
                <Zap size={12} className="text-[#C6A649]" />
                <span>{selectedModel?.name || 'Loading Engine...'}</span>
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">
                            Available Engines
                        </div>
                        {models.map(model => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onSelect(model.id, model.name);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group transition-colors ${selectedModelId === model.id ? 'bg-[#C6A649]/20 text-[#C6A649]' : 'hover:bg-white/5 text-slate-300'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{model.name}</span>
                                    {model.is_active && <span className="text-[9px] text-emerald-400">System Default</span>}
                                </div>
                                {model.name.includes('Pro') || model.name.includes('8K') ? <Crown size={12} className="text-amber-400" /> : null}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ModelSelector;
