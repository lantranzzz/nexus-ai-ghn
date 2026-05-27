import React from 'react';
import { LayoutDashboard, FileSearch, Database, Settings, LogOut, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
}

export default function Sidebar({ onOpenSettings }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#1A1A1A] text-gray-400 flex flex-col h-screen shrink-0 sticky top-0 border-r border-gray-800 hidden md:flex transition-all duration-300">
      {/* Brand Section */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F58220] rounded-md flex items-center justify-center text-white font-black text-sm">
            N
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-sm tracking-wide">GHN NexusAI</span>
            <span className="text-[10px] text-gray-500">Research & Strategy</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Main Menu</div>
        
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#2E1D13] text-[#F58220] border-l-2 border-[#F58220] font-medium text-sm transition-colors">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </a>
        
        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#252525] font-medium text-sm transition-colors">
          <FileSearch className="w-4 h-4" />
          Competitor Research
        </a>

        <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#252525] font-medium text-sm transition-colors">
          <Database className="w-4 h-4" />
          Reports Library
        </a>

        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-6 mb-2">System</div>
        
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#252525] font-medium text-sm transition-colors">
          <Settings className="w-4 h-4" />
          Settings & API
        </button>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold border border-gray-600">
              SM
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white font-medium">Strategy Manager</span>
              <span className="text-[10px] text-[#F58220]">GHN Executive</span>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
