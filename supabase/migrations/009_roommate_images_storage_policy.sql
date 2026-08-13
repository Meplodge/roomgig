-- ============================================================================
-- Roommate Images Storage RLS Policies
-- ============================================================================

-- Allow authenticated users to upload to their own folder in roommate-images
DROP POLICY IF EXISTS "Users can upload roommate images" ON storage.objects;
CREATE POLICY "Users can upload roommate images"
  ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'roommate-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read from their own folder in roommate-images
DROP POLICY IF EXISTS "Users can read roommate images" ON storage.objects;
CREATE POLICY "Users can read roommate images"
  ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'roommate-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete from their own folder in roommate-images
DROP POLICY IF EXISTS "Users can delete roommate images" ON storage.objects;
CREATE POLICY "Users can delete roommate images"
  ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'roommate-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
