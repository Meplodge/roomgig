-- ============================================================================
-- Roommate Listings Seed Data
-- ============================================================================
-- Run this in Supabase Dashboard SQL Editor to seed roommate listings
-- ============================================================================

-- Insert 3 roommate listings with personal and lifestyle fields
-- Replace 'YOUR_USER_ID' with your actual user ID from the profiles table
-- You can get your user ID by running: SELECT id, email FROM profiles;

INSERT INTO roommate_listings (
    id, user_id, title, description, address, city, state, country, latitude, longitude,
    gender_preference, smoking_preference, pet_preference, age_min, age_max,
    budget_min, budget_max, move_in_date, lease_duration_months, is_active,
    sleep_schedule, work_schedule, dietary_preference, languages, social_style,
    cleanliness_level, guest_policy, noise_tolerance, cooking_habits,
    alcohol_consumption, work_environment, dietary_allergies
) VALUES
(
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Looking for roommate in downtown apartment',
    'Seeking a professional roommate to share a modern 2-bedroom apartment. The apartment is fully furnished with all amenities.',
    '456 Main Street Apt 2B', 'Manhattan', 'NY', 'USA', 40.7580, -73.9855,
    'any', 'non_smoker', 'any', 25, 45, 1000.00, 2000.00, '2024-07-01', 12, TRUE,
    'early_bird', 'office', 'omnivore', ARRAY['English'], 'ambivert',
    'moderate', 'occasional', 'moderate', 'sometimes',
    'social', 'moderate_noise', NULL
),
(
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Cozy room in Brooklyn available',
    'Private room available in a 3-bedroom house. Shared kitchen and living areas. Quiet neighborhood.',
    '789 Brooklyn Ave', 'Brooklyn', 'NY', 'USA', 40.6782, -73.9442,
    'female', 'any', 'pets_allowed', 20, 35, 800.00, 1500.00, '2024-08-01', 6, TRUE,
    'night_owl', 'remote', 'vegetarian', ARRAY['English', 'Spanish'], 'introvert',
    'very_clean', 'no_guests', 'quiet', 'daily',
    'non_drinker', 'needs_quiet', 'Peanuts'
),
(
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Luxury apartment share in Manhattan',
    'Luxury high-rise apartment with stunning city views. Looking for a professional to share expenses.',
    '100 Park Avenue Apt 15A', 'Manhattan', 'NY', 'USA', 40.7527, -73.9772,
    'male', 'non_smoker', 'no_pets', 30, 50, 2000.00, 3500.00, '2024-07-15', 12, TRUE,
    'flexible', 'hybrid', 'omnivore', ARRAY['English', 'French'], 'extrovert',
    'minimal', 'frequent', 'loud', 'rarely',
    'regular', 'doesnt_mind_noise', NULL
);

-- Insert roommate images for the listings we just created
DO $$
DECLARE
    v_listing_ids UUID[];
BEGIN
    -- Get the last 3 roommate listing IDs
    SELECT ARRAY_AGG(id ORDER BY created_at DESC) INTO v_listing_ids
    FROM roommate_listings
    ORDER BY created_at DESC
    LIMIT 3;
    
    -- Images for listing 1
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing_ids[1], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', TRUE),
    (v_listing_ids[1], 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', FALSE),
    (v_listing_ids[1], 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', FALSE);
    
    -- Images for listing 2
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing_ids[2], 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', TRUE),
    (v_listing_ids[2], 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', FALSE),
    (v_listing_ids[2], 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600', FALSE);
    
    -- Images for listing 3
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing_ids[3], 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', TRUE),
    (v_listing_ids[3], 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', FALSE),
    (v_listing_ids[3], 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600', FALSE);
END $$;
