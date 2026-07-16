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
  xai: string;
  qwen: string;
}

const EMPTY_API_KEYS: ApiKeys = {
  openai: '',
  anthropic: '',
  google: '',
  perplexity: '',
  deepseek: '',
  moonshot: '',
  xai: '',
  qwen: '',
};

const API_KEY_FIELDS: { key: keyof ApiKeys; label: string; placeholder: string }[] = [
  { key: 'openai', label: 'OpenAI API Key (ChatGPT, gpt-4o...)', placeholder: 'sk-proj-...' },
  { key: 'anthropic', label: 'Anthropic API Key (Claude 3.5 Sonnet...)', placeholder: 'sk-ant-api03-...' },
  { key: 'google', label: 'Google Gemini API Key (gemini-1.5...)', placeholder: 'AIzaSy...' },
  { key: 'perplexity', label: 'Perplexity AI API Key (Web Search)', placeholder: 'pplx-...' },
  { key: 'deepseek', label: 'DeepSeek API Key (deepseek-chat)', placeholder: 'sk-...' },
  { key: 'moonshot', label: 'Moonshot AI API Key (Kimi API)', placeholder: 'sk-...' },
  { key: 'xai', label: 'xAI API Key (Grok)', placeholder: 'xai-...' },
  { key: 'qwen', label: 'Qwen API Key (Alibaba Cloud DashScope)', placeholder: 'sk-...' },
];

export default function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [keys, setKeys] = useState<ApiKeys>(EMPTY_API_KEYS);

  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    // Tải các khóa từ LocalStorage khi khởi chạy
    const storedKeys = localStorage.getItem('nexusai_api_keys');
    if (storedKeys) {
      try {
        // Merge với default để không lỗi khi dữ liệu cũ (trước khi thêm xai/qwen) thiếu field mới.
        setKeys({ ...EMPTY_API_KEYS, ...JSON.parse(storedKeys) });
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
      setKeys(EMPTY_API_KEYS);
      localStorage.removeItem('nexusai_api_keys');
      if (supabaseConnected) {
        await syncApiKeysToCloud(EMPTY_API_KEYS as any);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('nexusai_auth');

      // Xóa dứt điểm token để ngăn treo UI
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });

      if (supabaseConnected && supabase) {
        supabase.auth.signOut().catch(e => console.error(e));
      }
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-fade" style={{ animation: 'slideIn 0.3s ease-out forwards' }}>

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
              <Key className="w-[18px] h-[18px] text-primary" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Cấu hình API Keys &amp; Bảo mật</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-primary-light border-l-4 border-primary p-4 rounded-r-xl">
            <div className="flex gap-2.5">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Nơi lưu trữ API Keys:</strong> Key được lưu trong <strong className="text-gray-800">trình duyệt (LocalStorage)</strong>, và nếu bạn đã đăng nhập sẽ được đồng bộ vào hồ sơ tài khoản Supabase của bạn để dùng trên nhiều thiết bị. Khi chạy nghiên cứu, key được gửi qua máy chủ của ứng dụng rồi chuyển tiếp đến nhà cung cấp AI (không lưu lại trong log hay cơ sở dữ liệu báo cáo). Chỉ nhập API Key trên thiết bị bạn tin tưởng.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cấu hình AI Chatbots</h3>

            {API_KEY_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={keys[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="focus-ring w-full text-sm px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white text-gray-900 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Supabase Status */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Đồng bộ Database</h3>
            <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
              supabaseConnected
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-amber-50 border-amber-100 text-amber-800'
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
        <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex flex-col gap-3">
          <button
            onClick={saveKeys}
            className="btn-primary w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            Lưu Cấu Hình
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={clearKeys}
              className="w-full py-2 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Xóa Keys
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
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
