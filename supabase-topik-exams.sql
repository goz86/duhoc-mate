-- =============================================
-- TOPIK CBT MOCK EXAMS PERSISTENCE SYSTEM
-- Thiết lập các bảng lưu trữ đề thi thử TOPIK (Reading & Listening) do AI tạo
-- Chạy file này trên Supabase SQL Editor
-- =============================================

-- 1. Bảng quản lý đề thi TOPIK
CREATE TABLE IF NOT EXISTS public.topik_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_number SERIAL, -- Đề thi số 1, số 2... tự động tăng toàn hệ thống
  title TEXT NOT NULL, -- Ví dụ: "Đề thi thử TOPIK II Đọc - Số 1"
  category TEXT NOT NULL CHECK (category IN ('reading', 'listening')),
  level INTEGER NOT NULL CHECK (level IN (1, 2)), -- 1: TOPIK I (Cấp 1-2), 2: TOPIK II (Cấp 3-6)
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT NOT NULL -- device_id hoặc user_id của người tạo
);

-- Enable RLS
ALTER TABLE public.topik_exams ENABLE ROW LEVEL SECURITY;

-- Quyền truy cập công khai (Public Access) cho đề thi
DROP POLICY IF EXISTS "Allow public select for exams" ON public.topik_exams;
CREATE POLICY "Allow public select for exams" ON public.topik_exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert for exams" ON public.topik_exams;
CREATE POLICY "Allow public insert for exams" ON public.topik_exams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete for exams" ON public.topik_exams;
CREATE POLICY "Allow public delete for exams" ON public.topik_exams FOR DELETE USING (true);


-- 2. Bảng quản lý chi tiết câu hỏi của từng đề thi
CREATE TABLE IF NOT EXISTS public.topik_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.topik_exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL, -- Từ câu 1 trở đi
  question_type TEXT NOT NULL, -- Loại câu: 'grammar', 'paragraph_order', 'reading_comprehension', 'listening_dialog'
  instructions TEXT NOT NULL, -- Yêu cầu đề bài, ví dụ: "[1~2] ( )에 들어갈 말로 가장 알맞은 것을 고르십시오."
  passage TEXT, -- Đoạn văn đọc hiểu hoặc kịch bản nghe (nếu có)
  question_text TEXT NOT NULL, -- Nội dung câu hỏi (ví dụ: "1. 책을 ( ) 갑자기 고등학교 친구를 만났다.")
  options JSONB NOT NULL, -- Mảng 4 lựa chọn: ["빌리거나", "빌리더니", "빌리는 길에", "빌리는 데다가"]
  correct_option INTEGER NOT NULL CHECK (correct_option IN (1, 2, 3, 4)), -- Đáp án đúng: 1, 2, 3, hoặc 4
  explanation TEXT, -- Giải nghĩa chi tiết bằng tiếng Việt và ngữ pháp tương đương
  audio_script TEXT, -- Kịch bản âm thanh tiếng Hàn dùng cho phần thi Nghe
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topik_exam_questions ENABLE ROW LEVEL SECURITY;

-- Quyền truy cập công khai (Public Access) cho câu hỏi
DROP POLICY IF EXISTS "Allow public select for questions" ON public.topik_exam_questions;
CREATE POLICY "Allow public select for questions" ON public.topik_exam_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert for questions" ON public.topik_exam_questions;
CREATE POLICY "Allow public insert for questions" ON public.topik_exam_questions FOR INSERT WITH CHECK (true);
