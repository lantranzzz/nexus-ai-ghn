import React from 'react';
import { LayoutDashboard, FileSearch, Database, Settings, LogOut, ChevronLeft, Plus, MessageSquare } from 'lucide-react';
import { ResearchData } from '@/lib/supabase';

interface SidebarProps {
  activeTab: 'research' | 'library';
  onChangeTab: (tab: 'research' | 'library') => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  history: ResearchData[];
  onNewResearch: () => void;
  onViewReport: (data: ResearchData) => void;
}

export default function Sidebar({ 
  activeTab, 
  onChangeTab, 
  onOpenSettings, 
  onLogout,
  history,
  onNewResearch,
  onViewReport
}: SidebarProps) {
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
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        
        <button 
          onClick={onNewResearch}
          className="w-full flex items-center gap-3 px-3 py-2.5 mb-6 rounded-lg font-bold text-sm transition-colors bg-[#F58220] text-white hover:bg-orange-500 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Research
        </button>

        <button 
          onClick={() => onChangeTab('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'library'
              ? 'bg-[#2E1D13] text-[#F58220] border-l-2 border-[#F58220]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525] border-l-2 border-transparent'
          }`}
        >
          <Database className="w-4 h-4" />
          Reports Library
        </button>

        {history && history.length > 0 && (
          <>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-8 mb-2">Recents</div>
            <div className="space-y-0.5">
              {history.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => onViewReport(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#252525] font-medium text-sm transition-colors text-left"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                  <span className="truncate w-full">{item.query?.action || item.query?.scope || 'Báo cáo mới'}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-6 mb-2">System</div>
        
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#252525] font-medium text-sm transition-colors">
          <Settings className="w-4 h-4" />
          Settings & API
        </button>
      </nav>
    </aside>
  );
}
