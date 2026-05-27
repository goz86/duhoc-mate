-- =============================================
-- GUEST REACTIONS: Cho phép guest like/dislike lưu DB
-- Mỗi browser có 1 guest_id UUID duy nhất (lưu localStorage)
-- Chạy file này SAU supabase-community-triggers.sql
-- An toàn để chạy lại (idempotent)
-- =============================================

-- 1. Cho phép user_id là NULL (guest không có auth)
ALTER TABLE public.community_likes
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Thêm cột guest_id để nhận dạng browser của guest
ALTER TABLE public.community_likes
  ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- 3. Bắt buộc phải có user_id HOẶC guest_id (không được cả 2 đều null)
ALTER TABLE public.community_likes
  DROP CONSTRAINT IF EXISTS check_user_or_guest_like;
ALTER TABLE public.community_likes
  ADD CONSTRAINT check_user_or_guest_like
  CHECK (user_id IS NOT NULL OR (guest_id IS NOT NULL AND guest_id <> ''));

-- 4. Unique index: 1 guest chỉ like 1 post/comment 1 lần
DROP INDEX IF EXISTS unique_guest_post_like;
CREATE UNIQUE INDEX unique_guest_post_like
  ON public.community_likes (guest_id, post_id)
  WHERE post_id IS NOT NULL AND guest_id IS NOT NULL;

DROP INDEX IF EXISTS unique_guest_comment_like;
CREATE UNIQUE INDEX unique_guest_comment_like
  ON public.community_likes (guest_id, comment_id)
  WHERE comment_id IS NOT NULL AND guest_id IS NOT NULL;

-- 5. Cập nhật RLS Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
DROP POLICY IF EXISTS "Non-banned users can manage own likes" ON public.community_likes;
DROP POLICY IF EXISTS "Auth users and guests can insert likes" ON public.community_likes;
DROP POLICY IF EXISTS "Auth users and guests can delete own likes" ON public.community_likes;

-- Ai cũng xem được
CREATE POLICY "Anyone can view likes"
  ON public.community_likes FOR SELECT
  USING (true);

-- User đã đăng nhập (không bị ban) HOẶC guest có guest_id hợp lệ
CREATE POLICY "Auth users and guests can insert likes"
  ON public.community_likes FOR INSERT
  WITH CHECK (
    (
      user_id IS NOT NULL
      AND auth.uid() = user_id
      AND NOT public.is_banned_user(auth.uid())
    )
    OR
    (
      user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id <> ''
    )
  );

-- Xóa reaction của chính mình
CREATE POLICY "Auth users and guests can delete own likes"
  ON public.community_likes FOR DELETE
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  );
