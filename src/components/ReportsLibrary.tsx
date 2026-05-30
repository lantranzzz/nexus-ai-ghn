import React from 'react';
import { FileText, Calendar, Database, Search, ArrowRight, User, Target } from 'lucide-react';
import { ResearchData } from '@/lib/supabase';

interface ReportsLibraryProps {
  history: ResearchData[];
  isLoading: boolean;
  onViewReport: (data: ResearchData) => void;
}

export default function ReportsLibrary({ history, isLoading, onViewReport }: ReportsLibraryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F58220] mr-3"></div>
        Đang tải lịch sử báo cáo...
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
        <Database className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-700">Chưa có báo cáo nào</h3>
        <p className="text-sm mt-1">Các báo cáo bạn lưu sẽ xuất hiện tại đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Thư viện báo cáo <span className="text-[#F58220]">({history.length})</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý và xem lại các báo cáo nghiên cứu đã lưu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {history.map((item, idx) => (
          <div 
            key={item.id || idx}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
            onClick={() => onViewReport(item)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-[#F58220] group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
              </span>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#F58220] transition-colors">
                {item.query?.action || 'Báo cáo không có tiêu đề'} - {item.query?.scope || 'Không rõ scope'}
              </h3>
              
              <div className="flex flex-wrap gap-2 text-[10px] font-medium text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-md flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.query?.persona}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded-md flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {item.search_models?.length} sources
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500 group-hover:text-[#F58220] transition-colors">
              <span>Xem chi tiết</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
