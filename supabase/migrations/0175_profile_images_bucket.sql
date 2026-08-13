-- ============================================================================
-- Profile Images Storage Bucket and Policies
-- ============================================================================

-- Note: The bucket 'profile-images' must be created manually in Supabase Dashboard

-- Allow authenticated users to upload their own profile images
DROP POLICY IF EXISTS "Authenticated can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload own profile images" ON storage.objects;
CREATE POLICY "Authenticated can upload own profile images"
  ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view all profile images
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Allow authenticated users to delete their own profile images
DROP POLICY IF EXISTS "Authenticated can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own profile images" ON storage.objects;
CREATE POLICY "Authenticated can delete own profile images"
  ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own profile images
DROP POLICY IF EXISTS "Authenticated can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update own profile images" ON storage.objects;
CREATE POLICY "Authenticated can update own profile images"
  ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
