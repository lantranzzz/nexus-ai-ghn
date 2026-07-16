/**
 * AI Services Router for NexusAI
 * Hỗ trợ tích hợp 6 nhà cung cấp AI lớn cho việc Tìm kiếm và Tổng hợp thông tin
 */

// Định nghĩa kiểu dữ liệu cho phản hồi AI
export interface ChatCompletionResponse {
  content: string;
  error?: string;
  isMocked?: boolean;
}

// 1. GỌI API OPENAI (ChatGPT / GPT-4o / GPT-4o-mini / o1-mini)
export const callOpenAI = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key OpenAI trống');

    // Search Model tự động không chọn version cụ thể -> dùng model mặc định hợp lý.
    const finalModel = model || 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        ...(finalModel.includes('gpt-5') || finalModel.includes('o1') || finalModel.includes('o3') || finalModel.includes('o4') ? {} : { temperature: 0.3 }),
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error('Lỗi OpenAI:', error);
    return { content: '', error: error.message };
  }
};

// 2. GỌI API ANTHROPIC (Claude 3.5 Sonnet / Claude 3 Opus / Claude 3.5 Haiku)
export const callAnthropic = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key Anthropic trống');

    // Search Model tự động không chọn version cụ thể -> dùng alias mới nhất của Claude Sonnet.
    const finalModel = model || 'claude-3-5-sonnet-latest';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: finalModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        ...(systemPrompt ? { system: systemPrompt } : {}),
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.content[0].text };
  } catch (error: any) {
    console.error('Lỗi Anthropic:', error);
    return { content: '', error: error.message };
  }
};

// 3. GỌI API GOOGLE (Gemini 1.5 Pro / Gemini 1.5 Flash)
export const callGoogle = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key Google Gemini trống');

    const modelName = model.includes('gemini') ? model : 'gemini-1.5-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: (systemPrompt ? `${systemPrompt}\n\n` : '') + prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Định dạng phản hồi Gemini không hợp lệ');
    }
    return { content: data.candidates[0].content.parts[0].text };
  } catch (error: any) {
    console.error('Lỗi Google Gemini:', error);
    return { content: '', error: error.message };
  }
};

// Helper dùng chung cho các nhà cung cấp có API tương thích chuẩn OpenAI Chat Completions
// (Perplexity, DeepSeek, Moonshot/Kimi, xAI/Grok, Qwen đều theo đúng format request/response này).
const callOpenAICompatibleProvider = async (
  baseUrl: string,
  providerLabel: string,
  defaultModel: string,
  temperature: number,
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error(`API Key ${providerLabel} trống`);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || defaultModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error(`Lỗi ${providerLabel}:`, error);
    return { content: '', error: error.message };
  }
};

// 4. GỌI API PERPLEXITY (llama-3.1-sonar-large-online)
export const callPerplexity = (apiKey: string, model: string, prompt: string, systemPrompt?: string) =>
  callOpenAICompatibleProvider('https://api.perplexity.ai/chat/completions', 'Perplexity', 'llama-3.1-sonar-large-online', 0.2, apiKey, model, prompt, systemPrompt);

// 5. GỌI API DEEPSEEK (deepseek-chat)
export const callDeepSeek = (apiKey: string, model: string, prompt: string, systemPrompt?: string) =>
  callOpenAICompatibleProvider('https://api.deepseek.com/v1/chat/completions', 'DeepSeek', 'deepseek-chat', 0.2, apiKey, model, prompt, systemPrompt);

// 6. GỌI API MOONSHOT AI / KIMI (kimi-api)
export const callMoonshot = (apiKey: string, model: string, prompt: string, systemPrompt?: string) =>
  callOpenAICompatibleProvider('https://api.moonshot.cn/v1/chat/completions', 'Moonshot AI', 'moonshot-v1-8k', 0.3, apiKey, model, prompt, systemPrompt);

