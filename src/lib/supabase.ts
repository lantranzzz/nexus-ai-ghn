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
      const insertQuery = supabase
        .from('researches')
        .insert([
          {
            query: data.query,
            research_prompts: data.research_prompts,
            search_models: data.search_models,
            synthesis_model: data.synthesis_model,
            raw_inputs: data.raw_inputs || null,
            final_report: data.final_report,
            sources: data.sources
          }
        ])
        .select();
        
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Yêu cầu lưu trữ lên Cloud quá hạn (Timeout). Vui lòng kiểm tra lại kết nối hoặc thông tin cấu hình Supabase.')), 25000)
      );

      const { data: insertedData, error } = await Promise.race([insertQuery, timeoutPromise]) as { data: any; error: any };

      if (error) throw error;
      return { success: true, data: insertedData[0], isLocalFallback: false };
    } else {
      // Fallback sang LocalStorage
      const localResearchesRaw = localStorage.getItem('nexusai_saved_researches');
      const localResearches: ResearchData[] = localResearchesRaw ? JSON.parse(localResearchesRaw) : [];
      
      const newResearch: ResearchData = {
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...data
      };
      
      localResearches.unshift(newResearch); // Thêm vào đầu danh sách
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
      const getQuery = supabase
        .from('researches')
        .select('*')
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
