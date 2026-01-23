import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
    title: string;
}

export default function PlaceholderPage({ title }: PlaceholderProps) {
    return (
        <div className="flex h-full items-center justify-center bg-black/50 rounded-[40px] border border-white/5 animate-in fade-in">
            <div className="text-center p-12">
                <div className="w-24 h-24 rounded-full bg-[#111] border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#D4AF37]/5">
                    <Construction className="text-[#D4AF37] opacity-60" size={40} />
                </div>
                <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-white mb-2">{title}</h1>
                <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Coming Soon • Under Development</p>
            </div>
        </div>
    );
}
