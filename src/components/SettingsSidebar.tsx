import React, { useState, useEffect } from 'react';
import { X, Key, Info, CheckCircle, Database, Trash2, LogOut } from 'lucide-react';
import { isSupabaseConfigured, supabase, syncApiKeysToCloud } from '@/lib/supabase';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
  perplexity: string;
  deepseek: string;
  moonshot: string;
}

export default function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [keys, setKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    google: '',
    perplexity: '',
    deepseek: '',
    moonshot: '',
  });

  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    // Tải các khóa từ LocalStorage khi khởi chạy
    const storedKeys = localStorage.getItem('nexusai_api_keys');
    if (storedKeys) {
      try {
        setKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error('Lỗi parse API Keys từ localStorage:', e);
      }
    }
    
    // Kiểm tra kết nối Supabase
    setSupabaseConnected(isSupabaseConfigured());
  }, []);

  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setKeys((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveKeys = async () => {
    localStorage.setItem('nexusai_api_keys', JSON.stringify(keys));
    if (supabaseConnected) {
      await syncApiKeysToCloud(keys as any);
    }
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
    }, 2500);
  };

  const clearKeys = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả API Keys không?')) {
      const emptyKeys = {
        openai: '',
        anthropic: '',
        google: '',
        perplexity: '',
        deepseek: '',
        moonshot: '',
      };
      setKeys(emptyKeys);
      localStorage.removeItem('nexusai_api_keys');
      if (supabaseConnected) {
        await syncApiKeysToCloud(emptyKeys as any);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      if (supabaseConnected && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('nexusai_auth');
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-fade" style={{ animation: 'slideIn 0.3s ease-out forwards' }}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#F58220]" />
            <h2 className="text-lg font-bold text-gray-800">Cấu hình API Keys & Bảo mật</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-orange-50 border-l-4 border-[#F58220] p-4 rounded-r-md">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-[#F58220] shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>Nơi lưu trữ API Keys:</strong> Key được lưu trong <strong>trình duyệt (LocalStorage)</strong>, và nếu bạn đã đăng nhập sẽ được đồng bộ vào hồ sơ tài khoản Supabase của bạn để dùng trên nhiều thiết bị. Khi chạy nghiên cứu, key được gửi qua máy chủ của ứng dụng rồi chuyển tiếp đến nhà cung cấp AI (không lưu lại trong log hay cơ sở dữ liệu báo cáo). Chỉ nhập API Key trên thiết bị bạn tin tưởng.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cấu hình AI Chatbots</h3>
            
            {/* OpenAI */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">OpenAI API Key (ChatGPT, gpt-4o...)</label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={keys.openai}
                onChange={(e) => handleInputChange('openai', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>

            {/* Anthropic */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Anthropic API Key (Claude 3.5 Sonnet...)</label>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={keys.anthropic}
                onChange={(e) => handleInputChange('anthropic', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>

            {/* Google Gemini */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Google Gemini API Key (gemini-1.5...)</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={keys.google}
                onChange={(e) => handleInputChange('google', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>

            {/* Perplexity */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Perplexity AI API Key (Web Search)</label>
              <input
                type="password"
                placeholder="pplx-..."
                value={keys.perplexity}
                onChange={(e) => handleInputChange('perplexity', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>

            {/* DeepSeek */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">DeepSeek API Key (deepseek-chat)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={keys.deepseek}
                onChange={(e) => handleInputChange('deepseek', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>

            {/* Moonshot AI (Kimi) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Moonshot AI API Key (Kimi API)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={keys.moonshot}
                onChange={(e) => handleInputChange('moonshot', e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Supabase Status */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Đồng bộ Database</h3>
            <div className={`flex items-center gap-3 p-3 rounded-md border ${
              supabaseConnected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <Database className="w-5 h-5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">
                  {supabaseConnected ? 'Supabase Database: Đã Kết Nối' : 'Supabase: Chưa Kết Nối Env'}
                </p>
                <p className="mt-0.5 opacity-80">
                  {supabaseConnected 
                    ? 'Báo cáo chiến lược sẽ tự động lưu lên Cloud Database.' 
                    : 'Hệ thống tự động chuyển sang lưu trữ cục bộ LocalStorage của bạn.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
          <button
            onClick={saveKeys}
            className="w-full py-2.5 px-4 bg-[#F58220] hover:bg-[#E06B16] text-white font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Lưu Cấu Hình
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearKeys}
              className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Xóa Keys
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 font-medium rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
          
          {savedStatus && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium py-1 animate-fade">
              <CheckCircle className="w-4 h-4" />
              <span>Đã lưu thành công vào LocalStorage!</span>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
