import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Kiểm tra xem Supabase đã được cấu hình chưa
export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '';
};

// Client Supabase (Sẽ trả về client thật nếu đã cấu hình, hoặc null)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Giao diện dữ liệu nghiên cứu
export interface ResearchData {
  id?: string;
  created_at?: string;
  user_id?: string;
  query: {
    scope: string;
    persona: string;
    action: string;
    rules: string;
    knowledge: string;
  };
  research_prompts: Record<string, string>;
  search_models: string[];
  synthesis_model: string;
  raw_inputs?: Record<string, string>;
  final_report: string;
  sources: { title: string; url: string; snippet?: string }[];
}

// Lưu trữ nghiên cứu (Hỗ trợ tự động fallback sang LocalStorage nếu chưa cấu hình Supabase)
export const saveResearch = async (data: Omit<ResearchData, 'id' | 'created_at'>): Promise<{ success: boolean; data?: any; error?: string; isLocalFallback: boolean }> => {
  try {
    if (isSupabaseConfigured() && supabase) {
      // Lấy token trực tiếp từ localStorage (tránh supabase.auth.getSession() bị treo)
      let token: string | null = null;
      let userId: string | null = null;
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.access_token || null;
            userId = parsed?.user?.id || null;
          }
        }
      } catch (e) {
        // bỏ qua
      }

      // Thử dùng auth.getUser() nếu localStorage không có
      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id || null;
        } catch (e) {}
      }

      // Sanitize data: đảm bảo sources là mảng JSON sạch
      const sanitizedSources = (data.sources || []).map(s => ({
        title: String(s.title || ''),
        url: String(s.url || ''),
        snippet: s.snippet ? String(s.snippet) : undefined
      }));

      // Dùng AbortController để tự hủy request sau 20 giây
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/researches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token || supabaseAnonKey}`,
            'Prefer': 'return=representation'
          },
          signal: controller.signal,
          body: JSON.stringify({
            query: data.query,
            research_prompts: data.research_prompts,
            search_models: data.search_models,
            synthesis_model: data.synthesis_model,
            raw_inputs: data.raw_inputs || null,
            final_report: data.final_report,
            sources: sanitizedSources,
            user_id: userId
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          // Nếu lỗi 401/403, thử lại với anon key
          if ((response.status === 401 || response.status === 403) && token) {
            console.warn('Token hết hạn, thử lại với anon key...');
            const retryResponse = await fetch(`${supabaseUrl}/rest/v1/researches`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                query: data.query,
                research_prompts: data.research_prompts,
                search_models: data.search_models,
                synthesis_model: data.synthesis_model,
                raw_inputs: data.raw_inputs || null,
                final_report: data.final_report,
                sources: sanitizedSources,
                user_id: userId
              })
            });
            if (!retryResponse.ok) {
              const retryErr = await retryResponse.text();
              throw new Error(`HTTP ${retryResponse.status}: ${retryErr}`);
            }
            const retryData = await retryResponse.json();
            return { success: true, data: retryData[0], isLocalFallback: false };
          }
          throw new Error(`HTTP ${response.status}: ${errText || 'Lỗi không xác định từ server'}`);
        }

        const insertedData = await response.json();
        return { success: true, data: insertedData[0], isLocalFallback: false };
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request bị hủy sau 20 giây không phản hồi. Vui lòng kiểm tra kết nối mạng.');
        }
        throw fetchErr;
      }
    } else {
      // Fallback sang LocalStorage
      const localResearchesRaw = localStorage.getItem('nexusai_saved_researches');
      const localResearches: ResearchData[] = localResearchesRaw ? JSON.parse(localResearchesRaw) : [];
      
      const newResearch: ResearchData = {
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...data
      };
      
      localResearches.unshift(newResearch);
      localStorage.setItem('nexusai_saved_researches', JSON.stringify(localResearches));
      
      return { success: true, data: newResearch, isLocalFallback: true };
    }
  } catch (err: any) {
    console.error('Lỗi khi lưu nghiên cứu:', err);
    return { success: false, error: err.message || 'Không thể lưu dữ liệu', isLocalFallback: !isSupabaseConfigured() };
  }
};


// Lấy danh sách nghiên cứu đã lưu
export const getResearches = async (): Promise<{ success: boolean; data: ResearchData[]; isLocalFallback: boolean }> => {
  try {
    if (isSupabaseConfigured() && supabase) {
      // Xác định user đang đăng nhập một cách nghiêm ngặt
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (e) {}

      // Fallback đọc thẳng từ localStorage nếu hàm trên thất bại
      if (!userId) {
        try {
          const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (storageKey) {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              userId = parsed?.user?.id || null;
            }
          }
        } catch (e) {}
      }

      if (!userId) {
        throw new Error('Chưa đăng nhập hoặc phiên hết hạn.');
      }

      const getQuery = supabase
        .from('researches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Yêu cầu tải dữ liệu từ Cloud quá hạn (Timeout).')), 25000)
      );

      const { data, error } = await Promise.race([getQuery, timeoutPromise]) as { data: any; error: any };

      if (error) throw error;
      return { success: true, data: data || [], isLocalFallback: false };
    } else {
      const localResearchesRaw = localStorage.getItem('nexusai_saved_researches');
      const data = localResearchesRaw ? JSON.parse(localResearchesRaw) : [];
      return { success: true, data, isLocalFallback: true };
    }
  } catch (err: any) {
    console.error('Lỗi khi tải danh sách nghiên cứu:', err);
    return { success: false, data: [], isLocalFallback: !isSupabaseConfigured() };
  }
};

// --- AUTH & USER METADATA SYNC ---

export const syncApiKeysToCloud = async (keys: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Chưa cấu hình Supabase' };
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Chưa đăng nhập' };

    const { error } = await supabase.auth.updateUser({
      data: { api_keys: keys }
    });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Lỗi khi sync API Keys:', err);
    return { success: false, error: err.message };
  }
};

export const getApiKeysFromCloud = async (): Promise<Record<string, string> | null> => {
  if (!isSupabaseConfigured() || !supabase) return null;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return user.user_metadata?.api_keys || null;
  } catch (err: any) {
    console.error('Lỗi khi lấy API Keys:', err);
    return null;
  }
};
