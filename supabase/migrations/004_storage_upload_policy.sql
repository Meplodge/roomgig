-- Allow authenticated users to upload images to property-images bucket
DROP POLICY IF EXISTS "Authenticated can upload property images" ON storage.objects;
CREATE POLICY "Authenticated can upload property images"
  ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own images
DROP POLICY IF EXISTS "Authenticated can delete own property images" ON storage.objects;
CREATE POLICY "Authenticated can delete own property images"
  ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
