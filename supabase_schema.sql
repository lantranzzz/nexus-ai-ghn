-- BẢNG LƯU TRỮ CÁC PHÂN TÍCH CHIẾN LƯỢC NEXUSAI (GHN BRAND)
-- Chạy lệnh SQL này trong Supabase SQL Editor của bạn để khởi tạo bảng

CREATE TABLE IF NOT EXISTS researches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  query JSONB NOT NULL, -- Chứa { context: string, goal: string, metrics: string, constraints: string }
  research_prompts JSONB NOT NULL, -- Chứa các prompt riêng cho từng model { "Perplexity": "...", "Kimi": "..." }
  search_models TEXT[] NOT NULL, -- Mảng các model tìm tin đã sử dụng
  synthesis_model TEXT NOT NULL, -- Tên model tổng hợp đã sử dụng
  raw_inputs JSONB, -- Chứa dữ liệu copy-paste thô từ các bot { "Perplexity": "nội dung...", "Kimi": "nội dung..." }
  final_report TEXT NOT NULL, -- Nội dung báo cáo Markdown hoàn chỉnh
  sources JSONB NOT NULL DEFAULT '[]'::jsonb -- Mảng link nguồn [{ title: string, url: string }]
);

-- Tắt tính năng bảo mật Row Level Security để người dùng nội bộ có thể lưu dữ liệu trực tiếp
ALTER TABLE researches DISABLE ROW LEVEL SECURITY;
