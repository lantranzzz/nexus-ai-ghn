import React, { useState } from 'react';
import { Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập (email) và mật khẩu');
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      // Đăng nhập bằng Supabase (yêu cầu username là dạng email)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (signInError) {
        setError('Đăng nhập thất bại: ' + signInError.message);
        setIsLoading(false);
      } else {
        onLogin();
      }
    } else {
      // Fallback
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          localStorage.setItem('nexusai_auth', 'true');
          onLogin();
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không chính xác (Thử admin/admin)');
          setIsLoading(false);
        }
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      <div className="relative w-full max-w-md z-10 p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8 sm:p-10 animate-fade" style={{ animation: 'slideUp 0.6s ease-out forwards' }}>
          
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-[#F58220] to-orange-400 rounded-2xl shadow-lg flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
              Nexus<span className="text-[#F58220]">AI</span>
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Đăng nhập để tiếp tục vào hệ thống
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#F58220] transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white/50 focus:bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F58220]/50 focus:border-[#F58220] transition-all"
                  placeholder="Nhập email tài khoản"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#F58220] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white/50 focus:bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F58220]/50 focus:border-[#F58220] transition-all"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#F58220] to-[#FF9E4A] hover:from-[#E06B16] hover:to-[#F58220] text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
