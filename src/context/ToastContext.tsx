import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);

    const showToast = (msg: string, type: ToastType = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && createPortal(
                <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border backdrop-blur-md
          ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-500' :
                        toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                            'bg-black/80 border-[#D4AF37]/30 text-[#D4AF37]'}`}>
                    {toast.type === 'error' ? <X size={18} /> : toast.type === 'success' ? <Check size={18} /> : <Info size={18} />}
                    <span className="text-xs font-bold uppercase tracking-widest">{toast.msg}</span>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};
