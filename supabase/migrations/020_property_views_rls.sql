-- Enable RLS on property_views table
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for tracking property views (anonymous and authenticated users)
CREATE POLICY "Allow public insert for property views"
ON property_views
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated users to view their own view history
CREATE POLICY "Allow users to view own property views"
ON property_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to manage all property views
CREATE POLICY "Allow service role full access"
ON property_views
TO service_role
USING (true)
WITH CHECK (true);
