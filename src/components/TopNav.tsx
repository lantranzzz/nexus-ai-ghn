import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-gray-500 hover:text-gray-700">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-md transition-colors focus-within:border-[#F58220] focus-within:bg-white">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search competitor analyses, reports..." 
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400 focus:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-pointer border-l border-gray-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-[#F58220] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            SM
          </div>
        </div>
      </div>
    </header>
  );
}
