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

      // Thử dùng getSession()/getUser() nếu localStorage không có (supabase-js tự refresh token)
      if (!token || !userId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          token = token || session?.access_token || null;
          userId = userId || session?.user?.id || null;
        } catch (e) {}
      }

      // Chặn tuyệt đối — chỉ ghi khi có JWT thật của người dùng.
      // KHÔNG dùng anon key làm token dự phòng: user_id lấy từ client, nếu ghi
      // bằng anon key sẽ có nguy cơ tạo bản ghi mạo danh user khác (bypass RLS ownership).
      if (!token || !userId) {
        return {
          success: false,
          error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại để lưu báo cáo.',
          isLocalFallback: false,
        };
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
            'Authorization': `Bearer ${token}`,
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
          if (response.status === 401 || response.status === 403) {
            // Không retry bằng anon key — phiên đã hết hạn thì yêu cầu đăng nhập lại.
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lưu báo cáo.');
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
      // Ưu tiên dùng getSession() vì supabase-js tự refresh token
      let token: string | null = null;
      let userId: string | null = null;

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: any }, error: any }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any }, error: any };
        token = session?.access_token || null;
        userId = session?.user?.id || null;
      } catch (e) {
        console.warn('getSession timeout or error in getResearches, falling back to localStorage');
      }

      // Nếu getSession() thất bại, đọc thẳng từ localStorage
      if (!token || !userId) {
        try {
          const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (storageKey) {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              // Supabase lưu token ở 2 chỗ tùy version
              token = token || parsed?.access_token || parsed?.session?.access_token || null;
              userId = userId || parsed?.user?.id || parsed?.session?.user?.id || null;
            }
          }
        } catch (e) {}
      }

      // Chặn tuyệt đối — không có token thật thì không trả dữ liệu
      if (!token || !userId) {
        console.warn('[getResearches] Không tìm thấy session hợp lệ, trả về rỗng.');
        return { success: true, data: [], isLocalFallback: false };
      }

      // Dùng fetch với JWT token để vượt qua RLS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/researches?user_id=eq.${userId}&order=created_at.desc`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return { success: true, data: data || [], isLocalFallback: false };
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
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
