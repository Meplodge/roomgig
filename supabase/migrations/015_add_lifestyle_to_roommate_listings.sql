-- Add lifestyle column to roommate_listings table
ALTER TABLE roommate_listings ADD COLUMN lifestyle TEXT;

COMMENT ON COLUMN roommate_listings.lifestyle IS 'General lifestyle description or preference';
