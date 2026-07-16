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
        // Không lộ chi tiết lỗi từ backend auth; dùng thông báo chung chung.
        setError('Email hoặc mật khẩu không chính xác.');
        setIsLoading(false);
      } else {
        onLogin();
      }
    } else {
      // Không có tài khoản demo/backdoor. Khi thiếu cấu hình Supabase, hệ thống
      // không có backend xác thực nên không cho đăng nhập.
      setError('Hệ thống chưa được cấu hình xác thực (Supabase). Vui lòng liên hệ quản trị viên.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F6F7F9] overflow-hidden px-4">
      {/* Brand gradient mesh — thay thế ảnh stock không liên quan bằng bố cục dùng đúng 2 màu thương hiệu GHN */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 w-[32rem] h-[32rem] rounded-full bg-secondary/20 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent-amber/10 blur-[90px]" />

      <div className="relative w-full max-w-md z-10">
        <div
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 sm:p-10 animate-fade"
          style={{ animation: 'slideUp 0.6s ease-out forwards' }}
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 brand-gradient rounded-2xl shadow-lg flex items-center justify-center mb-4 transform hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Nexus<span className="text-gradient-brand">AI</span>
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
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  className="focus-ring block w-full pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white text-gray-900 transition-all"
                  placeholder="Nhập email tài khoản"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  className="focus-ring block w-full pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/60 focus:bg-white text-gray-900 transition-all"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative flex items-center justify-center gap-2 py-3.5 px-4 brand-gradient hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
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
