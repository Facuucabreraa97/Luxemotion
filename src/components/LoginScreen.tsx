
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/app' }
      });
      if (error) alert(error.message);
    } catch (e) {
      alert("Error iniciando sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-8">Luxemotion</h1>
      <button 
        onClick={handleLogin}
        disabled={loading}
        className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition"
      >
        {loading ? 'Conectando...' : 'Entrar con Google'}
      </button>
    </div>
  );
};

export default LoginScreen;
