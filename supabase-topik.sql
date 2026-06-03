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


-- 2. Bang luu tien do hoc TOPIK cho tai khoan dang nhap Google
CREATE TABLE IF NOT EXISTS public.topik_progress (
  user_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  known_keys TEXT[] DEFAULT '{}'::text[],
  unknown_keys TEXT[] DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, level)
);

-- Enable RLS
ALTER TABLE public.topik_progress ENABLE ROW LEVEL SECURITY;

-- Cho phep doc/ghi tien do hoc tu client
DROP POLICY IF EXISTS "Allow public access for TOPIK progress" ON public.topik_progress;
CREATE POLICY "Allow public access for TOPIK progress"
  ON public.topik_progress FOR ALL
  USING (true)
  WITH CHECK (true);


-- 3. Bang luu danh sach tu vung TOPIK tao boi AI
CREATE TABLE IF NOT EXISTS public.topik_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ko TEXT NOT NULL,
  vi TEXT NOT NULL,
  en TEXT NOT NULL,
  level INTEGER NOT NULL,
  example TEXT,
  pronunciation TEXT,
  ai_examples JSONB DEFAULT '[]'::jsonb,
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

-- 3. Mở rộng bảng topik_words để lưu câu ví dụ tạo bởi AI (ai_examples) & cách phát âm (pronunciation)
ALTER TABLE public.topik_words ADD COLUMN IF NOT EXISTS ai_examples JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.topik_words ADD COLUMN IF NOT EXISTS pronunciation TEXT;

-- Reload PostgREST schema cache so REST/Supabase API can see the new columns immediately.
NOTIFY pgrst, 'reload schema';


