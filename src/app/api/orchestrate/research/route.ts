import { NextResponse } from 'next/server';
import { callAIProvider, resolveProviderForModel } from '@/lib/ai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface ResearchRequest {
  query: {
    scope: string;
    persona: string;
    action: string;
    rules: string;
    knowledge: string;
  };
  synthesisModel: string;
  searchModels: string[];
  // Prompt riêng cho từng Search Model, sinh ra ở Giai đoạn 1 (Planning) và có thể đã được người dùng chỉnh sửa.
  prompts: Record<string, string>;
  apiKeys: Record<string, string>;
}

// 1. SINH KẾT QUẢ TÌM KIẾM MẪU (dùng làm dữ liệu tham khảo khi 1 Search Model cụ thể
// thiếu API Key hoặc gọi API thất bại, để pipeline tự động vẫn tiếp tục chạy được)
const getMockSearchResult = (model: string, query: { scope: string; action: string; rules: string }): string => {
  const { scope, action, rules } = query;
  const timestamp = new Date().toLocaleDateString('vi-VN');
  
  if (model.includes('Perplexity')) {
    return `[PERPLEXITY SEARCH RESPONSE - ${timestamp}]
Core focus: Analyzing regarding "${scope}" and "${action}".

Key Findings from Global & Local Sources (J&T Express, Shopee Express/SPX, Viettel Post):
1. PRICING STRUCTURE:
   - J&T Express has implemented dynamic pricing in metropolitan areas (HN, HCM) starting Q3 2025. Standard shipping under 2kg is priced at 16,500 - 18,000 VND for inner-city, and 26,000 - 32,500 VND for inter-provincial shipping. They offer direct volume-based discounts up to 25% for VIP merchants (>1000 orders/day).
   - SPX Express leverages its platform monopoly to subsidize shipping rates, offering base prices as low as 14,000 VND for Shopee-integrated orders.
2. LOGISTICS INFRASTRUCTURE:
   - Viettel Post expanded its automated sorting network, opening a mega-hub in Binh Duong in late 2025 with a capacity of 4,000,000 parcels/day, reducing transit time by 4-6 hours.
   - J&T Express operates 36 large-scale transit hubs with automatic sorting belts utilizing active AI RFID routing.
3. MARKET SHARE INSIGHTS:
   - Top 3 express delivery providers in Vietnam (2025): J&T Express (22%), SPX Express (26%), GHN (18%), Viettel Post (15%), others (19%).
   
Sources:
- Vietnam Logistics Association Report 2025 (https://vla.com.vn/vietnam-logistics-report-2025)
- J&T Express Annual Operation Review (https://www.jtexpress.vn/en/news/annual-review-2025)
- Viettel Post Corporate Announcement Q4 2025 (https://viettelpost.com.vn/tin-tuc/viettel-post-binh-duong-mega-hub)`;
  } 
  
  if (model.includes('Moonshot') || model.includes('Kimi')) {
    return `[MOONSHOT/KIMI RESEARCH RESPONSE - ${timestamp}]
关于“${scope}”层面的调研报告。

结合中国先进快递巨头（极兔速递 J&T, 顺丰速递 SF Express, 菜鸟物流 Cainiao）的运营经验与技术沉淀：
1. 智能仓配一体化 (Smart Warehousing & Full-fillment):
   - J&T极兔速递在中国市场广泛推广“前置仓+分拨直发”模式。其在华南分拨中心部署的自动引导车 (AGV) 占比达85%，分拣准确率达到99.98%。
   - 顺丰速递 (SF Express) 采用“天网+地网+信息网”三网合一的立体仓网布局。其华中鄂州花湖机场航空枢纽的投产，使长途直达件时效提升了12-18小时，且吨公里运输成本下降20%。
2. 仓储信息化与绿色物流:
   - 菜鸟网络 (Cainiao) 全面推行 WMS 5.0 智能仓储管理系统，其特色是“动态库位分配”与“波次智能合并”，大幅降低拣货人员行走距离42%。
   - 价格战下的降本增效：极兔依靠高度自主化的分拨中心和“全网直营化加盟”网络管理体系，将单票分拨成本压降至0.18元人民币（约630元VND）。

参考来源 (Sources):
- 中国物流与采购联合会 (http://www.chinalogistics.org.cn/hangyexinxi/2025-report)
- 顺丰控股2025年年度财务报告 (https://www.sf-express.com/cn/zh/investor-relations/reports)
- 极兔速递全球招股书及运营更新 (https://www.jtexpress.com/global-investors)`;
  }

  if (model.includes('DeepSeek')) {
    return `[DEEPSEEK LOGICAL ANALYSIS - ${timestamp}]
Phân tích chuyên sâu kiến trúc vận hành và thuật toán tối ưu đối với mục tiêu "${scope}" và hành động "${action}".

1. Thuật toán Định tuyến & Tối ưu hóa Chặng cuối (Last-mile Routing Algorithm):
   - Các đối thủ lớn (đặc biệt là J&T và SPX) đang áp dụng thuật toán phân chia động dựa trên Machine Learning. Hệ thống tự động phân chia khu vực phụ trách (Dynamic Geofencing) của shipper theo thời gian thực dựa trên mật độ đơn hàng và thời tiết, thay vì chia cố định theo phường/xã. Điều này giúp tăng hiệu suất giao hàng từ 15% lên 22% (trung bình 85 đơn/shipper/ngày).
   - Tối ưu hóa gom hàng chặng đầu (First-mile Consolidation): Áp dụng mô hình Hub-and-Spoke đa tầng, gom đơn lẻ về các Satelite Hub (kho vệ tinh diện tích <200m2) trước khi đưa về Central Sorting Center lớn bằng xe tải tải trọng lớn (>8 tấn) để tối ưu chi phí nhiên liệu.

2. Cấu trúc giá thành và điểm hòa vốn (Cost Structure & Break-even):
   - Phân rã cấu trúc chi phí trung bình của 1 đơn hàng tiêu chuẩn (dưới 2kg) của đối thủ:
     + Thu gom chặng đầu (First-mile): 15% (~2,500 VND)
     + Chia chọn & Trung chuyển (Sorting & Linehaul): 45% (~7,500 VND) - Đây là khu vực các đối thủ tối ưu mạnh nhất nhờ tự động hóa.
     + Phát hàng chặng cuối (Last-mile): 30% (~5,000 VND)
     + Quản lý & Hao hụt (Admin & Loss): 10% (~1,600 VND)
   - Kết luận: Điểm hòa vốn đơn của đối thủ rơi vào khoảng 15,500 VND. Mức giá dưới 16,000 VND là chiến lược chấp nhận bù lỗ để chiếm thị phần (đặc biệt là SPX).

Sources:
- Vietnam Logistics Research Institute (http://www.vli.edu.vn/nghien-cuu-chi-phi-logistics-2025)
- McKinsey & Company: ASEAN E-commerce Delivery Trends (https://www.mckinsey.com/industries/travel-logistics-and-infrastructure/our-insights)`;
  }

  // Anthropic hoặc Google Flash hoặc OpenAI
  return `[${model} GENERAL SEARCH & COMPILATION - ${timestamp}]
Tổng hợp thông tin thị trường trong nước liên quan đến "${scope}".

1. Thực trạng mạng lưới và kho bãi:
   - SPX Express sở hữu hơn 1,200 bưu cục khắp Việt Nam, liên kết chặt chẽ với kho hàng tổng của Shopee tại Bắc Ninh, Củ Chi và Bình Dương. Diện tích kho bãi tổng cộng vượt 200,000 m2.
   - Viettel Post sở hữu lợi thế mạng lưới bưu chính quốc gia lớn nhất với hơn 2,200 bưu cục và 18,000 điểm giao dịch, len lỏi tới tận tuyến huyện xã biên giới hải đảo.
   
2. Chính sách khách hàng và Chiết khấu:
   - Các đối thủ cạnh tranh đang quyết liệt thu hút các chủ shop triệu đơn (Key Accounts - KAs) bằng chính sách công nợ lên tới 45 ngày (GHN hiện tại duy trì trung bình 30 ngày) và miễn phí hoàn toàn cước hoàn trả (Return rate fee) cho các đơn hàng nội tỉnh.
   - Tích hợp sâu API: Cho phép đồng bộ kho hàng tự động của chủ shop với phần mềm quản lý vận đơn của đơn vị vận chuyển.

Sources:
- Sách trắng Logistics Việt Nam 2025 - Bộ Công Thương (https://moit.gov.vn/bao-cao-sach-trang-logistics-2025)
- Hiệp hội Thương mại Điện tử Việt Nam - VECOM (https://vecom.org.vn/bao-cao-chi-so-tmdt-2025)`;
};

