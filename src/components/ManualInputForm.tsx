import React from 'react';
import { PenTool, ChevronLeft, Play, LayoutList } from 'lucide-react';

interface ManualInputFormProps {
  models: string[];
  rawInputs: Record<string, string>;
  setRawInputs: (inputs: Record<string, string>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ManualInputForm({
  models,
  rawInputs,
  setRawInputs,
  onBack,
  onSubmit,
  isLoading
}: ManualInputFormProps) {

  const handleInputChange = (model: string, value: string) => {
    setRawInputs({
      ...rawInputs,
      [model]: value
    });
  };

  const isFormValid = models.every(model => rawInputs[model] && rawInputs[model].trim().length > 0);

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100 space-y-6 animate-fade">
      
      {/* Header */}
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#F58220] uppercase bg-orange-50 px-2.5 py-1 rounded-full">Bước 3: Tổng Hợp</span>
          <h3 className="text-base md:text-lg font-bold text-gray-800 mt-2">Nhập Kết Quả Thô Từ Chatbot</h3>
          <p className="text-xs text-gray-500">Dán nội dung phản hồi từ các chatbot bạn vừa hỏi vào ô tương ứng bên dưới</p>
        </div>
        
        <button
          onClick={onBack}
          disabled={isLoading}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại Xem Prompts
        </button>
      </div>

      <div className="space-y-6">
        {models.map(model => (
          <div key={model} className="space-y-2">
            <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <LayoutList className="w-4 h-4 text-[#F58220]" />
              Dán kết quả từ {model}:
            </label>
            <textarea
              required
              rows={8}
              value={rawInputs[model] || ''}
              onChange={(e) => handleInputChange(model, e.target.value)}
              placeholder={`Dán nội dung mà ${model} đã trả lời cho bạn vào đây...`}
              className="w-full text-xs md:text-sm p-4 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-y text-gray-800 font-mono leading-relaxed bg-gray-50/50 hover:bg-white focus:bg-white"
            />
          </div>
        ))}
      </div>

      {/* Button Submit */}
      <div className="pt-4 flex justify-end border-t border-gray-100">
        <button
          onClick={onSubmit}
          disabled={isLoading || !isFormValid}
          className={`px-8 py-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all text-xs md:text-sm cursor-pointer ${
            isLoading || !isFormValid
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#F58220] hover:bg-[#E06B16] text-white animate-pulse-border'
          }`}
          style={{
            animation: (isLoading || !isFormValid) ? 'none' : 'pulseBorder 2s infinite'
          }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang phân tích & Tổng hợp Báo cáo...
            </>
          ) : (
            <>
              <PenTool className="w-4.5 h-4.5 fill-current" />
              TỔNG BỘ BIÊN TẬP (SYNTHESIS)
            </>
          )}
        </button>
      </div>

    </div>
  );
}
