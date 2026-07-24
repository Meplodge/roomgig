-- Add preferences and amenities arrays to roommate_listings.
-- The Post Roommate Listing form collects free-form preference tags
-- (e.g. "No smoking", "Pet friendly") and amenity tags (e.g. "WiFi",
-- "Laundry"), but no columns existed to store them, causing
-- PGRST204 "Could not find the 'amenities' column" on insert.
ALTER TABLE public.roommate_listings
ADD COLUMN IF NOT EXISTS preferences TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.roommate_listings.preferences IS 'Free-form roommate preference tags selected in the listing form';
COMMENT ON COLUMN public.roommate_listings.amenities IS 'Free-form amenity tags selected in the listing form';
