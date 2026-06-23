-- ============================================================================
-- Add Personal Information Fields to Profiles Table
-- ============================================================================

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS preferred_location TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN public.profiles.gender IS 'User gender: Male, Female, Non-binary, Prefer not to say, Other';
COMMENT ON COLUMN public.profiles.nationality IS 'User nationality/country';
COMMENT ON COLUMN public.profiles.city IS 'User current city or region';
COMMENT ON COLUMN public.profiles.preferred_location IS 'Preferred area for properties';
COMMENT ON COLUMN public.profiles.occupation IS 'User occupation or job title';
COMMENT ON COLUMN public.profiles.company_name IS 'Name of company user works for';
COMMENT ON COLUMN public.profiles.work_location IS 'User work location';
COMMENT ON COLUMN public.profiles.bio IS 'User biography or about me section';
