-- =============================================
-- GUEST PROFILES: Cho phép guest có profile cá nhân vĩnh viễn (avatar, username)
-- Lưu trong Database công khai và upload avatar lên storage bucket 'avatars'
-- =============================================

-- 1. Tạo bảng lưu hồ sơ của Khách
CREATE TABLE IF NOT EXISTS public.guest_profiles (
  id TEXT PRIMARY KEY, -- Lưu forum_guest_id dạng text
  username TEXT NOT NULL DEFAULT 'Bạn học',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tạo các chính sách bảo mật (Policies) cho bảng guest_profiles
DROP POLICY IF EXISTS "Anyone can read guest profiles" ON public.guest_profiles;
CREATE POLICY "Anyone can read guest profiles"
  ON public.guest_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert guest profiles" ON public.guest_profiles;
CREATE POLICY "Anyone can insert guest profiles"
  ON public.guest_profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update guest profiles" ON public.guest_profiles;
CREATE POLICY "Anyone can update guest profiles"
  ON public.guest_profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Cấu hình Storage Policies cho phép khách tải lên và sửa avatar trong thư mục "guests/" của bucket "avatars"
DROP POLICY IF EXISTS "Guests can upload avatars" ON storage.objects;
CREATE POLICY "Guests can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'guests'
  );

DROP POLICY IF EXISTS "Guests can update avatars" ON storage.objects;
CREATE POLICY "Guests can update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'guests'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'guests'
  );

DROP POLICY IF EXISTS "Guests can delete avatars" ON storage.objects;
CREATE POLICY "Guests can delete avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'guests'
  );
