import React from 'react';
import { Settings, BarChart2, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            {/* Logo Placeholder resembling GHN style */}
            <div className="w-9 h-9 bg-[#F58220] rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#F58220] text-lg tracking-tight">NexusAI</span>
                <span className="h-4 w-[1px] bg-gray-300" />
                <span className="text-gray-800 text-xs md:text-sm font-bold uppercase tracking-wider">GHN Research Tool</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Hệ thống nghiên cứu đối thủ & chiến lược tự động</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-100 rounded-full text-[#F58220] text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-[#F58220] rounded-full animate-ping" />
              Enterprise Edition
            </div>
            
            {/* Gear Button with Hover Effect */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-[#F58220] hover:bg-orange-50 text-gray-600 hover:text-[#F58220] transition-all duration-200 relative group cursor-pointer"
              title="Cấu hình API Keys & Bảo mật"
            >
              <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
              {/* Badge indicating key state could go here */}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
