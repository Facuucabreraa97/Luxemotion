import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastContextType {
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast missing Provider");
    return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);
    
    const toast = (msg: string, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
                    {toasts.map(t => (
                        <div key={t.id} className={`px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-in slide-in-from-right fade-in ${
                            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] border border-[#333] text-white'
                        }`}>
                            {t.msg}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};