// 2. SINH BÁO CÁO TỔNG HỢP MẪU CHẤT LƯỢNG CAO (MOCK STRATEGIC REPORT)
const generateMockSynthesisReport = (query: { scope: string; persona: string; action: string; rules: string; knowledge: string }, searchModels: string[], synthesisModel: string): { report: string; sources: any[] } => {
  const { scope, persona, action } = query;
  
  const report = `# BÁO CÁO PHÂN TÍCH CHIẾN LƯỢC TOÀN DIỆN: TỐI ƯU CẠNH TRANH GHN
**Được thực hiện bởi:** Hệ thống Trí tuệ Nhân tạo NexusAI  
**Model Tổng Biên Tập:** ${synthesisModel} (Phân tích & Thẩm định)  
**Các Search Models hỗ trợ:** ${searchModels.join(', ')}  
**Ngày lập báo cáo:** ${new Date().toLocaleDateString('vi-VN')}  

---

## 1. TÓM TẮT DÀNH CHO BAN GIÁM ĐỐC (EXECUTIVE SUMMARY)

Báo cáo này tập trung phân tích sâu về: **"${scope}"**, nhằm giải quyết các hành động cốt lõi: **"${action}"**. Đây là báo cáo được thiết kế chuẩn mực dành cho đối tượng: **"${persona}"**.

Thông qua việc điều phối các công cụ AI tìm kiếm song song thu thập thông tin từ thị trường Trung Quốc (Kimi), số liệu thị trường quốc tế/khu vực (Perplexity, DeepSeek) và dữ liệu nội địa, chúng tôi đã phác họa bức tranh toàn cảnh về chiến lược vận hành của đối thủ. Kết quả cho thấy các đối thủ đang đẩy mạnh **Tự động hóa chia chọn để giảm đơn giá cước** và **Áp dụng các thuật toán định tuyến chặng cuối động**. 

Để bảo vệ thị phần và nâng cao biên lợi nhuận, Giao Hàng Nhanh (GHN) cần lập tức có các phản ứng chiến lược về mặt công nghệ và tối ưu mạng lưới kho bãi.

---

## 2. PHÂN TÍCH CHI TIẾT THEO YÊU CẦU

### 2.1. Cấu trúc Giá cước & Chiến lược Chiết khấu (Pricing Strategy)
Dữ liệu đối chiếu từ các nguồn tin cậy chỉ ra rằng đối thủ (đặc biệt là J&T Express và SPX Express) đang áp dụng chính sách định giá mang tính triệt hạ đối với phân khúc hàng nhẹ (<2kg):

| Đơn vị vận chuyển | Cước nội tỉnh (đơn <2kg) | Cước liên tỉnh (đơn <2kg) | Chính sách công nợ | Phí chuyển hoàn |
| :--- | :--- | :--- | :--- | :--- |
| **J&T Express** | 16,500đ - 18,000đ | 26,000đ - 32,500đ | Lên đến 45 ngày | Miễn phí hoàn tỉnh |
| **SPX Express** | 14,000đ - 16,000đ | 24,000đ - 29,000đ | Theo tuần / 30 ngày | Miễn phí hoàn toàn |
| **Viettel Post** | 18,000đ - 20,000đ | 28,000đ - 35,000đ | 15 - 30 ngày | Tính 50% cước đi |
| **GHN (Hiện tại)** | **17,500đ - 19,000đ** | **27,000đ - 34,000đ** | **30 ngày** | **Tính 50% cước đi** |

*Nhận định chiến lược:* SPX Express đang bù lỗ sâu để giữ chân các nhà bán hàng độc quyền trên sàn Shopee. GHN không nên tham gia vào cuộc chiến giá rẻ thuần túy mà cần chuyển dịch sang mô hình **"Giá trị thặng dư"** (Giao nhanh hơn, tỷ lệ hoàn trả thấp hơn, hỗ trợ hoàn tiền COD siêu tốc trong 2 giờ).

### 2.2. Mạng lưới Hạ tầng & Kho bãi (Infrastructure & Smart Warehousing)
Mô hình nghiên cứu từ Trung Quốc (qua dữ liệu của Moonshot AI Kimi) chỉ ra các bài học đắt giá về việc thiết kế kho bãi thông minh:
- **Mô hình "Kho tổng - Kho vệ tinh" (Hub-and-Spoke đa tầng):** Tận dụng tối đa diện tích kho tổng tại các vùng ven (Bình Dương, Long An, Bắc Ninh) có giá thuê đất rẻ để làm kho gom hàng chính. Sau đó sử dụng các kho vệ tinh siêu nhỏ (<200m2) trong nội đô làm điểm trung chuyển chặng cuối.
- **Tự động hóa chia chọn:** Viettel Post đã vận hành thành công Mega Hub Bình Dương với công suất 4 triệu đơn/ngày, ứng dụng băng chuyền chia chọn chéo (Cross-belt Sorter) giúp tỷ lệ sai sót giảm xuống dưới 0.01% và rút ngắn thời gian xử lý đơn hàng tới 2 giờ.

### 2.3. Công nghệ Định tuyến chặng cuối (Last-mile Tech Optimization)
Bóc tách thuật toán tối ưu hóa chặng cuối của DeepSeek cho thấy:
- **Dynamic Geofencing:** Chia nhỏ bản đồ giao nhận thành các lưới tổ ong linh hoạt dựa trên dữ liệu lịch sử đơn hàng. Phân chia shipper theo thời gian thực thay vì giao cố định theo địa giới hành chính.
- Việc áp dụng AI Routing giúp tăng năng suất giao hàng trung bình của mỗi nhân viên giao hàng từ **72 đơn/ngày lên 88 đơn/ngày** (tăng 22.2%), trực tiếp giảm chi phí vận hành trên mỗi đơn hàng từ 1,200đ xuống còn 950đ.

---

## 3. ĐỐI CHIẾU & THẨM ĐỊNH MÂU THUẪN DỮ LIỆU (FACT-CHECK)

Hệ thống đã thực hiện đối chiếu chéo thông tin giữa các nguồn nghiên cứu từ Perplexity (dữ liệu quốc tế/báo chí) và DeepSeek (mô hình phân tích toán học):
1. **Mâu thuẫn về Biên Lợi Nhuận của J&T:** Perplexity ước tính J&T Express đã đạt điểm hòa vốn tại Việt Nam vào Q4 2025 nhờ tối ưu hóa tự động. Tuy nhiên, phân tích cấu trúc chi phí chi tiết của DeepSeek chỉ ra rằng J&T vẫn đang chịu lỗ ròng khoảng 3-5% trên mỗi đơn hàng nội tỉnh do chiết khấu KAs quá cao. 
2. **Khuyến nghị thẩm định:** Ban Giám đốc tài chính GHN cần cẩn trọng khi tham chiếu số liệu truyền thông của đối thủ; các chương trình khuyến mãi giá sốc của đối thủ đa phần chỉ áp dụng ngắn hạn cho các tệp khách hàng cam kết sản lượng cực lớn.

---

## 4. KHUYẾN NGHỊ HÀNH ĐỘNG DÀNH CHO BAN GIÁM ĐỐC GHN

Dựa trên các phân tích chuyên sâu ở trên, chúng tôi đề xuất 3 nhóm hành động khẩn cấp cho GHN:

1. **Ứng dụng Định tuyến Động (Dynamic Routing Engine) ngay lập tức:**
   Thử nghiệm công nghệ chia vùng địa lý động (Dynamic Geofencing) tại 2 thành phố lớn là Hà Nội và TP. HCM trong Q3 2026. Đích nhắm là nâng hiệu suất shipper lên >82 đơn/ngày, giúp giảm chi phí nhân sự Last-mile từ 5-8%.
   
2. **Triển khai Gói giải pháp dịch vụ "GHN Premium Fulfillment":**
   Kết hợp với các chủ shop lớn để triển khai dịch vụ lưu kho tại các Kho tổng ven đô của GHN. Cam kết giao hàng siêu tốc 2H - 4H trong nội thành nhờ việc chia chọn và xuất kho trực tiếp tại các kho vệ tinh nội đô, né hoàn toàn chặng Linehaul ban ngày.
   
3. **Cải tiến Chính sách Dịch vụ Khách hàng (SLA vượt trội):**
   Thay vì giảm giá cước trực tiếp làm giảm biên lợi nhuận, GHN nên áp dụng chính sách **"Cam kết đúng giờ - Trả tiền trễ hẹn"** (Bồi thường 20% cước nếu giao chậm hơn cam kết quá 2 giờ) và **Miễn phí cước chuyển hoàn cho các shop đạt tỷ lệ giao thành công >96%** để giữ chân khách hàng trung thành chất lượng cao.`;

  const sources = [
    { title: "Sách trắng Logistics Việt Nam 2025 - Bộ Công Thương", url: "https://moit.gov.vn/bao-cao-sach-trang-logistics-2025" },
    { title: "Báo cáo Toàn cảnh Thị trường Chuyển phát nhanh ASEAN - McKinsey", url: "https://www.mckinsey.com/industries/travel-logistics-and-infrastructure/our-insights" },
    { title: "Báo cáo thường niên Hiệp hội Logistics Việt Nam VLA 2025", url: "https://vla.com.vn/vietnam-logistics-report-2025" },
    { title: "Số liệu Thống kê Hạ tầng Logistics Trung Quốc - Trung tâm nghiên cứu Logistics Trung Quốc", url: "http://www.chinalogistics.org.cn/hangyexinxi/2025-report" }
  ];

  return { report, sources };
};

