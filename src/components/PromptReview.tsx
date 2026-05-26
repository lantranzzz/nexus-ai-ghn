import React from 'react';
import { Eye, Edit2, Play, ChevronLeft, Info, AlertTriangle } from 'lucide-react';

interface PromptReviewProps {
  prompts: Record<string, string>;
  setPrompts: (prompts: Record<string, string>) => void;
  planningSummary: string;
  onBack: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isMocked: boolean;
}

export default function PromptReview({
  prompts,
  setPrompts,
  planningSummary,
  onBack,
  onConfirm,
  isLoading,
  isMocked
}: PromptReviewProps) {

  const handlePromptChange = (modelName: string, value: string) => {
    setPrompts({
      ...prompts,
      [modelName]: value
    });
  };

  const modelNames = Object.keys(prompts);

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 space-y-6 animate-fade">
      
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#F58220] uppercase bg-orange-50 px-2.5 py-1 rounded-full">Giai Đoạn 1 Hoàn Tất</span>
          <h3 className="text-base md:text-lg font-bold text-gray-800 mt-2">Duyệt Kế Hoạch & Hiệu Chỉnh Prompts</h3>
          <p className="text-xs text-gray-500">Xem và tinh chỉnh các câu lệnh được biên soạn tối ưu cho từng chatbot trước khi thực thi</p>
        </div>
        
        <button
          onClick={onBack}
          disabled={isLoading}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại chỉnh Form
        </button>
      </div>

      {/* Tóm tắt kế hoạch của Tổng biên tập */}
      <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-xl space-y-2">
        <h4 className="text-xs font-bold text-[#F58220] uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Kế Hoạch Từ Tổng Biên Tập
        </h4>
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed italic">
          "{planningSummary}"
        </p>
        
        {isMocked && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mt-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Đang chạy thử nghiệm (Không phát hiện API Key Tổng Biên Tập - Hệ thống tự tạo kế hoạch mẫu chất lượng cao)</span>
          </div>
        )}
      </div>

      {/* Danh sách Prompts cho từng model */}
      <div className="space-y-5">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cơ cấu Prompt riêng biệt cho các Search Models ({modelNames.length})</h4>
        
        <div className="space-y-4">
          {modelNames.map((model) => {
            let languageBadge = 'Tiếng Việt';
            let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
            
            if (model.includes('Perplexity') || model.toLowerCase().includes('sonar')) {
              languageBadge = 'Tiếng Anh (Tối ưu tìm tin quốc tế)';
              badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
            } else if (model.includes('Moonshot') || model.includes('Kimi')) {
              languageBadge = 'Tiếng Trung & Việt (Tối ưu chuỗi cung ứng Trung Quốc)';
              badgeColor = 'bg-red-50 text-red-700 border-red-100';
            } else if (model.includes('DeepSeek')) {
              languageBadge = 'Tiếng Việt logic cao';
              badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
            }

            return (
              <div key={model} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                
                {/* Model Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-[#F58220]" />
                    <span className="text-xs md:text-sm font-bold text-gray-800">{model}</span>
                  </div>
                  <span className={`text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {languageBadge}
                  </span>
                </div>

                {/* Textarea để chỉnh sửa */}
                <div className="p-3 bg-white">
                  <textarea
                    rows={6}
                    value={prompts[model]}
                    onChange={(e) => handlePromptChange(model, e.target.value)}
                    className="w-full text-xs md:text-sm p-3 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#F58220] rounded-lg outline-none transition-all resize-y font-mono leading-relaxed text-gray-700"
                    placeholder={`Viết prompt cho ${model}...`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button Submit */}
      <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Eye className="w-4 h-4 text-gray-400" />
          <span>Bạn có thể chỉnh sửa trực tiếp nội dung các prompt ở trên trước khi gửi đi.</span>
        </div>

        <button
          onClick={onConfirm}
          disabled={isLoading || modelNames.length === 0}
          className={`px-8 py-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all text-xs md:text-sm cursor-pointer ${
            isLoading 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#F58220] hover:bg-[#E06B16] text-white animate-pulse-border'
          }`}
          style={{
            animation: isLoading ? 'none' : 'pulseBorder 2s infinite'
          }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang gọi song song API & Tổng hợp báo cáo...
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5 fill-current" />
              XÁC NHẬN & BẮT ĐẦU RESEARCH
            </>
          )}
        </button>
      </div>

    </div>
  );
}
