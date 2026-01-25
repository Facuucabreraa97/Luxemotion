
import React, { createContext, useContext, useState } from 'react';

// Definición simple del contexto
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook para usar el toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Si se usa fuera del provider, devolvemos una función dummy para que no rompa la app
    console.warn("useToast must be used within a ToastProvider");
    return { showToast: () => {} };
  }
  return context;
};

// Componente Provider
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([]);

  const showToast = (message: string, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto eliminar después de 3 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Contenedor visual de las notificaciones */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all transform animate-in slide-in-from-right-5
              ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white border border-gray-700'}
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