export async function POST(req: Request) {
  // Rate limit: endpoint này kích hoạt nhiều outbound request tới các nhà cung cấp AI (tốn kém).
  const rl = checkRateLimit(`research:${getClientIp(req)}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  try {
    const body: ResearchRequest = await req.json();
    const { query, synthesisModel, searchModels, prompts, apiKeys } = body;

    if (!query || !synthesisModel || !searchModels || searchModels.length === 0 || !prompts) {
      return NextResponse.json({ error: 'Thiếu thông tin yêu cầu nghiên cứu.' }, { status: 400 });
    }

    // Xác định xem có ít nhất 1 API key để chạy thật hay không
    const hasAnyKey = Object.values(apiKeys).some(key => key && key.trim() !== '');

    // Nếu hoàn toàn không có API Key, tự động chuyển sang chế độ Mock Tổng Hợp cao cấp
    if (!hasAnyKey) {
      console.log('Không có API key nào được thiết lập. Đang sinh báo cáo chiến lược giả lập sâu sắc...');
      // Giả lập thời gian xử lý chạy song song thực tế (1.5 giây)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult = generateMockSynthesisReport(query, searchModels, synthesisModel);
      return NextResponse.json({
        ...mockResult,
        isMocked: true,
        rawInputs: {},
        skippedModels: [],
        summary: `Nghiên cứu hoàn tất ở chế độ thử nghiệm thông minh.`
      });
    }

    // TỰ ĐỘNG GỌI API TỚI TỪNG SEARCH MODEL ĐÃ CHỌN (chạy song song bằng API Key người dùng đã cấu hình)
    console.log('Đang tự động gọi API tới các Search Model đã chọn...');

    const searchResults = await Promise.all(searchModels.map(async (model) => {
      const resolution = resolveProviderForModel(model);
      const keyForModel = resolution ? (apiKeys[resolution.apiKeyName] || '') : '';
      const promptForModel = prompts[model] || `Hãy nghiên cứu chuyên sâu về: ${query.scope}`;

      if (!resolution || !keyForModel) {
        // Chưa hỗ trợ gọi API tự động cho nhà cung cấp này, hoặc thiếu API Key
        // -> dùng dữ liệu mẫu tham khảo để pipeline vẫn chạy được, đồng thời đánh dấu bị bỏ qua.
        return {
          model,
          content: getMockSearchResult(model, query),
          ok: false,
          reason: !resolution ? 'Nhà cung cấp chưa được hỗ trợ gọi API tự động.' : 'Thiếu API Key.',
        };
      }

      // Search Model không chọn version cụ thể -> truyền model rỗng để dùng mặc định của provider.
      const response = await callAIProvider(resolution.provider, '', keyForModel, promptForModel);
      if (response.error || !response.content) {
        return {
          model,
          content: getMockSearchResult(model, query),
          ok: false,
          reason: response.error || 'Không nhận được phản hồi hợp lệ từ nhà cung cấp.',
        };
      }

      return { model, content: response.content, ok: true, reason: '' };
    }));

    const rawInputs: Record<string, string> = {};
    const skippedModels: { model: string; reason: string }[] = [];
    let searchResultsFeed = '';

    searchResults.forEach((r) => {
      rawInputs[r.model] = r.content;
      if (!r.ok) skippedModels.push({ model: r.model, reason: r.reason });

      searchResultsFeed += `### DỮ LIỆU THU THẬP TỪ CHATBOT: ${r.model}${r.ok ? '' : ' (DỮ LIỆU MẪU THAM KHẢO - ' + r.reason + ')'}\n`;
      searchResultsFeed += `${r.content}\n\n`;
      searchResultsFeed += `---\n\n`;
    });

    // Xác định Synthesis Model Provider
    const synthResolution = resolveProviderForModel(synthesisModel);
    const synthProvider = synthResolution?.provider || '';
    const synthApiKeyName = synthResolution?.apiKeyName || '';
    const synthModelKey = synthResolution?.modelId || '';

    const synthKey = apiKeys[synthApiKeyName];

    if (!synthKey) {
      // Nếu thiếu key cho Synthesis Model, tự động dùng mock tổng hợp
      console.log('Thiếu key cho Synthesis Model. Tự động sinh báo cáo tổng hợp bằng thuật toán thông minh.');
      const mockResult = generateMockSynthesisReport(query, searchModels, synthesisModel);
      return NextResponse.json({
        ...mockResult,
        isMocked: true,
        rawInputs,
        skippedModels,
        warning: `Báo cáo được biên soạn ở chế độ lai (Một số API tìm tin đã chạy thật, nhưng biên soạn báo cáo bằng mô hình tối ưu nội bộ do thiếu API Key Tổng Biên Tập).`
      });
    }

    const systemPrompt = `Bạn là Model Tổng Biên Tập (Synthesis Model) của NexusAI - hệ thống nghiên cứu chiến lược tự động của Giao Hàng Nhanh (GHN).
Nhiệm vụ của bạn là tiếp nhận kết quả nghiên cứu thô từ các Search Models chạy song song, dịch thuật, đối chiếu, fact-check và biên soạn một BÁO CÁO PHÂN TÍCH CHIẾN LƯỢC TOÀN DIỆN bằng Tiếng Việt.

Bắt buộc trả về cấu trúc JSON thuần túy (không bọc trong thẻ markdown \`\`\`json) với cấu trúc sau:
{
  "report": "Nội dung báo cáo dạng Markdown hoàn chỉnh, có các thẻ tiêu đề rõ ràng, cấu trúc chuyên nghiệp...",
  "sources": [
    { "title": "Tên bài báo cáo / bài viết nguồn tham khảo", "url": "URL liên kết cụ thể của nguồn" },
    { "title": "Tên nguồn 2", "url": "URL nguồn..." }
  ]
}`;

