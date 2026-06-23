-- ============================================================================
-- Add Enhanced Roommate Profile Fields
-- ============================================================================

-- Add new enum types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sleep_schedule') THEN
        CREATE TYPE sleep_schedule AS ENUM ('early_bird', 'night_owl', 'flexible');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_schedule') THEN
        CREATE TYPE work_schedule AS ENUM ('remote', 'office', 'hybrid', 'student', 'unemployed', 'retired');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dietary_preference') THEN
        CREATE TYPE dietary_preference AS ENUM ('vegetarian', 'vegan', 'omnivore', 'allergies', 'other');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_style') THEN
        CREATE TYPE social_style AS ENUM ('introvert', 'extrovert', 'ambivert');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cleanliness_level') THEN
        CREATE TYPE cleanliness_level AS ENUM ('minimal', 'moderate', 'very_clean', 'obsessive');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_policy') THEN
        CREATE TYPE guest_policy AS ENUM ('no_guests', 'occasional', 'frequent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'noise_tolerance') THEN
        CREATE TYPE noise_tolerance AS ENUM ('quiet', 'moderate', 'loud');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cooking_habits') THEN
        CREATE TYPE cooking_habits AS ENUM ('daily', 'sometimes', 'rarely', 'never');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alcohol_consumption') THEN
        CREATE TYPE alcohol_consumption AS ENUM ('non_drinker', 'social', 'regular');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_environment') THEN
        CREATE TYPE work_environment AS ENUM ('needs_quiet', 'moderate_noise', 'doesnt_mind_noise');
    END IF;
END $$;

-- Add new columns to roommate_listings table
ALTER TABLE public.roommate_listings 
ADD COLUMN IF NOT EXISTS sleep_schedule sleep_schedule,
ADD COLUMN IF NOT EXISTS work_schedule work_schedule,
ADD COLUMN IF NOT EXISTS dietary_preference dietary_preference,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS social_style social_style,
ADD COLUMN IF NOT EXISTS cleanliness_level cleanliness_level,
ADD COLUMN IF NOT EXISTS guest_policy guest_policy,
ADD COLUMN IF NOT EXISTS noise_tolerance noise_tolerance,
ADD COLUMN IF NOT EXISTS cooking_habits cooking_habits,
ADD COLUMN IF NOT EXISTS alcohol_consumption alcohol_consumption,
ADD COLUMN IF NOT EXISTS work_environment work_environment,
ADD COLUMN IF NOT EXISTS dietary_allergies TEXT;

-- Add column to roommate_images to distinguish roommate photo
ALTER TABLE public.roommate_images 
ADD COLUMN IF NOT EXISTS is_roommate_photo BOOLEAN DEFAULT FALSE;

-- Add comment for new columns
COMMENT ON COLUMN public.roommate_listings.sleep_schedule IS 'Preferred sleep schedule: early_bird, night_owl, flexible';
COMMENT ON COLUMN public.roommate_listings.work_schedule IS 'Work arrangement: remote, office, hybrid, student, unemployed, retired';
COMMENT ON COLUMN public.roommate_listings.dietary_preference IS 'Dietary preferences: vegetarian, vegan, omnivore, allergies, other';
COMMENT ON COLUMN public.roommate_listings.languages IS 'Array of languages spoken';
COMMENT ON COLUMN public.roommate_listings.social_style IS 'Social preference: introvert, extrovert, ambivert';
COMMENT ON COLUMN public.roommate_listings.cleanliness_level IS 'Cleanliness expectations: minimal, moderate, very_clean, obsessive';
COMMENT ON COLUMN public.roommate_listings.guest_policy IS 'Guest policy: no_guests, occasional, frequent';
COMMENT ON COLUMN public.roommate_listings.noise_tolerance IS 'Noise tolerance: quiet, moderate, loud';
COMMENT ON COLUMN public.roommate_listings.cooking_habits IS 'Cooking frequency: daily, sometimes, rarely, never';
COMMENT ON COLUMN public.roommate_listings.alcohol_consumption IS 'Alcohol habits: non_drinker, social, regular';
COMMENT ON COLUMN public.roommate_listings.work_environment IS 'Work environment needs: needs_quiet, moderate_noise, doesnt_mind_noise';
COMMENT ON COLUMN public.roommate_listings.dietary_allergies IS 'Specific dietary allergies if any';
COMMENT ON COLUMN public.roommate_images.is_roommate_photo IS 'Flag to identify which image is the roommate photo';
