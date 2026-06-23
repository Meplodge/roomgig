-- Drop old policy
DROP POLICY IF EXISTS "Hosts can insert images for own properties" ON property_images;

-- Create new policy with authenticated role
CREATE POLICY "Hosts can insert images for own properties"
ON property_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.host_id = auth.uid()
  )
);
