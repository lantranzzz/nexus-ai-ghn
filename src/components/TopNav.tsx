import React, { useState } from 'react';
import { Search, Menu, LogOut } from 'lucide-react';

interface TopNavProps {
  onLogout: () => void;
}

export default function TopNav({ onLogout }: TopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-gray-500 hover:text-gray-700">
          <Menu className="w-5 h-5" />
        </button>
        

      </div>

      <div className="flex items-center gap-4">
        {/* Avatar with Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 cursor-pointer border-l border-gray-200 pl-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#F58220] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              SM
            </div>
          </div>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">Strategy Manager</p>
                <p className="text-xs text-gray-500">GHN Executive</p>
              </div>
              <button 
                type="button"
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
