-- =============================================
-- DUHOC MATE - Admin & Community Migration SQL
-- Re-runnable and Safe
-- =============================================

-- 1. Extend public.profiles table with is_admin column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- 2. Create public.banned_users table
CREATE TABLE IF NOT EXISTS public.banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Vi phạm tiêu chuẩn cộng đồng',
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for banned_users
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- 3. Create public.community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'free' CHECK (category IN ('free', 'topik', 'life', 'job')),
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL DEFAULT 'Ẩn danh',
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER NOT NULL DEFAULT 0,
  image_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 4. Create public.community_comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL DEFAULT 'Ẩn danh',
  is_author BOOLEAN NOT NULL DEFAULT false,
  likes_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ, -- null means permanent, otherwise self-destructs at this time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for community_comments
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 5. Create public.community_likes table (Reactions)
CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL DEFAULT true, -- true = like, false = dislike
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (comment_id IS NOT NULL AND post_id IS NULL)
  )
);

-- Unique constraints to enforce only 1 reaction per user per post/comment
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_post_like 
ON public.community_likes (user_id, post_id) 
WHERE post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_comment_like 
ON public.community_likes (user_id, comment_id) 
WHERE comment_id IS NOT NULL;

-- Enable RLS for community_likes
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- 6. Create public.community_bookmarks table (Saves)
CREATE TABLE IF NOT EXISTS public.community_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

-- Enable RLS for community_bookmarks
ALTER TABLE public.community_bookmarks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY AND ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Helper Function to check if a user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function to check if a user is Banned
CREATE OR REPLACE FUNCTION public.is_banned_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.banned_users 
    WHERE banned_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Banned Users Policies
DROP POLICY IF EXISTS "Admins can manage banned list" ON public.banned_users;
CREATE POLICY "Admins can manage banned list" 
  ON public.banned_users FOR ALL 
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view banned list" ON public.banned_users;
CREATE POLICY "Anyone can view banned list" 
  ON public.banned_users FOR SELECT 
  USING (true);

-- 2. Profiles Table Policies update (Let Admin edit any profile role/status)
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" 
  ON public.profiles FOR UPDATE 
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 3. Community Posts Policies
DROP POLICY IF EXISTS "Anyone can view unexpired posts" ON public.community_posts;
CREATE POLICY "Anyone can view unexpired posts" 
  ON public.community_posts FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated and non-banned users can insert posts" ON public.community_posts;
CREATE POLICY "Authenticated and non-banned users can insert posts" 
  ON public.community_posts FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts" 
  ON public.community_posts FOR UPDATE 
  USING (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  );

DROP POLICY IF EXISTS "Users and admins can delete posts" ON public.community_posts;
CREATE POLICY "Users and admins can delete posts" 
  ON public.community_posts FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.is_admin_user(auth.uid())
  );

-- 4. Community Comments Policies
DROP POLICY IF EXISTS "Anyone can view unexpired comments" ON public.community_comments;
CREATE POLICY "Anyone can view unexpired comments" 
  ON public.community_comments FOR SELECT 
  USING (expires_at IS NULL OR expires_at > now());

DROP POLICY IF EXISTS "Authenticated and non-banned users can insert comments" ON public.community_comments;
CREATE POLICY "Anyone can insert comments" 
  ON public.community_comments FOR INSERT 
  WITH CHECK (
    (user_id IS NULL OR auth.uid() = user_id)
    AND (auth.uid() IS NULL OR NOT public.is_banned_user(auth.uid()))
  );

DROP POLICY IF EXISTS "Users and admins can delete comments" ON public.community_comments;
CREATE POLICY "Users and admins can delete comments" 
  ON public.community_comments FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.is_admin_user(auth.uid())
  );

-- 5. Community Likes Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
CREATE POLICY "Anyone can view likes" 
  ON public.community_likes FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Non-banned users can manage own likes" ON public.community_likes;
CREATE POLICY "Non-banned users can manage own likes" 
  ON public.community_likes FOR ALL 
  USING (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  );

-- 6. Community Bookmarks Policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.community_bookmarks;
CREATE POLICY "Users can view own bookmarks" 
  ON public.community_bookmarks FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.community_bookmarks;
CREATE POLICY "Users can manage own bookmarks" 
  ON public.community_bookmarks FOR ALL 
  USING (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_banned_user(auth.uid())
  );

-- =============================================
-- REALTIME PUBLICATIONS SETUP
-- =============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_likes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.banned_users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- SEED USER ASSIGNMENT FOR ADMIN
-- =============================================
-- Automatically assign admin role based on the selected email
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'heeffgh123@gmail.com'
);

-- =============================================
-- 7. Create public.help_comments table for QuickHelpBoard
-- =============================================
CREATE TABLE IF NOT EXISTS public.help_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.help_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL DEFAULT 'Ẩn danh',
  expires_at TIMESTAMPTZ, -- null means permanent, otherwise self-destructs at this time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for help_comments
ALTER TABLE public.help_comments ENABLE ROW LEVEL SECURITY;

-- Help Comments Policies
DROP POLICY IF EXISTS "Anyone can view help comments" ON public.help_comments;
CREATE POLICY "Anyone can view help comments" 
  ON public.help_comments FOR SELECT 
  USING (expires_at IS NULL OR expires_at > now());

DROP POLICY IF EXISTS "Anyone can insert help comments" ON public.help_comments;
CREATE POLICY "Anyone can insert help comments" 
  ON public.help_comments FOR INSERT 
  WITH CHECK (
    (user_id IS NULL OR auth.uid() = user_id)
    AND (auth.uid() IS NULL OR NOT public.is_banned_user(auth.uid()))
  );

DROP POLICY IF EXISTS "Users and admins can delete help comments" ON public.help_comments;
CREATE POLICY "Users and admins can delete help comments" 
  ON public.help_comments FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.is_admin_user(auth.uid())
  );

-- Add to publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.help_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
