-- ============================================================================
-- Real Estate App - Storage Helper Functions
-- ============================================================================
-- Note: Storage buckets and policies must be created via Supabase Dashboard or CLI
-- This migration only creates helper functions for storage operations
-- ============================================================================

-- ============================================================================
-- STORAGE HELPER FUNCTIONS
-- ============================================================================

-- Function to extract user ID from storage path
CREATE OR REPLACE FUNCTION public.get_user_id_from_path(path TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (storage.foldername(path))[1]::UUID;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user owns the property
CREATE OR REPLACE FUNCTION public.user_owns_property(user_id UUID, property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND host_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user owns the roommate listing
CREATE OR REPLACE FUNCTION public.user_owns_roommate_listing(user_id UUID, listing_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.roommate_listings 
    WHERE id = listing_id AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql;
