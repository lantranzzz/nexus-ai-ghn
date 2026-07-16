import React from 'react';
import { Search, PenTool, CheckSquare, Square, Info } from 'lucide-react';

interface ModelSelectionProps {
  selectedSearchModels: string[];
  setSelectedSearchModels: (models: string[]) => void;
  selectedSynthesisModel: string;
  setSelectedSynthesisModel: (model: string) => void;
}

export const SEARCH_MODELS = [
  { id: 'tool-chatgpt', name: 'ChatGPT (OpenAI)', provider: 'OpenAI', desc: 'Sử dụng ChatGPT Plus / Pro' },
  { id: 'tool-claude', name: 'Claude (Anthropic)', provider: 'Anthropic', desc: 'Sử dụng Claude 3.5 Sonnet / Opus' },
  { id: 'tool-gemini', name: 'Gemini (Google)', provider: 'Google', desc: 'Sử dụng Gemini Advanced' },
  { id: 'tool-perplexity', name: 'Perplexity', provider: 'Perplexity', desc: 'Tìm kiếm web thời gian thực' },
  { id: 'tool-grok', name: 'Grok (xAI)', provider: 'xAI', desc: 'Dữ liệu thời gian thực từ X (Twitter)' },
  { id: 'tool-deepseek', name: 'DeepSeek', provider: 'DeepSeek', desc: 'Sử dụng DeepSeek Coder / Chat' },
  { id: 'tool-kimi', name: 'Moonshot Kimi', provider: 'Moonshot AI', desc: 'Đọc hiểu tài liệu tiếng Trung' },
  { id: 'tool-qwen', name: 'Qwen', provider: 'Alibaba Cloud', desc: 'Chatbot đa ngôn ngữ từ Alibaba' }
];

export const SYNTHESIS_MODELS = [
  { id: 'openai-gpt-5.5', name: 'OpenAI (gpt-5.5)', provider: 'OpenAI', label: 'GPT-5.5 - Trí tuệ siêu việt chuyên gia' }
];

export default function ModelSelection({
  selectedSearchModels,
  setSelectedSearchModels,
  selectedSynthesisModel,
  setSelectedSynthesisModel
}: ModelSelectionProps) {

  const toggleSearchModel = (modelName: string) => {
    if (selectedSearchModels.includes(modelName)) {
      // Giữ lại ít nhất 1 model
      if (selectedSearchModels.length > 1) {
        setSelectedSearchModels(selectedSearchModels.filter(m => m !== modelName));
      }
    } else {
      setSelectedSearchModels([...selectedSearchModels, modelName]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white p-8 md:p-10 rounded-2xl shadow-md border border-gray-100 animate-fade">
      
      {/* KHU VỰC 1: CHỌN MODEL TÌM TIN SONG SONG */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Search className="w-5 h-5 text-[#F58220]" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm md:text-base">Khu vực 1: Chọn Tool Tìm Tin (Tự Động Qua API)</h3>
            <p className="text-xs text-gray-500">Model Tổng biên tập sẽ tạo prompt tối ưu, sau đó hệ thống tự động gọi API từng tool bằng Key bạn đã cấu hình trong Cài đặt</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {SEARCH_MODELS.map((model) => {
            const isSelected = selectedSearchModels.includes(model.name);
            return (
              <div 
                key={model.id}
                onClick={() => toggleSearchModel(model.name)}
                className={`p-3 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#F58220] bg-orange-50/50 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-[#F58220] rounded flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-4 h-4 border border-gray-300 rounded" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    {model.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{model.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* KHU VỰC 2: CHỌN MODEL TỔNG BIÊN TẬP */}
      <div className="space-y-4 lg:border-l lg:border-gray-100 lg:pl-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <PenTool className="w-5 h-5 text-[#F58220]" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm md:text-base">Khu vực 2: Model Tổng Biên Tập</h3>
            <p className="text-xs text-gray-500">Mô hình tư duy cao phụ trách lập kế hoạch & biên soạn báo cáo chiến lược</p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Chọn 1 Model Tổng Biên Tập
            </label>
            <div className="relative">
              <select
                value={selectedSynthesisModel}
                onChange={(e) => setSelectedSynthesisModel(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] bg-white text-gray-800 font-medium transition-colors cursor-pointer appearance-none shadow-sm"
              >
                {SYNTHESIS_MODELS.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#F58220] shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-600 leading-normal">
                <strong>Vai trò của Tổng Biên Tập:</strong> Model này sẽ viết prompt tối ưu ở <strong>Giai đoạn 1</strong>, sau đó gom toàn bộ dữ liệu từ các model Tìm Tin, dịch thuật ngữ chuyên ngành, kiểm tra đối chiếu chéo (Fact-check) và soạn thảo báo cáo Markdown ở <strong>Giai đoạn 2</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
