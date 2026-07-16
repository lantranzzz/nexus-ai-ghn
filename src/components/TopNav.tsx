import React, { useState } from 'react';
import { Menu, LogOut, Settings, Sparkles } from 'lucide-react';

interface TopNavProps {
  onLogout: () => void;
  onOpenSettings?: () => void;
  title?: string;
  subtitle?: string;
}

export default function TopNav({ onLogout, onOpenSettings, title, subtitle }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button className="md:hidden shrink-0 p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        {(title || subtitle) && (
          <div className="min-w-0">
            {title && (
              <h1 className="text-sm md:text-base font-bold text-gray-900 truncate">{title}</h1>
            )}
            {subtitle && (
              <p className="hidden sm:block text-[11px] text-gray-400 font-medium truncate">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 badge badge-secondary text-[11px]">
          <Sparkles className="w-3 h-3" />
          Enterprise Edition
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-gray-500 hover:text-primary hover:bg-primary-light transition-colors cursor-pointer"
            title="Cấu hình API Keys & Bảo mật"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 cursor-pointer pl-2 sm:pl-3 ml-1 border-l border-gray-200 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
              SM
            </div>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2.5 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50 animate-fade overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                  <p className="text-sm font-bold text-gray-900">Strategy Manager</p>
                  <p className="text-xs text-gray-500">GHN Executive</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