// 7. GỌI API XAI (Grok) — cùng format OpenAI Chat Completions
export const callXAI = (apiKey: string, model: string, prompt: string, systemPrompt?: string) =>
  callOpenAICompatibleProvider('https://api.x.ai/v1/chat/completions', 'xAI (Grok)', 'grok-2-latest', 0.3, apiKey, model, prompt, systemPrompt);

// 8. GỌI API QWEN (Alibaba Cloud DashScope - chế độ tương thích OpenAI)
export const callQwen = (apiKey: string, model: string, prompt: string, systemPrompt?: string) =>
  callOpenAICompatibleProvider('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', 'Qwen (Alibaba Cloud)', 'qwen-plus', 0.3, apiKey, model, prompt, systemPrompt);

// ĐIỀU PHỐI GỌI NHÀ CUNG CẤP PHÙ HỢP THEO MODEL
export const callAIProvider = async (
  provider: string,
  model: string,
  apiKey: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  const p = provider.toLowerCase();
  if (p.includes('openai')) return callOpenAI(apiKey, model, prompt, systemPrompt);
  if (p.includes('anthropic')) return callAnthropic(apiKey, model, prompt, systemPrompt);
  if (p.includes('google')) return callGoogle(apiKey, model, prompt, systemPrompt);
  if (p.includes('perplexity')) return callPerplexity(apiKey, model, prompt, systemPrompt);
  if (p.includes('deepseek')) return callDeepSeek(apiKey, model, prompt, systemPrompt);
  if (p.includes('moonshot') || p.includes('kimi')) return callMoonshot(apiKey, model, prompt, systemPrompt);
  if (p.includes('xai') || p.includes('grok')) return callXAI(apiKey, model, prompt, systemPrompt);
  if (p.includes('qwen')) return callQwen(apiKey, model, prompt, systemPrompt);

  throw new Error(`Nhà cung cấp AI không được hỗ trợ: ${provider}`);
};

// Ánh xạ tên hiển thị của model (Search Model hoặc Synthesis Model) sang
// {provider, apiKeyName}. Dùng chung cho cả 2 route orchestrate để tránh lặp code.
export interface ProviderResolution {
  provider: string;
  apiKeyName: string;
  /**
   * Nội dung trong ngoặc đơn của tên hiển thị.
   * CHỈ đáng tin cậy làm ID model thật với các nhãn Synthesis Model, vốn có dạng
   * "Provider (model-id-thật)" ví dụ "OpenAI (gpt-5.5)". Với nhãn Search Model
   * (ví dụ "ChatGPT (OpenAI)"), phần trong ngoặc chỉ là TÊN NHÀ CUNG CẤP, không
   * phải model ID — bên gọi phải bỏ qua field này và để hàm callXProvider tự
   * chọn model mặc định (truyền chuỗi rỗng '').
   */
  modelId: string;
}

export const resolveProviderForModel = (modelLabel: string): ProviderResolution | null => {
  const lower = modelLabel.toLowerCase();
  const parenMatch = modelLabel.match(/\(([^)]+)\)/);
  const modelId = parenMatch ? parenMatch[1] : '';

  if (lower.includes('claude')) return { provider: 'anthropic', apiKeyName: 'anthropic', modelId };
  if (lower.includes('chatgpt') || lower.includes('gpt') || lower.includes('openai')) return { provider: 'openai', apiKeyName: 'openai', modelId };
  if (lower.includes('gemini') || lower.includes('google')) return { provider: 'google', apiKeyName: 'google', modelId };
  if (lower.includes('perplexity')) return { provider: 'perplexity', apiKeyName: 'perplexity', modelId };
  if (lower.includes('grok') || lower.includes('xai')) return { provider: 'xai', apiKeyName: 'xai', modelId };
  if (lower.includes('deepseek')) return { provider: 'deepseek', apiKeyName: 'deepseek', modelId };
  if (lower.includes('moonshot') || lower.includes('kimi')) return { provider: 'moonshot', apiKeyName: 'moonshot', modelId };
  if (lower.includes('qwen')) return { provider: 'qwen', apiKeyName: 'qwen', modelId };

  return null;
};
