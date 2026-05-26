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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
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

// 4. GỌI API PERPLEXITY (llama-3.1-sonar-large-online)
export const callPerplexity = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key Perplexity trống');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.1-sonar-large-online',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error('Lỗi Perplexity:', error);
    return { content: '', error: error.message };
  }
};

// 5. GỌI API DEEPSEEK (deepseek-chat)
export const callDeepSeek = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key DeepSeek trống');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error('Lỗi DeepSeek:', error);
    return { content: '', error: error.message };
  }
};

// 6. GỌI API MOONSHOT AI / KIMI (kimi-api)
export const callMoonshot = async (
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string
): Promise<ChatCompletionResponse> => {
  try {
    if (!apiKey) throw new Error('API Key Moonshot AI trống');

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'moonshot-v1-8k',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  } catch (error: any) {
    console.error('Lỗi Moonshot (Kimi):', error);
    return { content: '', error: error.message };
  }
};

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
  
  throw new Error(`Nhà cung cấp AI không được hỗ trợ: ${provider}`);
};
