import { NextResponse } from 'next/server';
import { callAIProvider } from '@/lib/ai';

// Định nghĩa kiểu dữ liệu request body
interface PlanRequest {
  query: {
    context: string;
    goal: string;
    competitors: string;
    metrics: string;
    constraints: string;
  };
  synthesisModel: string;
  searchModels: string[];
  apiKeys: Record<string, string>;
}

// Hàm sinh mock data chất lượng cao nếu không có API key
const generateMockPlan = (goal: string, competitors: string, metrics: string, searchModels: string[], synthesisModel: string) => {
  const prompts: Record<string, string> = {};
  
  searchModels.forEach(model => {
    if (model.includes('Perplexity')) {
      prompts[model] = `Conduct an in-depth, up-to-date web search regarding: "${goal}". 
Specifically analyze our core competitors: "${competitors}" on aspects: "${metrics}".
Search for official industry reports, market shares, financial filings, pricing structures, and recent logistics news. 
Focus on quantitative metrics, pricing tables, and network expansion announcements from 2025/2026. 
Provide direct source URLs and references for every claim. Output in professional strategic English.`;
    } else if (model.includes('Moonshot') || model.includes('Kimi')) {
      prompts[model] = `针对以下物流与供应链研究目标进行深度调研：
研究主题: "${goal}"
竞争对手/目标分析: "${competitors}"
核心关注维度: "${metrics}"

请利用您的中文本土搜索与分析优势，深入调研中国物流行业、智能仓储、跨境电商物流（如极兔 J&T, 菜鸟, 顺丰 SF Express 等）在上述维度的最佳实践、运营模式、中港/跨境运费结构以及最新的行业白皮书。
请重点挖掘：
1. 仓配一体化与自动化网络布局。
2. 针对此类竞争对手的最新中资背景物流企业的出海策略及价格战应对策略。
请使用中文输出，并附带权威行业报告链接或参考来源。`;
    } else if (model.includes('DeepSeek')) {
      prompts[model] = `Hãy tiến hành phân tích sâu sắc cấu trúc logic vận hành của các doanh nghiệp đối thủ: "${competitors}" dựa trên mục tiêu: "${goal}".
Tập trung làm rõ khía cạnh: "${metrics}".
Hãy bóc tách:
1. Mô hình chi phí: Phân tích cơ cấu chi phí chặng đầu (First-mile), chia chọn (Sorting), và chặng cuối (Last-mile). Làm thế nào các đối thủ tối ưu hóa các chi phí này?
2. Điểm nghẽn mạng lưới: Đâu là điểm yếu cốt lõi trong hệ thống phân phối của họ?
3. Kiến trúc công nghệ ứng dụng (AI routing, hệ thống quản lý kho WMS/TMS).
Hãy trả lời chi tiết bằng Tiếng Việt, lập luận chặt chẽ và có cấu trúc bảng biểu dữ liệu phân tích kỹ thuật.`;
    } else if (model.includes('Anthropic') || model.includes('claude')) {
      prompts[model] = `Bạn là chuyên gia phân tích chiến lược cao cấp của GHN. Hãy thực hiện khảo sát chi tiết về "${goal}".
Đối thủ phân tích: "${competitors}". Khía cạnh đặc biệt quan tâm: "${metrics}".
Hãy thu thập và xây dựng ma trận so sánh SWOT toàn diện giữa Giao Hàng Nhanh (GHN) và các đối thủ này dựa trên các tiêu chí quan tâm ở trên. 
Đặc biệt chỉ ra các bài học thành công (Case studies) và các sai lầm cần tránh trong quản trị vận hành kho bãi hoặc thiết lập bảng giá cước.
Trả về báo cáo phân tích bằng Tiếng Việt chuyên nghiệp.`;
    } else if (model.includes('Google') || model.includes('gemini')) {
      prompts[model] = `Hãy thu thập toàn bộ dữ liệu công khai và tổng hợp nhanh cấu trúc vận hành của "${competitors}" liên quan đến chủ đề "${goal}".
Đặc biệt tập trung phân tích các thông số quan trọng sau: "${metrics}".
Yêu cầu:
1. Tổng hợp dữ liệu thành bảng so sánh trực quan về mạng lưới bưu cục, diện tích kho bãi, và chính sách chiết khấu/giá cước.
2. Trích xuất chính xác các nguồn dữ liệu tin cậy (báo cáo thường niên, website chính thức, thông tin báo chí).
Trả về kết quả bằng Tiếng Việt.`;
    } else {
      // OpenAI hoặc mặc định
      prompts[model] = `Phân tích dữ liệu đa chiều về: "${goal}".
Doanh nghiệp mục tiêu: "${competitors}".
Khía cạnh nghiên cứu: "${metrics}".
Hãy tìm kiếm và tổng hợp thông tin từ các nguồn dữ liệu số lớn, phân tích cấu trúc dịch vụ, chiến lược định giá, hiệu quả giao hàng chặng cuối và các phản hồi từ khách hàng doanh nghiệp (B2B) của các đối thủ trên thị trường.
Trả về phân tích tóm tắt bằng Tiếng Việt kèm các đầu mục số liệu rõ ràng.`;
    }
  });

  return {
    prompts,
    planning_summary: `[Chế độ thử nghiệm] Đã lập kế hoạch nghiên cứu chiến lược cho mục tiêu "${goal}". Tổng biên tập [${synthesisModel}] đã phân tích các đối thủ (${competitors}) và tự động biên soạn ${searchModels.length} đoạn prompt tối ưu riêng biệt gửi tới các Search Models song song để khai thác sâu về khía cạnh "${metrics}".`,
    isMocked: true
  };
};

