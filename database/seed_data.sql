-- ============================================================================
-- Real Estate App - Seed Data
-- ============================================================================
-- This file contains sample data for testing and development
-- ============================================================================

-- ============================================================================
-- FACILITIES
-- ============================================================================

INSERT INTO facilities (name, icon, description) VALUES
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
-- USERS
-- ============================================================================

-- Admin user
INSERT INTO users (email, password_hash, full_name, avatar_url, phone, role, is_verified, is_active) VALUES
('admin@realestate.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Admin User', 'https://randomuser.me/api/portraits/men/1.jpg', '+15550000001', 'admin', TRUE, TRUE);

-- Regular users
INSERT INTO users (email, password_hash, full_name, avatar_url, phone, role, is_verified, is_active) VALUES
('john.doe@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'John Doe', 'https://randomuser.me/api/portraits/men/32.jpg', '+15551234567', 'user', TRUE, TRUE),
('jane.smith@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Jane Smith', 'https://randomuser.me/api/portraits/women/44.jpg', '+15559876543', 'user', TRUE, TRUE),
('michael.johnson@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Michael Johnson', 'https://randomuser.me/api/portraits/men/67.jpg', '+15555555555', 'user', FALSE, TRUE),
('sarah.williams@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Sarah Williams', 'https://randomuser.me/api/portraits/women/28.jpg', '+15551112233', 'user', TRUE, TRUE),
('david.brown@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'David Brown', 'https://randomuser.me/api/portraits/men/52.jpg', '+15554445566', 'user', TRUE, TRUE);

-- Host users
INSERT INTO users (email, password_hash, full_name, avatar_url, phone, role, is_verified, is_active) VALUES
('host.christopher@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Christopher Estate', 'https://randomuser.me/api/portraits/men/15.jpg', '+15557778899', 'host', TRUE, TRUE),
('host.premium@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Premium Homes', 'https://randomuser.me/api/portraits/women/65.jpg', '+15553334455', 'host', TRUE, TRUE),
('host.elite@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'Elite Properties', 'https://randomuser.me/api/portraits/men/78.jpg', '+15556667788', 'host', TRUE, TRUE),
('host.cityliving@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYlWv5jJqW6', 'City Living', 'https://randomuser.me/api/portraits/women/33.jpg', '+15559998877', 'host', TRUE, TRUE);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

INSERT INTO user_preferences (user_id, notifications_enabled, dark_mode_enabled, location_enabled, language, currency) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'), TRUE, FALSE, TRUE, 'en', 'USD'),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), TRUE, TRUE, TRUE, 'en', 'USD'),
((SELECT id FROM users WHERE email = 'michael.johnson@example.com'), FALSE, FALSE, FALSE, 'en', 'USD'),
((SELECT id FROM users WHERE email = 'sarah.williams@example.com'), TRUE, FALSE, TRUE, 'en', 'EUR'),
((SELECT id FROM users WHERE email = 'david.brown@example.com'), TRUE, TRUE, TRUE, 'en', 'GBP');

-- ============================================================================
-- PROPERTIES
-- ============================================================================

-- Get host IDs
DO $$
DECLARE
    v_christopher_id UUID;
    v_premium_id UUID;
    v_elite_id UUID;
    v_cityliving_id UUID;
BEGIN
    SELECT id INTO v_christopher_id FROM users WHERE email = 'host.christopher@example.com';
    SELECT id INTO v_premium_id FROM users WHERE email = 'host.premium@example.com';
    SELECT id INTO v_elite_id FROM users WHERE email = 'host.elite@example.com';
    SELECT id INTO v_cityliving_id FROM users WHERE email = 'host.cityliving@example.com';
    
    -- Suncrest Manor
    INSERT INTO properties (
        id, host_id, title, description, type, category, status,
        address, city, state, country, postal_code, latitude, longitude,
        price, bedrooms, bathrooms, square_feet, year_built,
        host_name, host_phone, host_email, rating_avg, review_count
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440001', v_christopher_id,
        'Suncrest Manor',
        'Luxury Residence with stunning views and modern amenities. This spacious property features elegant finishes throughout, a gourmet kitchen, and multiple entertainment areas.',
        'rent', 'villa', 'active',
        '123 Riverside Park Estates', 'Greenwich', 'CT', 'USA', '06830',
        40.7128, -74.0060,
        56000.00, 4, 4, 3300, 2015,
        'Christopher Estate', '+15557778899', 'host.christopher@example.com',
        4.5, 18
    );
    
    -- Luxury 3BHK
    INSERT INTO properties (
        id, host_id, title, description, type, category, status,
        address, city, state, country, postal_code, latitude, longitude,
        price, bedrooms, bathrooms, square_feet, year_built,
        host_name, host_phone, host_email, rating_avg, review_count
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440002', v_premium_id,
        'Luxury 3BHK',
        'Modern apartment with panoramic city views. Perfect for families looking for a comfortable living space with access to premium amenities.',
        'sale', 'apartment', 'active',
        '6971 Kailyn Knoll', 'Manhattan', 'NY', 'USA', '10001',
        40.7589, -73.9851,
        35000.00, 4, 3, 2800, 2018,
        'Premium Homes', '+15553334455', 'host.premium@example.com',
        4.5, 12
    );
    
    -- Green Valley Villa
    INSERT INTO properties (
        id, host_id, title, description, type, category, status,
        address, city, state, country, postal_code, latitude, longitude,
        price, bedrooms, bathrooms, square_feet, year_built,
        host_name, host_phone, host_email, rating_avg, review_count
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440003', v_elite_id,
        'Green Valley Villa',
        'Elegant villa with private garden and pool. This stunning property offers the perfect blend of luxury and comfort.',
        'rent', 'villa', 'active',
        '11 Green Bank', 'Boston', 'MA', 'USA', '02108',
        40.7306, -73.9352,
        78000.00, 5, 5, 4500, 2012,
        'Elite Properties', '+15556667788', 'host.elite@example.com',
        4.8, 25
    );
    
    -- Urban Loft
    INSERT INTO properties (
        id, host_id, title, description, type, category, status,
        address, city, state, country, postal_code, latitude, longitude,
        price, bedrooms, bathrooms, square_feet, year_built,
        host_name, host_phone, host_email, rating_avg, review_count
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440004', v_cityliving_id,
        'Urban Loft',
        'Stylish loft in the heart of the city. Features exposed brick walls, high ceilings, and modern finishes throughout.',
        'buy', 'duplex', 'active',
        '456 Central Park West', 'Manhattan', 'NY', 'USA', '10024',
        40.7829, -73.9654,
        30000.00, 2, 2, 1500, 2020,
        'City Living', '+15559998877', 'host.cityliving@example.com',
        4.3, 8
    );
END $$;

-- ============================================================================
-- PROPERTY IMAGES
-- ============================================================================

INSERT INTO property_images (property_id, image_url, alt_text, is_primary, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'Suncrest Manor exterior', TRUE, 0),
('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'Living room', FALSE, 1),
('550e8400-e29b-41d4-a716-446655440001', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', 'Kitchen', FALSE, 2),

('550e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'Luxury 3BHK exterior', TRUE, 0),
('550e8400-e29b-41d4-a716-446655440002', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800', 'Bedroom', FALSE, 1),

('550e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', 'Green Valley Villa exterior', TRUE, 0),
('550e8400-e29b-41d4-a716-446655440003', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', 'Pool area', FALSE, 1),

('550e8400-e29b-41d4-a716-446655440004', 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', 'Urban Loft interior', TRUE, 0),
('550e8400-e29b-41d4-a716-446655440004', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', 'Loft bedroom', FALSE, 1);

-- ============================================================================
-- PROPERTY FACILITIES
-- ============================================================================

INSERT INTO property_facilities (property_id, facility_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM facilities WHERE name = 'Swimming Pool')),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM facilities WHERE name = 'Gym')),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM facilities WHERE name = 'Parking')),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM facilities WHERE name = 'Security')),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM facilities WHERE name = 'Garden')),

('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM facilities WHERE name = 'Parking')),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM facilities WHERE name = 'Security')),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM facilities WHERE name = 'Elevator')),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM facilities WHERE name = 'Concierge')),

('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM facilities WHERE name = 'Swimming Pool')),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM facilities WHERE name = 'Garden')),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM facilities WHERE name = 'Parking')),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM facilities WHERE name = 'Security')),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM facilities WHERE name = 'Home Theater')),

('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM facilities WHERE name = 'Elevator')),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM facilities WHERE name = 'Security')),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM facilities WHERE name = 'Rooftop Access')),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM facilities WHERE name = 'Gym'));

-- ============================================================================
-- ROOMMATE LISTINGS
-- ============================================================================

INSERT INTO roommate_listings (
    user_id, title, description, address, city, state, country, latitude, longitude,
    gender_preference, smoking_preference, pet_preference, age_min, age_max,
    budget_min, budget_max, move_in_date, lease_duration_months, is_active,
    sleep_schedule, work_schedule, dietary_preference, languages, social_style,
    cleanliness_level, guest_policy, noise_tolerance, cooking_habits,
    alcohol_consumption, work_environment, dietary_allergies
) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'Looking for roommate in downtown apartment',
 'Seeking a professional roommate to share a modern 2-bedroom apartment. The apartment is fully furnished with all amenities.',
 '456 Main Street Apt 2B', 'Manhattan', 'NY', 'USA', 40.7580, -73.9855,
 'any', 'non_smoker', 'any', 25, 45, 1000.00, 2000.00, '2024-07-01', 12, TRUE,
 'early_bird', 'office', 'omnivore', ARRAY['English'], 'ambivert',
 'moderate', 'occasional', 'moderate', 'sometimes',
 'social', 'moderate_noise', NULL),

((SELECT id FROM users WHERE email = 'jane.smith@example.com'),
 'Cozy room in Brooklyn available',
 'Private room available in a 3-bedroom house. Shared kitchen and living areas. Quiet neighborhood.',
 '789 Brooklyn Ave', 'Brooklyn', 'NY', 'USA', 40.6782, -73.9442,
 'female', 'any', 'pets_allowed', 20, 35, 800.00, 1500.00, '2024-08-01', 6, TRUE,
 'night_owl', 'remote', 'vegetarian', ARRAY['English', 'Spanish'], 'introvert',
 'very_clean', 'no_guests', 'quiet', 'daily',
 'non_drinker', 'needs_quiet', 'Peanuts'),

((SELECT id FROM users WHERE email = 'michael.johnson@example.com'),
 'Luxury apartment share in Manhattan',
 'Luxury high-rise apartment with stunning city views. Looking for a professional to share expenses.',
 '100 Park Avenue Apt 15A', 'Manhattan', 'NY', 'USA', 40.7527, -73.9772,
 'male', 'non_smoker', 'no_pets', 30, 50, 2000.00, 3500.00, '2024-07-15', 12, TRUE,
 'flexible', 'hybrid', 'omnivore', ARRAY['English', 'French'], 'extrovert',
 'minimal', 'frequent', 'loud', 'rarely',
 'regular', 'doesnt_mind_noise', NULL);

-- ============================================================================
-- ROOMMATE IMAGES
-- ============================================================================

-- Get roommate listing IDs
DO $$
DECLARE
    v_listing1_id UUID;
    v_listing2_id UUID;
    v_listing3_id UUID;
BEGIN
    SELECT id INTO v_listing1_id FROM roommate_listings WHERE title = 'Looking for roommate in downtown apartment' LIMIT 1;
    SELECT id INTO v_listing2_id FROM roommate_listings WHERE title = 'Cozy room in Brooklyn available' LIMIT 1;
    SELECT id INTO v_listing3_id FROM roommate_listings WHERE title = 'Luxury apartment share in Manhattan' LIMIT 1;
    
    -- Images for listing 1 (John Doe)
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing1_id, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', TRUE),
    (v_listing1_id, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600', FALSE),
    (v_listing1_id, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600', FALSE);
    
    -- Images for listing 2 (Jane Smith)
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing2_id, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600', TRUE),
    (v_listing2_id, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', FALSE),
    (v_listing2_id, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600', FALSE);
    
    -- Images for listing 3 (Michael Johnson)
    INSERT INTO roommate_images (roommate_listing_id, image_url, is_roommate_photo) VALUES
    (v_listing3_id, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600', TRUE),
    (v_listing3_id, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600', FALSE),
    (v_listing3_id, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600', FALSE);
END $$;

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

INSERT INTO conversations (
    user_id, other_user_id, property_id, last_message, last_message_at, unread_count
) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 (SELECT id FROM users WHERE email = 'host.christopher@example.com'),
 '550e8400-e29b-41d4-a716-446655440001',
 'The property is still available for viewing.',
 NOW() - INTERVAL '2 minutes',
 2),

((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 (SELECT id FROM users WHERE email = 'host.premium@example.com'),
 '550e8400-e29b-41d4-a716-446655440002',
 'Would you like to schedule a tour?',
 NOW() - INTERVAL '1 hour',
 0),

((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 (SELECT id FROM users WHERE email = 'host.elite@example.com'),
 '550e8400-e29b-41d4-a716-446655440003',
 'Thanks for your interest! Let me know if you have any questions.',
 NOW() - INTERVAL '3 hours',
 1);

-- ============================================================================
-- MESSAGES
-- ============================================================================

-- Messages for conversation 1
INSERT INTO messages (conversation_id, sender_id, content, status, is_read, created_at) VALUES
((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.christopher@example.com') LIMIT 1),
 (SELECT id FROM users WHERE email = 'john.doe@example.com'),
 "Hi! I'm interested in your property.",
 'read', TRUE, NOW() - INTERVAL '30 minutes'),

((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.christopher@example.com') LIMIT 1),
 (SELECT id FROM users WHERE email = 'host.christopher@example.com'),
 'Hello! Thanks for your interest. The property is still available for viewing.',
 'read', TRUE, NOW() - INTERVAL '28 minutes'),

((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.christopher@example.com') LIMIT 1),
 (SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'Great! When can I schedule a tour?',
 'read', TRUE, NOW() - INTERVAL '25 minutes'),

((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.christopher@example.com') LIMIT 1),
 (SELECT id FROM users WHERE email = 'host.christopher@example.com'),
 'The property is still available for viewing.',
 'delivered', FALSE, NOW() - INTERVAL '2 minutes');

-- Messages for conversation 2
INSERT INTO messages (conversation_id, sender_id, content, status, is_read, created_at) VALUES
((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.premium@example.com') OFFSET 1 LIMIT 1),
 (SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'Hello, is the 3BHK still on the market?',
 'read', TRUE, NOW() - INTERVAL '1 hour'),

((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.premium@example.com') OFFSET 1 LIMIT 1),
 (SELECT id FROM users WHERE email = 'host.premium@example.com'),
 'Yes it is! Would you like to schedule a tour?',
 'read', TRUE, NOW() - INTERVAL '58 minutes');

-- Messages for conversation 3
INSERT INTO messages (conversation_id, sender_id, content, status, is_read, created_at) VALUES
((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.elite@example.com') OFFSET 2 LIMIT 1),
 (SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'Hi, I have a few questions about the villa.',
 'read', TRUE, NOW() - INTERVAL '3 hours'),

((SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@example.com') AND other_user_id = (SELECT id FROM users WHERE email = 'host.elite@example.com') OFFSET 2 LIMIT 1),
 (SELECT id FROM users WHERE email = 'host.elite@example.com'),
 'Thanks for your interest! Let me know if you have any questions.',
 'delivered', FALSE, NOW() - INTERVAL '2 hours 58 minutes');

-- ============================================================================
-- REVIEWS
-- ============================================================================

INSERT INTO reviews (user_id, property_id, rating, title, content, is_visible, is_verified) VALUES
((SELECT id FROM users WHERE email = 'jane.smith@example.com'),
 '550e8400-e29b-41d4-a716-446655440001',
 5, 'Amazing property!', 'Absolutely loved our stay. The property was exactly as described and the host was very responsive.', TRUE, TRUE),

((SELECT id FROM users WHERE email = 'sarah.williams@example.com'),
 '550e8400-e29b-41d4-a716-446655440001',
 4, 'Great location', 'Perfect location with beautiful views. Would definitely recommend to others.', TRUE, TRUE),

((SELECT id FROM users WHERE email = 'david.brown@example.com'),
 '550e8400-e29b-41d4-a716-446655440002',
 5, 'Excellent apartment', 'Modern, clean, and well-maintained. The amenities were top-notch.', TRUE, TRUE),

((SELECT id FROM users WHERE email = 'jane.smith@example.com'),
 '550e8400-e29b-41d4-a716-446655440003',
 4, 'Beautiful villa', 'Stunning property with great amenities. The pool was a highlight!', TRUE, TRUE);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (user_id, type, title, message, property_id, is_read) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'message',
 'New message from Christopher Estate',
 'You have a new message regarding Suncrest Manor.',
 '550e8400-e29b-41d4-a716-446655440001',
 FALSE),

((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'booking',
 'Booking confirmed',
 'Your booking for Luxury 3BHK has been confirmed.',
 '550e8400-e29b-41d4-a716-446655440002',
 TRUE),

((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'review',
 'New review received',
 'Your property has received a new 5-star review!',
 NULL,
 TRUE);

-- ============================================================================
-- FAVORITES
-- ============================================================================

INSERT INTO favorites (user_id, property_id) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'), '550e8400-e29b-41d4-a716-446655440002'),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), '550e8400-e29b-41d4-a716-446655440001'),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), '550e8400-e29b-41d4-a716-446655440003'),
((SELECT id FROM users WHERE email = 'sarah.williams@example.com'), '550e8400-e29b-41d4-a716-446655440004');

-- ============================================================================
-- SEARCH HISTORY
-- ============================================================================

INSERT INTO search_history (user_id, query, filters, results_count) VALUES
((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 '2 bedroom apartment',
 '{"type": "rent", "bedrooms": 2, "city": "Manhattan"}'::jsonb,
 15),

((SELECT id FROM users WHERE email = 'john.doe@example.com'),
 'villa with pool',
 '{"category": "villa", "facilities": ["Swimming Pool"]}'::jsonb,
 8),

((SELECT id FROM users WHERE email = 'jane.smith@example.com'),
 'apartment under $3000',
 '{"type": "rent", "max_price": 3000}'::jsonb,
 22);

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
