import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/app' },
      });
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          alert(
            'Google Auth is not enabled in Supabase. Please enable it in Authentication > Providers.'
          );
        } else {
          alert(error.message);
        }
      }
    } catch (e) {
      alert('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/app' },
        });
        if (error) throw error;
        alert('Account created! Please check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/app');
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

      <div className="relative z-10 w-full max-w-sm p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center">
        <div className="mb-6">
          <img src="/branding/logo-white.png" alt="MivideoAI" className="h-12 opacity-90" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-400 mb-8 text-sm text-center">
          {isSignUp ? 'Join the future of fame' : 'Sign in to access your dashboard'}
        </p>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center gap-4 w-full mb-6">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-xs text-gray-500 font-medium">OR</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c6.1 0 10.1-4.25 10.1-10.42c0-.72-.03-1.23-.08-1.48z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-sm text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-yellow-500 hover:text-yellow-400 font-bold hover:underline transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-500 uppercase tracking-widest">
        MivideoAI Inc. © 2026
      </div>

      <style>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
                }
                .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
            `}</style>
    </div>
  );
};
