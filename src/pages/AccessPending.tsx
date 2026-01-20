import React from 'react';
import { Lock } from 'lucide-react';

export const AccessPending = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Lock className="text-white/50" size={24} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">Access Pending</h1>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Estás en la lista de espera.<br />
                Tu solicitud está siendo revisada por el equipo de <span className="text-white font-mono">VydyLabs</span>.
            </p>
        </div>
    );
};
