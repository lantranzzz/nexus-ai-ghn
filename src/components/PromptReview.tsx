import React from 'react';
import { Eye, Edit2, Play, ChevronLeft, Info, AlertTriangle, Copy } from 'lucide-react';

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
    <div className="surface-card p-6 md:p-8 space-y-6 animate-fade">

      {/* Header */}
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="badge badge-primary text-xs px-2.5 py-1">Giai Đoạn 1 Hoàn Tất</span>
          <h3 className="text-base md:text-lg font-bold text-gray-900 mt-2">Duyệt Kế Hoạch &amp; Hiệu Chỉnh Prompts</h3>
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
      <div className="bg-primary-light/60 border border-primary-light-hover p-4 rounded-xl space-y-2">
        <h4 className="text-xs font-bold text-primary-hover uppercase tracking-wider flex items-center gap-1.5">
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
            let badgeClass = 'badge-secondary';

            if (model.includes('Perplexity') || model.toLowerCase().includes('sonar')) {
              languageBadge = 'Tiếng Anh (Tối ưu tìm tin quốc tế)';
              badgeClass = 'badge-secondary';
            } else if (model.includes('Moonshot') || model.includes('Kimi')) {
              languageBadge = 'Tiếng Trung & Việt (Tối ưu chuỗi cung ứng Trung Quốc)';
              badgeClass = 'badge-warning';
            } else if (model.includes('DeepSeek')) {
              languageBadge = 'Tiếng Việt logic cao';
              badgeClass = 'badge-success';
            }

            return (
              <div key={model} className="border border-gray-200 rounded-xl overflow-hidden surface-card-hover">

                {/* Model Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-primary" />
                    <span className="text-xs md:text-sm font-bold text-gray-900">{model}</span>
                  </div>
                  <span className={`badge ${badgeClass} text-[10px] md:text-xs px-2 py-0.5`}>
                    {languageBadge}
                  </span>
                </div>

                {/* Textarea để chỉnh sửa */}
                <div className="p-3 bg-white">
                  <textarea
                    rows={6}
                    value={prompts[model]}
                    onChange={(e) => handlePromptChange(model, e.target.value)}
                    className="focus-ring w-full text-xs md:text-sm p-3 bg-gray-50/50 hover:bg-white border border-gray-200 rounded-lg resize-y font-mono leading-relaxed text-gray-700"
                    placeholder={`Viết prompt cho ${model}...`}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(prompts[model])}
                      className="text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Prompt
                    </button>
                  </div>
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
          <span>Hệ thống sẽ tự động gọi API từng tool bằng Key bạn đã cấu hình để research, không cần copy-paste tay</span>
        </div>

        <button
          onClick={onConfirm}
          disabled={isLoading || modelNames.length === 0}
          className={`px-8 py-3.5 rounded-xl font-bold flex items-center gap-2.5 text-xs md:text-sm cursor-pointer transition-all ${
            isLoading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'btn-primary animate-pulse-border'
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
              Đang khởi chạy nghiên cứu tự động...
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5 fill-current" />
              TIẾP TỤC: TỰ ĐỘNG NGHIÊN CỨU (AUTO RESEARCH)
            </>
          )}
        </button>
      </div>

    </div>
  );
}
