-- ============================================================================
-- Real Estate App - Demo Account Seed Data
-- ============================================================================
-- This file creates a demo account for testing and development
-- ============================================================================

-- ============================================================================
-- DEMO USER ACCOUNT
-- ============================================================================
-- Email: demo@realestate.com
-- Password: Demo123!
-- Role: admin (full access)
-- ============================================================================

-- Note: This seed assumes the user has been created in Supabase Auth first
-- You can create the user via:
-- 1. Supabase Dashboard → Authentication → Users → Add User
-- 2. Or use the Supabase CLI: supabase auth signup demo@realestate.com Demo123!

-- Insert demo user profile (replace AUTH_USER_ID with the actual UUID from auth.users)
INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, role, is_verified)
VALUES (
    '2e3010cb-138c-4876-90cf-506be07afc11', -- Replace with actual auth.users.id
    'mmeplodge@gmail.com',
    'mmeplodge',
    'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff',
    '+15550000000',
    'admin',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- Insert demo user preferences
INSERT INTO public.user_preferences (user_id, notifications_enabled, dark_mode_enabled, location_enabled, language, currency)
VALUES (
    '2e3010cb-138c-4876-90cf-506be07afc11', -- Replace with actual auth.users.id
    TRUE,
    FALSE,
    TRUE,
    'en',
    'USD'
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- DEMO DEVICE BINDING
-- ============================================================================
-- This allows the demo account to work with device binding
-- You'll need to bind your actual device when you first log in

-- ============================================================================
-- DEMO PROPERTY (for testing)
-- ============================================================================

INSERT INTO public.properties (
    host_id, title, description, type, category, status,
    address, city, state, country, postal_code, latitude, longitude,
    price, bedrooms, bathrooms, square_feet, year_built,
    host_name, host_phone, host_email, rating_avg, review_count
) VALUES (
    '2e3010cb-138c-4876-90cf-506be07afc11',
    'Demo Property',
    'This is a demo property for testing the application. Feel free to modify or delete it.',
    'rent',
    'apartment',
    'active',
    '123 Demo Street',
    'Demo City',
    'Demo State',
    'USA',
    '12345',
    40.7128,
    -74.0060,
    1500.00,
    2,
    1,
    800,
    2020,
    'Demo User',
    '+15550000000',
    'demo@realestate.com',
    0,
    0
);

-- ============================================================================
-- DEMO FACILITIES
-- ============================================================================

INSERT INTO public.facilities (name, icon, description) VALUES
('WiFi', 'wifi-outline', 'High-speed internet access'),
('Parking', 'car-outline', 'On-site parking available'),
('Air Conditioning', 'snow-outline', 'Central air conditioning')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 
-- To set up the demo account:
-- 
-- 1. Create the user in Supabase Auth:
--    - Go to Supabase Dashboard → Authentication → Users
--    - Click "Add User" 
--    - Email: demo@realestate.com
--    - Password: Demo123!
--    - Click "Create User"
--    - Copy the user's UUID from the User ID column
-- 
-- 2. Replace '00000000-0000-0000-0000-000000000001' in this file with the actual UUID
-- 
-- 3. Run this seed file:
--    - Via Supabase Dashboard: SQL Editor → Paste this file → Run
--    - Or via CLI: supabase db reset
-- 
-- 4. Log in to the app with:
--    - Email: demo@realestate.com
--    - Password: Demo123!
-- 
-- ============================================================================
