-- Add age column to roommate_listings table
ALTER TABLE roommate_listings ADD COLUMN IF NOT EXISTS age INTEGER;
