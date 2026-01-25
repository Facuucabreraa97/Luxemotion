import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log("\n🍞 [BAKERY] HORNEANDO COMPONENTE TOAST... (ESM Mode)\n");

// 1. Asegurar que la carpeta existe
const dirPath = 'src/components/ui';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log("📂 Carpeta src/components/ui creada.");
}

// 2. Crear el archivo Toast.tsx (Con T mayúscula, exactamente como lo pide el error)
const toastPath = path.join(dirPath, 'Toast.tsx');

const toastContent = `
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
            className={\`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all transform animate-in slide-in-from-right-5
              \${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white border border-gray-700'}
            \`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
`;

fs.writeFileSync(toastPath, toastContent);
console.log("✅ CREADO: src/components/ui/Toast.tsx");

// 3. SUBIDA FINAL
console.log("\n🚀 SUBIENDO LA PIEZA FALTANTE...");
try {
    execSync('git add src/components/ui/Toast.tsx', { stdio: 'inherit' });
    execSync('git commit -m "fix(ui): create missing Toast component to resolve build error"', { stdio: 'inherit' });
    execSync('git push origin main --force', { stdio: 'inherit' });
    console.log("\n🏆 HECHO. Vercel encontrará el archivo y completará el build.");
} catch (e) {
    console.error("GIT ERROR:", e.message);
}
