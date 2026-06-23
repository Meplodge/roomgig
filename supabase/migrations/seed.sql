-- ============================================================================
-- Real Estate App - Supabase Seed Data
-- ============================================================================
-- This file contains sample data for testing and development
-- Note: Users are created via Supabase Auth, profiles are created here
-- ============================================================================

-- ============================================================================
-- FACILITIES
-- ============================================================================

INSERT INTO public.facilities (name, icon, description) VALUES
('Swimming Pool', 'water-outline', 'Outdoor or indoor swimming pool'),
('Gym', 'fitness-outline', 'Fitness center with equipment'),
('Parking', 'car-outline', 'On-site parking available'),
('Security', 'shield-checkmark-outline', '24/7 security service'),
('Garden', 'leaf-outline', 'Private or shared garden'),
('Elevator', 'elevator-outline', 'Building elevator access'),
('Concierge', 'person-outline', 'Concierge service available'),
('Rooftop Access', 'sunny-outline', 'Rooftop terrace or garden'),
('Home Theater', 'film-outline', 'Private home theater room'),
('WiFi', 'wifi-outline', 'High-speed internet access'),
('Air Conditioning', 'snow-outline', 'Central air conditioning'),
('Laundry', 'shirt-outline', 'In-unit laundry facilities'),
('Balcony', 'flower-outline', 'Private balcony or terrace'),
('Storage', 'archive-outline', 'Additional storage space'),
('Fireplace', 'flame-outline', 'Fireplace in living area');

-- ============================================================================
-- PROFILES
-- ============================================================================
-- Note: Profiles are created via Supabase Auth. This seed only inserts data
-- that doesn't require auth.users. Use your own user ID for demo data.

-- Uncomment and replace with your actual auth.user ID if you want to insert your profile
-- INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, role, is_verified) VALUES
-- ('YOUR_AUTH_USER_ID', 'your@email.com', 'Your Name', 'https://ui-avatars.com/api/?name=Your+Name', '+15550000000', 'admin', TRUE)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================
-- Uncomment and replace with your actual auth.user ID
-- INSERT INTO public.user_preferences (user_id, notifications_enabled, dark_mode_enabled, location_enabled, language, currency) VALUES
-- ('YOUR_AUTH_USER_ID', TRUE, FALSE, TRUE, 'en', 'USD')
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- PROPERTIES
-- ============================================================================
-- Uncomment and replace with your actual auth.user ID for host_id
-- INSERT INTO public.properties (
--     id, host_id, title, description, type, category, status,
--     address, city, state, country, postal_code, latitude, longitude,
--     price, bedrooms, bathrooms, square_feet, year_built,
--     host_name, host_phone, host_email, rating_avg, review_count
-- ) VALUES (
--     '550e8400-e29b-41d4-a716-446655440001', 'YOUR_AUTH_USER_ID',
--     'Demo Property',
--     'This is a demo property for testing.',
--     'rent', 'apartment', 'active',
--     '123 Demo Street', 'Demo City', 'Demo State', 'USA', '12345',
--     40.7128, -74.0060,
--     1500.00, 2, 1, 800, 2020,
--     'Your Name', '+15550000000', 'your@email.com',
--     0, 0
-- );

-- ============================================================================
-- PROPERTY IMAGES
-- ============================================================================
-- Uncomment after creating properties
-- INSERT INTO public.property_images (property_id, image_url, alt_text, is_primary, display_order) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'Property exterior', TRUE, 0);

-- ============================================================================
-- PROPERTY FACILITIES
-- ============================================================================
-- Uncomment after creating properties
-- INSERT INTO public.property_facilities (property_id, facility_id) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.facilities WHERE name = 'WiFi'));

-- ============================================================================
-- ROOMMATE LISTINGS
-- ============================================================================
-- Uncomment and replace with your actual auth.user ID
-- INSERT INTO public.roommate_listings (
--     user_id, title, description, address, city, state, country, latitude, longitude,
--     gender_preference, smoking_preference, pet_preference, age_min, age_max,
--     budget_min, budget_max, move_in_date, lease_duration_months, is_active
-- ) VALUES
-- ('YOUR_AUTH_USER_ID',
--  'Looking for roommate',
--  'Seeking a professional roommate to share a modern apartment.',
--  '456 Main Street Apt 2B', 'Manhattan', 'NY', 'USA', 40.7580, -73.9855,
--  'any', 'non_smoker', 'any', 25, 45, 1000.00, 2000.00, '2024-07-01', 12, TRUE);

-- ============================================================================
-- CONVERSATIONS, MESSAGES, REVIEWS, NOTIFICATIONS, FAVORITES, SEARCH HISTORY
-- ============================================================================
-- All commented out as they require existing users and properties
-- Uncomment and replace with actual IDs after creating users and properties

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
