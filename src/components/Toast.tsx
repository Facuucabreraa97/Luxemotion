import React, { createContext, useContext, useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ToastContextType {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Internal Toast Component
const Toast = ({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in">
      <div className={`backdrop-blur-xl border px-6 py-4 rounded-full flex items-center gap-4 shadow-lg
          ${isSuccess ? 'bg-[#050505]/95 border-[#C6A649] shadow-[0_0_40px_rgba(198,166,73,0.3)]' : 'bg-red-950/95 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'}
      `}>
        {isSuccess ? <Check size={14} className="text-[#C6A649]"/> : <AlertCircle size={14} className="text-red-500"/>}
        <span className="text-white text-xs font-bold uppercase tracking-widest">{msg}</span>
      </div>
    </div>
  );
};
