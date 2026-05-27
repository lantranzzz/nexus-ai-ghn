import React from 'react';
import { Target, Users, BarChart3, ArrowRight } from 'lucide-react';

interface ResearchFormProps {
  goal: string;
  setGoal: (val: string) => void;
  competitors: string;
  setCompetitors: (val: string) => void;
  metrics: string;
  setMetrics: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function ResearchForm({
  goal,
  setGoal,
  competitors,
  setCompetitors,
  metrics,
  setMetrics,
  onSubmit,
  isLoading
}: ResearchFormProps) {

  // Các gợi ý nhanh để giúp Strategy Manager điền nhanh dữ liệu
  const applyQuickTemplate = (templateType: 'j&t' | 'ninjavan' | 'tiktok') => {
    if (templateType === 'j&t') {
      setGoal('Phân tích chiến lược định giá cước và tối ưu chặng cuối để cạnh tranh thị phần hàng nhẹ thương mại điện tử');
      setCompetitors('J&T Express, SPX Express (Shopee Express)');
      setMetrics('Bảng giá cước chi tiết các khu vực, mức chiết khấu cho khách hàng lớn (KAs), chính sách miễn cước chuyển hoàn, thuật toán tối ưu tuyến shipper chặng cuối.');
    } else if (templateType === 'ninjavan') {
      setGoal('Đánh giá mô hình quản lý kho thông minh và dịch vụ hoàn tất đơn hàng (Fulfillment) cho các nhà bán hàng đa kênh');
      setCompetitors('Ninja Van, Viettel Post');
      setMetrics('Diện tích phân bổ kho bãi, chi phí lưu kho, công nghệ tự động hóa chia chọn (AGV/băng tải chéo), các tính năng tích hợp API quản lý tồn kho.');
    } else if (templateType === 'tiktok') {
      setGoal('Nghiên cứu xu hướng vận chuyển e-commerce xuyên biên giới và tác động của các nền tảng social commerce mới');
      setCompetitors('Best Express, J&T Global, Cainiao (Alibaba)');
      setMetrics('Thời gian trung chuyển từ kho Trung Quốc về Việt Nam, mức thuế và thủ tục hải quan thông quan, cước vận chuyển chặng quốc tế, mô hình liên kết hãng bay và bưu cục nội địa.');
    }
  };

  const isFormValid = goal.trim() !== '' && competitors.trim() !== '' && metrics.trim() !== '';

  return (
    <form onSubmit={onSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-md border border-gray-100 space-y-8 animate-fade">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-800">Định Hướng Nghiên Cứu Chiến Lược</h3>
          <p className="text-xs text-gray-500">Cung cấp mục tiêu cụ thể để Tổng Biên Tập xây dựng kế hoạch tối ưu</p>
        </div>
        
        {/* Nút gợi ý nhanh */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold text-gray-400 self-center uppercase mr-1">Gợi ý mẫu:</span>
          <button 
            type="button" 
            onClick={() => applyQuickTemplate('j&t')}
            className="text-[11px] px-2.5 py-1.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-[#F58220] rounded-lg text-gray-600 hover:text-[#F58220] transition-colors cursor-pointer"
          >
            Định Giá & Chặng Cuối
          </button>
          <button 
            type="button" 
            onClick={() => applyQuickTemplate('ninjavan')}
            className="text-[11px] px-2.5 py-1.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-[#F58220] rounded-lg text-gray-600 hover:text-[#F58220] transition-colors cursor-pointer"
          >
            Kho Thông Minh & Fulfillment
          </button>
          <button 
            type="button" 
            onClick={() => applyQuickTemplate('tiktok')}
            className="text-[11px] px-2.5 py-1.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-[#F58220] rounded-lg text-gray-600 hover:text-[#F58220] transition-colors cursor-pointer"
          >
            Xuyên Biên Giới (Cross-Border)
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Ô 1: Chủ đề / Mục tiêu */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#F58220]" />
            1. Chủ đề / Mục tiêu cốt lõi của nghiên cứu này là gì?
          </label>
          <textarea
            required
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ví dụ: Phân tích cơ chế tối ưu hóa chi phí vận hành chặng cuối và mạng lưới bưu cục nhằm cạnh tranh..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>

        {/* Ô 2: Đối thủ cạnh tranh */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#F58220]" />
            2. Các đối thủ cạnh tranh hoặc doanh nghiệp mục tiêu cần phân tích?
          </label>
          <input
            required
            type="text"
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            placeholder="Ví dụ: J&T Express, SPX Express, Viettel Post..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all text-gray-800"
          />
        </div>

        {/* Ô 3: Chỉ số quan tâm */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#F58220]" />
            3. Các chỉ số hoặc khía cạnh bạn đặc biệt quan tâm (Giá cước, mạng lưới, kho bãi...)?
          </label>
          <textarea
            required
            rows={2}
            value={metrics}
            onChange={(e) => setMetrics(e.target.value)}
            placeholder="Ví dụ: Chính sách chiết khấu KAs, tỷ lệ hoàn trả hàng (Return rate), diện tích và mức độ tự động hóa kho bãi..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>
      </div>

      {/* Button submit */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-xs md:text-sm cursor-pointer ${
            isLoading || !isFormValid
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-[#F58220] hover:bg-[#E06B16] text-white hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang phân tích định hướng...
            </>
          ) : (
            <>
              Lập Kế Hoạch Nghiên Cứu
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
