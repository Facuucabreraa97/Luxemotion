import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const signIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/app' }
            });
            if (error) alert(error.message);
        } catch (e) {
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-sm p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center text-center">
                 <div className="mb-8 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-4xl">✨</span>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                 <p className="text-gray-400 mb-8 text-sm">Sign in to access your dashboard</p>

                 <button 
                    onClick={signIn} 
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
                 >
                    {loading ? (
                        <span className="animate-pulse">Connecting...</span>
                    ) : (
                        <>
                           <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c6.1 0 10.1-4.25 10.1-10.42c0-.72-.03-1.23-.08-1.48z"/></svg> 
                           Continue with Google
                        </>
                    )}
                 </button>
            </div>
            
            <div className="absolute bottom-8 text-xs text-gray-500 uppercase tracking-widest">Powered by Luxemotion</div>
        </div>
    );
};