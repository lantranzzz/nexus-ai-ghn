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
    <aside className="w-64 bg-[#15161A] text-gray-400 flex flex-col h-screen shrink-0 sticky top-0 border-r border-white/5 hidden md:flex transition-all duration-300">
      {/* Brand Section */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm tracking-wide truncate">GHN NexusAI</span>
            <span className="text-[10px] text-gray-500 truncate">Research &amp; Strategy</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto custom-scrollbar">

        <button
          onClick={onNewResearch}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-6 rounded-xl font-bold text-sm transition-all bg-primary text-white hover:bg-primary-hover shadow-[0_8px_20px_-6px_rgba(255,82,0,0.5)] hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-[18px] h-[18px]" />
          Nghiên Cứu Mới
        </button>

        <button
          onClick={() => onChangeTab('library')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
            activeTab === 'library'
              ? 'bg-white/[0.07] text-white'
              : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.04]'
          }`}
        >
          <Database className={`w-4 h-4 shrink-0 ${activeTab === 'library' ? 'text-primary' : ''}`} />
          Thư Viện Báo Cáo
        </button>

        {history && history.length > 0 && (
          <>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 mt-8 mb-2 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-secondary" />
              Gần đây
            </div>
            <div className="space-y-0.5">
              {history.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => onViewReport(item)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] font-medium text-sm transition-colors text-left cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-40" />
                  <span className="truncate w-full">{item.query?.action || item.query?.scope || 'Báo cáo mới'}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 mt-8 mb-2">Hệ Thống</div>

        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] font-medium text-sm transition-colors cursor-pointer">
          <Settings className="w-4 h-4 shrink-0" />
          Cài Đặt &amp; API
        </button>
      </nav>

      {/* Footer status */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Hệ thống hoạt động ổn định
        </div>
      </div>
    </aside>
  );
}
