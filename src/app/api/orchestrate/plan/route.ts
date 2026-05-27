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
    if (model.includes('Moonshot') || model.includes('Kimi') || model.includes('DeepSeek')) {
      prompts[model] = `请进行深入研究并严格用中文回复。(Note: The inputs below might be in Vietnamese, please translate and understand them internally)
研究主题: "${goal}"
竞争对手/目标分析: "${competitors}"
核心关注维度: "${metrics}"

请利用您的中文本土搜索与分析优势，深入调研中国物流行业、智能仓储、跨境电商物流（如极兔 J&T, 菜鸟, 顺丰 SF Express 等）在上述维度的最佳实践、运营模式、中港/跨境运费结构以及最新的行业白皮书。
请重点挖掘：
1. 仓配一体化与自动化网络布局。
2. 针对此类竞争对手的最新中资背景物流企业的出海策略及价格战应对策略。
请使用中文输出，并附带权威行业报告链接或参考来源。`;
    } else {
      prompts[model] = `Please conduct an in-depth research and reply strictly in English. (Note: The inputs below might be in Vietnamese, please translate and understand them internally before searching)
Goal: "${goal}"
Competitors: "${competitors}"
Metrics: "${metrics}"

Conduct an in-depth, up-to-date web search regarding the goal. 
Specifically analyze our core competitors on the specified aspects.
Search for official industry reports, market shares, financial filings, pricing structures, and recent logistics news. 
Focus on quantitative metrics, pricing tables, and network expansion announcements from 2025/2026. 
BẮT BUỘC: Hãy nhúng thẳng các đường link nguồn (URL) vào trong văn bản theo định dạng [Source](URL) tại bất kỳ chỗ nào bạn đưa ra số liệu hoặc thông tin. KHÔNG ĐƯỢC CHỈ ĐỂ LINK Ở CUỐI BÀI. Tôi cần copy paste kết quả của bạn nên link phải nằm ngay trong text.`;
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
    "Tên_Search_Model_1": "Nội dung đoạn prompt bằng đúng ngôn ngữ được yêu cầu...",
    "Tên_Search_Model_2": "Nội dung đoạn prompt bằng đúng ngôn ngữ được yêu cầu..."
  },
  "planning_summary": "Tóm tắt bằng TIẾNG VIỆT về kế hoạch hành động chiến lược và lý do thiết kế các prompt này..."
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
- Nếu tên chatbot chứa "OpenAI", "GPT", "Anthropic", "Claude", "Google", "Gemini", hoặc "Perplexity": BẠN PHẢI VIẾT PROMPT HOÀN TOÀN BẰNG TIẾNG ANH (English). Phải bắt đầu prompt bằng câu: "Please conduct an in-depth research and reply strictly in English." Bạn PHẢI DỊCH TẤT CẢ các đầu vào (Goal, Context, Competitors, Metrics, Constraints) sang Tiếng Anh.
- Nếu tên chatbot chứa "DeepSeek", "Moonshot", hoặc "Kimi": BẠN PHẢI VIẾT PROMPT HOÀN TOÀN BẰNG TIẾNG TRUNG (Chinese). Phải bắt đầu prompt bằng câu: "请进行深入研究并严格用中文回复。" Bạn PHẢI DỊCH TẤT CẢ các đầu vào (Goal, Context, Competitors, Metrics, Constraints) sang Tiếng Trung.
- TUYỆT ĐỐI KHÔNG SỬ DỤNG TIẾNG VIỆT TRONG BẤT KỲ PROMPT NÀO (kể cả khi trích dẫn các đầu vào của người dùng, bạn cũng phải dịch chúng sang ngôn ngữ đích tương ứng). Tiếng Việt chỉ được sử dụng duy nhất ở trường "planning_summary".`;

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
