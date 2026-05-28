-- =============================================
-- TOPIK PERSISTENCE SYSTEM
-- Thiết lập bảng và quyền truy cập cho tính năng học từ vựng TOPIK (lịch thi, từ vựng AI)
-- Chạy file này trên Supabase SQL Editor
-- =============================================

-- 1. Bảng lưu lịch thi / cài đặt thi TOPIK theo từng browser (device_id)
CREATE TABLE IF NOT EXISTS public.topik_settings (
  device_id TEXT PRIMARY KEY,
  exam_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topik_settings ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép ai cũng có thể đọc/ghi (cho phép lưu offline, guest lưu cài đặt)
DROP POLICY IF EXISTS "Allow public access for settings" ON public.topik_settings;
CREATE POLICY "Allow public access for settings"
  ON public.topik_settings FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. Bảng lưu danh sách từ vựng TOPIK tạo bởi AI (chống trùng lặp, chia sẻ giữa mọi người)
CREATE TABLE IF NOT EXISTS public.topik_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ko TEXT NOT NULL,
  vi TEXT NOT NULL,
  en TEXT NOT NULL,
  level INTEGER NOT NULL,
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT topik_words_ko_level_key UNIQUE (ko, level)
);

-- Enable RLS
ALTER TABLE public.topik_words ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép đọc/ghi từ vựng tự do
DROP POLICY IF EXISTS "Allow public read for words" ON public.topik_words;
CREATE POLICY "Allow public read for words"
  ON public.topik_words FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public insert/update for words" ON public.topik_words;
CREATE POLICY "Allow public insert/update for words"
  ON public.topik_words FOR ALL
  USING (true)
  WITH CHECK (true);
