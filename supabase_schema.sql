-- BẢNG LƯU TRỮ CÁC PHÂN TÍCH CHIẾN LƯỢC NEXUSAI (GHN BRAND)
-- Chạy lệnh SQL này trong Supabase SQL Editor của bạn để khởi tạo bảng

CREATE TABLE IF NOT EXISTS researches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  query JSONB NOT NULL, -- Chứa { goal: string, competitors: string, metrics: string }
  research_prompts JSONB NOT NULL, -- Chứa các prompt riêng cho từng model { "Perplexity": "...", "Kimi": "..." }
  search_models TEXT[] NOT NULL, -- Mảng các model tìm tin đã sử dụng
  synthesis_model TEXT NOT NULL, -- Tên model tổng hợp đã sử dụng
  final_report TEXT NOT NULL, -- Nội dung báo cáo Markdown hoàn chỉnh
  sources JSONB NOT NULL DEFAULT '[]'::jsonb -- Mảng link nguồn [{ title: string, url: string }]
);

-- Bật tính năng Row Level Security (RLS) để bảo mật thông tin nếu cần
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép mọi người đọc và ghi dữ liệu (đơn giản cho môi trường phát triển/nội bộ)
CREATE POLICY "Allow public read and write access" ON researches
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
