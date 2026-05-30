import React from 'react';
import { Target, Users, BarChart3, ArrowRight } from 'lucide-react';

interface ResearchFormProps {
  scope: string;
  setScope: (val: string) => void;
  persona: string;
  setPersona: (val: string) => void;
  action: string;
  setAction: (val: string) => void;
  rules: string;
  setRules: (val: string) => void;
  knowledge: string;
  setKnowledge: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function ResearchForm({
  scope,
  setScope,
  persona,
  setPersona,
  action,
  setAction,
  rules,
  setRules,
  knowledge,
  setKnowledge,
  onSubmit,
  isLoading
}: ResearchFormProps) {

  const applyQuickTemplate = (templateType: 'j&t' | 'ninjavan' | 'tiktok') => {
    if (templateType === 'j&t') {
      setScope('Nghiên cứu cấu trúc giá và thuật toán chặng cuối của đối thủ để làm báo cáo chiến lược cho CEO.');
      setPersona('Bạn là Strategy Manager tại Giao Hàng Nhanh (GHN), chuyên gia phân tích dữ liệu logistics với 10 năm kinh nghiệm. Phục vụ Ban Giám đốc.');
      setAction('1. Tìm kiếm bảng giá cước nội tỉnh và liên tỉnh của J&T và SPX. 2. Phân tích thuật toán định tuyến chặng cuối. 3. Đưa ra 3 khuyến nghị hành động.');
      setRules('MUST: Bảng giá dưới dạng table Markdown. MUST NOT: Không dùng thông tin cũ trước 2024. Cấm phân tích hàng cồng kềnh.');
      setKnowledge('Ví dụ: Tham khảo format báo cáo McKinsey. Cước phí tiêu chuẩn J&T <2kg: 16.500 VNĐ.');
    } else if (templateType === 'ninjavan') {
      setScope('Đánh giá công nghệ kho thông minh nội đô và Fulfillment B2B để nâng cấp hệ thống.');
      setPersona('Bạn là Giám đốc Công nghệ (CTO) và Vận hành. Đọc giả là Head of Fulfillment.');
      setAction('1. Thu thập tỷ lệ áp dụng AGV của Ninja Van và Viettel Post. 2. Tính toán chi phí lưu kho mỗi m2 tại vùng ven vs nội đô. 3. So sánh tính năng API WMS.');
      setRules('MUST: Phải có số liệu diện tích và chi phí ước tính. MUST NOT: Không nhắc tới hàng xuyên biên giới.');
      setKnowledge('Lưu ý: Viettel Post vừa mở Mega Hub ở Bình Dương.');
    } else if (templateType === 'tiktok') {
      setScope('Phân tích tiềm năng mở rộng vận tải xuyên biên giới (Cross-border) cho hàng thương mại điện tử từ Trung Quốc.');
      setPersona('Bạn là Chuyên gia phát triển thị trường xuyên biên giới (Cross-border Logistics Expert).');
      setAction('1. Quét dữ liệu thời gian trung chuyển và thủ tục hải quan từ Quảng Châu về Hà Nội. 2. Phân tích biểu phí của Best Express và Cainiao. 3. Xác định cơ hội cho GHN.');
      setRules('MUST: Trả lời bằng tiếng Việt chuyên ngành Logistics. MUST NOT: Không vượt quá 5 trang. Không viết lan man.');
      setKnowledge('Từ khóa: Tờ khai hải quan điện tử, Cainiao WMS, Hub Bằng Tường.');
    }
  };

  const isFormValid = scope.trim() !== '' && persona.trim() !== '' && action.trim() !== '';

  return (
    <form onSubmit={onSubmit} className="bg-white p-8 md:p-10 rounded-2xl shadow-md border border-gray-100 space-y-8 animate-fade">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-800">Định Hướng Nghiên Cứu Chiến Lược (Áp dụng SPARK Method)</h3>
          <p className="text-xs text-gray-500">Cung cấp bối cảnh rõ ràng theo chuẩn S-P-A-R-K để AI nghiên cứu chính xác nhất</p>
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
        {/* Ô 1: S - SCOPE */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#F58220]" />
            1. SCOPE - Phạm vi nghiên cứu (Kích hoạt khi nào?)
          </label>
          <textarea
            required
            rows={2}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Ví dụ: Đợt nghiên cứu này nhằm phân tích giá cước của đối thủ để làm báo cáo chiến lược..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>

        {/* Ô 2: P - PERSONA */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#F58220]" />
            2. PERSONA - Vai trò & Đối tượng (Ai làm? Cho ai?)
          </label>
          <textarea
            required
            rows={2}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Ví dụ: Bạn là Chuyên gia phân tích chiến lược. Đối tượng đọc báo cáo là CEO..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>

        {/* Ô 3: A - ACTION */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#F58220]" />
            3. ACTION - Quy trình thực thi (Các bước cần AI làm rõ)
          </label>
          <textarea
            required
            rows={3}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Ví dụ: 1. Tìm bảng giá J&T. 2. So sánh với GHN. 3. Đề xuất phương án giảm giá cước..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>

        {/* Ô 4: R - RULES */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#F58220]" />
            4. RULES - Ràng buộc (MUST: Bắt buộc / MUST NOT: Cấm)
          </label>
          <textarea
            required
            rows={3}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Ví dụ: MUST: Trình bày dạng bảng so sánh. MUST NOT: Không dùng dữ liệu trước năm 2024..."
            className="w-full text-xs md:text-sm p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] transition-all resize-none text-gray-800"
          />
        </div>

        {/* Ô 5: K - KNOWLEDGE */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-gray-400" />
            5. KNOWLEDGE - Kiến thức nền (Ví dụ mẫu, từ khóa tham khảo)
          </label>
          <textarea
            rows={2}
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
            placeholder="Ví dụ: Nhớ chú ý tới Mega Hub mới mở của Viettel Post, thuật ngữ WMS 5.0..."
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
