-- Ensure profile-images bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'profile-images';

-- Recreate public policy for profile images to ensure it works
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
