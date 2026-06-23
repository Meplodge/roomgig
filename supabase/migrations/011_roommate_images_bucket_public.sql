-- Make the roommate-images bucket public so image URLs are accessible
UPDATE storage.buckets SET public = true WHERE id = 'roommate-images';