export async function POST(req: Request) {
  try {
    const body: PlanRequest = await req.json();
    const { query, synthesisModel, searchModels, apiKeys } = body;

    if (!query || !query.goal || !synthesisModel || !searchModels || searchModels.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin: Mục tiêu nghiên cứu, Model tổng hợp và ít nhất 1 Model tìm tin.' },
        { status: 400 }
      );
    }

    // Xác định nhà cung cấp và API key cho Synthesis Model
    let provider = '';
    let apiKeyName = '';
    let modelName = '';

    const modelMatch = synthesisModel.match(/\(([^)]+)\)/);
    const rawModelName = modelMatch ? modelMatch[1] : synthesisModel;

    if (synthesisModel.includes('claude')) {
      provider = 'anthropic';
      apiKeyName = 'anthropic';
      modelName = rawModelName;
    } else if (synthesisModel.includes('gpt') || synthesisModel.includes('o1')) {
      provider = 'openai';
      apiKeyName = 'openai';
      modelName = rawModelName;
    } else if (synthesisModel.includes('gemini')) {
      provider = 'google';
      apiKeyName = 'google';
      modelName = rawModelName;
    }

    const synthesisApiKey = apiKeys[apiKeyName] || '';

    // Nếu không có API Key, tự động chuyển sang chế độ Mock cao cấp
    if (!synthesisApiKey) {
      console.log(`Không tìm thấy API Key cho ${provider}. Kích hoạt chế độ lập kế hoạch thử nghiệm chất lượng cao.`);
      const mockResult = generateMockPlan(query.goal, query.competitors, query.metrics, searchModels, synthesisModel);
      return NextResponse.json(mockResult);
    }

    // Soạn thảo prompt hệ thống cho Synthesis Model để tạo các prompt tìm tin
    const systemPrompt = `Bạn là Model Tổng Biên Tập (Synthesis Model) của NexusAI - hệ thống nghiên cứu chiến lược tự động của Giao Hàng Nhanh (GHN).
Nhiệm vụ của bạn là nhận thông tin mục tiêu nghiên cứu và tạo ra các đoạn prompt tối ưu riêng biệt cho từng chatbot Tìm kiếm thông tin (Search Models) đã được chọn.

Bắt buộc phản hồi dưới dạng JSON thuần túy (không bọc trong thẻ markdown \`\`\`json) với cấu trúc:
{
  "prompts": {
    "Tên_Search_Model_1": "Nội dung đoạn prompt tối ưu chi tiết...",
    "Tên_Search_Model_2": "Nội dung đoạn prompt tối ưu chi tiết..."
  },
  "planning_summary": "Tóm tắt ngắn gọn kế hoạch hành động chiến lược và lý do thiết kế các prompt này..."
}`;

    const userPrompt = `Dữ liệu nghiên cứu của Strategy Manager:
- Bối cảnh (Context): "${query.context}"
- Chủ đề/Mục tiêu (Goal): "${query.goal}"
- Đối thủ cần phân tích: "${query.competitors}"
- Khía cạnh cần tập trung: "${query.metrics}"
- Các ràng buộc (Constraints): "${query.constraints || 'Không có'}"

Danh sách các Search Models (Chatbot Tools) được chọn để gửi prompt:
${searchModels.map(m => `- ${m}`).join('\n')}

Hãy tạo ra các prompt chuyên sâu tương ứng cho từng Chatbot Tool. BẠN PHẢI tối ưu hóa để người dùng Copy-Paste những prompt này vào ChatGPT/Perplexity/Kimi.
Lưu ý đặc biệt:
- YÊU CẦU BẮT BUỘC CHUNG: BẠN PHẢI thêm lệnh này vào mọi prompt: "BẮT BUỘC: Hãy nhúng thẳng các đường link nguồn (URL) vào trong văn bản theo định dạng [Source](URL) tại bất kỳ chỗ nào bạn đưa ra số liệu hoặc thông tin. KHÔNG ĐƯỢC CHỈ ĐỂ LINK Ở CUỐI BÀI. Tôi cần copy paste kết quả của bạn nên link phải nằm ngay trong text."
- Nếu có "Moonshot AI" hoặc "Kimi": Viết prompt bằng Tiếng Trung nhắm vào việc khai thác thông tin kho bãi, logistics từ nguồn Trung Quốc.
- Nếu có "Perplexity": Viết prompt bằng Tiếng Anh học thuật chất lượng cao kèm các yêu cầu trích dẫn số liệu thị trường mới nhất.
- Nếu có "DeepSeek": Viết prompt yêu cầu lập luận chuyên sâu về tối ưu chặng cuối hoặc chi phí.
- Các model khác: Viết prompt bằng Tiếng Việt tập trung thu thập dữ liệu cấu trúc dịch vụ và thế mạnh cạnh tranh.`;

    try {
      const response = await callAIProvider(provider, modelName, synthesisApiKey, userPrompt, systemPrompt);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Parse JSON trả về từ AI
      let parsedResponse;
      try {
        // Làm sạch phản hồi nếu AI có bọc \`\`\`json ... \`\`\`
        let cleanContent = response.content.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
        }
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Lỗi parse JSON phản hồi AI:', response.content);
        // Fallback tạo mock nếu lỗi parse
        const mockResult = generateMockPlan(query.goal, query.competitors, query.metrics, searchModels, synthesisModel);
        return NextResponse.json({
          ...mockResult,
          warning: 'Không thể parse JSON từ AI, hệ thống tự động sử dụng mẫu tối ưu hóa.'
        });
      }

      return NextResponse.json({
        prompts: parsedResponse.prompts || {},
        planning_summary: parsedResponse.planning_summary || `Đã thiết lập kế hoạch nghiên cứu thành công bằng model ${synthesisModel}.`,
        isMocked: false
      });

    } catch (apiError: any) {
      console.error('Lỗi khi gọi API Tổng Biên Tập:', apiError);
      // Fallback sang Mock
      const mockResult = generateMockPlan(query.goal, query.competitors, query.metrics, searchModels, synthesisModel);
      return NextResponse.json({
        ...mockResult,
        warning: `Đã tự động chuyển sang chế độ Thử nghiệm do lỗi API: ${apiError.message}`
      });
    }

  } catch (err: any) {
    console.error('Lỗi máy chủ /api/orchestrate/plan:', err);
    return NextResponse.json({ error: err.message || 'Lỗi xử lý nội bộ' }, { status: 500 });
  }
}
