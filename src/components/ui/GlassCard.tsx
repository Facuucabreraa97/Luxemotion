import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl 
                transition-transform duration-200 active:scale-95 
                ${onClick ? 'cursor-pointer hover:border-white/20' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};
