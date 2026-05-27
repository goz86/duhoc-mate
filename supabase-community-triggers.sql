-- =============================================
-- COMMUNITY FORUM: Trigger-based Counters + Atomic RPC
-- Chạy file này SAU supabase-community-migration.sql
-- An toàn để chạy nhiều lần (idempotent)
-- =============================================

-- ─────────────────────────────────────────────────────────────────
-- 1. Trigger: Tự động cập nhật likes_count / dislikes_count
--    Khi INSERT hoặc DELETE trong community_likes → cập nhật community_posts
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_community_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      IF NEW.is_like THEN
        UPDATE public.community_posts
          SET likes_count = likes_count + 1
          WHERE id = NEW.post_id;
      ELSE
        UPDATE public.community_posts
          SET dislikes_count = dislikes_count + 1
          WHERE id = NEW.post_id;
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      IF OLD.is_like THEN
        UPDATE public.community_posts
          SET likes_count = GREATEST(0, likes_count - 1)
          WHERE id = OLD.post_id;
      ELSE
        UPDATE public.community_posts
          SET dislikes_count = GREATEST(0, dislikes_count - 1)
          WHERE id = OLD.post_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_post_reaction_count ON public.community_likes;
CREATE TRIGGER trg_community_post_reaction_count
  AFTER INSERT OR DELETE ON public.community_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_community_post_reaction_count();

-- ─────────────────────────────────────────────────────────────────
-- 2. Trigger: Tự động cập nhật comments_count
--    Khi INSERT hoặc DELETE trong community_comments → cập nhật community_posts
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_community_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.community_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE public.community_posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_post_comment_count ON public.community_comments;
CREATE TRIGGER trg_community_post_comment_count
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_community_post_comment_count();

-- ─────────────────────────────────────────────────────────────────
-- 3. RPC: Tăng views_count theo kiểu atomic (tránh race condition)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.community_posts
  SET views_count = views_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cho phép cả guest (anon) và user đã đăng nhập gọi được
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO authenticated;
