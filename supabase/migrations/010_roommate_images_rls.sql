-- RLS policies for roommate_images
-- Allow public to view images for active listings
CREATE POLICY "Anyone can view roommate images"
  ON roommate_images
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert images for their own listings
CREATE POLICY "Users can insert roommate images"
  ON roommate_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roommate_listings
      WHERE roommate_listings.id = roommate_images.listing_id
        AND roommate_listings.user_id = auth.uid()
    )
  );

-- Allow authenticated users to delete images for their own listings
CREATE POLICY "Users can delete roommate images"
  ON roommate_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roommate_listings
      WHERE roommate_listings.id = roommate_images.listing_id
        AND roommate_listings.user_id = auth.uid()
    )
  );
