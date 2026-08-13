-- Allow authenticated users to insert facilities for their own properties
DROP POLICY IF EXISTS "Hosts can insert property facilities" ON property_facilities;
CREATE POLICY "Hosts can insert property facilities"
  ON property_facilities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_facilities.property_id
    AND properties.host_id = auth.uid()
  )
);

-- Allow authenticated users to delete facilities from their own properties
DROP POLICY IF EXISTS "Hosts can delete property facilities" ON property_facilities;
CREATE POLICY "Hosts can delete property facilities"
  ON property_facilities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_facilities.property_id
    AND properties.host_id = auth.uid()
  )
);