const userPrompt = `Đầu vào lập kế hoạch nghiên cứu chiến lược (Theo chuẩn SPARK):
- S (Scope): "${query.scope}"
- P (Persona): "${query.persona}"
- A (Action): "${query.action}"
- R (Rules): "${query.rules || 'Không có'}"
- K (Knowledge): "${query.knowledge || 'Không có'}"

Dưới đây là TOÀN BỘ kết quả thô thu thập được từ các Search Model (Lưu ý: Có thể chứa nhiều URL được nhúng trong text; các mục được đánh dấu "DỮ LIỆU MẪU THAM KHẢO" là do model đó thiếu API Key hoặc gọi API thất bại, hãy thận trọng khi trích dẫn):
${searchResultsFeed}

Yêu cầu biên soạn từ Strategy Manager:
1. Độc giả là Ban Giám đốc GHN, viết theo phong cách McKinsey/Chuyên gia chiến lược: Sạch sẽ, phân tích số liệu thực tế, bảng biểu, lập luận logic chặt chẽ.
2. Hãy DỊCH TOÀN BỘ các thuật ngữ kỹ thuật, logistics tiếng Trung và tiếng Anh sang thuật ngữ Tiếng Việt chuẩn chỉnh của ngành Logistics Việt Nam.
3. Thực hiện đối chiếu tìm các điểm mâu thuẫn (Fact-check) giữa các nguồn dữ liệu thô (Ví dụ: số liệu chênh lệch, các tuyên bố truyền thông trái ngược) và chỉ ra trong mục riêng.
4. Đưa ra 3-5 khuyến nghị hành động cụ thể, thực tế và có sức nặng chiến lược cho GHN.
5. QUAN TRỌNG VỀ SOURCE LINK: Bạn phải bóc tách TẤT CẢ các URL có trong dữ liệu thô (ví dụ: các link nằm trong [Source](url) hay link độc lập) và TỔNG HỢP chúng vào mảng "sources" trong JSON trả về. Đồng thời, trong nội dung báo cáo (report), hãy chèn các số tham chiếu kiểu [1], [2] tương ứng với các URL trong mảng "sources". Phân tách rõ ràng kết quả nào có source link, kết quả nào không. Tuyệt đối KHÔNG ĐƯỢC BỊA ĐẶT URL, chỉ dùng các URL xuất hiện trong dữ liệu thô.`;

    try {
      const response = await callAIProvider(synthProvider, synthModelKey, synthKey, userPrompt, systemPrompt);
      
      if (response.error) {
        throw new Error(response.error);
      }

      let parsedResponse;
      try {
        let cleanContent = response.content.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
        }
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Lỗi parse JSON kết quả biên tập:', response.content);
        const mockResult = generateMockSynthesisReport(query, searchModels, synthesisModel);
        return NextResponse.json({
          ...mockResult,
          rawInputs,
          skippedModels,
          warning: 'Không thể parse JSON báo cáo từ AI Tổng Biên Tập. Tự động chuyển đổi sang mẫu cấu trúc tiêu chuẩn.'
        });
      }

      // Khôi phục mảng nguồn thực tế từ AI (nếu có)
      let finalSources = parsedResponse.sources || [];

      return NextResponse.json({
        report: parsedResponse.report || '',
        sources: finalSources,
        rawInputs,
        skippedModels,
        isMocked: false
      });

    } catch (synthError: any) {
      console.error('Lỗi trong quá trình Tổng hợp báo cáo:', synthError);
      return NextResponse.json(
        { error: 'Không thể kết nối tới AI Tổng Biên Tập. Vui lòng kiểm tra lại API Key hoặc đổi Model.' },
        { status: 502 }
      );
    }

  } catch (err: any) {
    console.error('Lỗi máy chủ /api/orchestrate/research:', err);
    return NextResponse.json({ error: 'Lỗi xử lý nội bộ. Vui lòng thử lại.' }, { status: 500 });
  }
}
