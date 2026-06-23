-- ============================================================================
-- Real Estate App - PostgreSQL Database Schema
-- ============================================================================
-- This schema supports a comprehensive real estate application with:
-- - User authentication with device binding
-- - Property listings (rent/sale/buy)
-- - Roommate finder functionality
-- - Booking system
-- - Messaging system
-- - Reviews and ratings
-- - Payment processing
-- - Notifications
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin', 'host', 'agent');
CREATE TYPE property_type AS ENUM ('rent', 'sale', 'buy');
CREATE TYPE property_category AS ENUM ('apartment', 'villa', 'house', 'duplex', 'studio', 'condo', 'townhouse');
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'rented', 'inactive', 'deleted');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE notification_type AS ENUM ('booking', 'message', 'review', 'system', 'promotion');
CREATE TYPE gender_preference AS ENUM ('any', 'male', 'female', 'non_binary');
CREATE TYPE smoking_preference AS ENUM ('any', 'smoker', 'non_smoker');
CREATE type pet_preference AS ENUM ('any', 'pets_allowed', 'no_pets');

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Device binding table for security
CREATE TABLE device_bindings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_manufacturer VARCHAR(255),
    device_model VARCHAR(255),
    os_version VARCHAR(255),
    platform VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unbound_at TIMESTAMP,
    UNIQUE(user_id, device_id)
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    dark_mode_enabled BOOLEAN DEFAULT FALSE,
    location_enabled BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROPERTIES
-- ============================================================================

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type property_type NOT NULL,
    category property_category NOT NULL,
    status listing_status DEFAULT 'active',
    
    -- Location
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property details
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    square_feet INTEGER,
    year_built INTEGER,
    
    -- Host information
    host_name VARCHAR(255),
    host_phone VARCHAR(20),
    host_email VARCHAR(255),
    
    -- Ratings
    rating_avg DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Property images
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property facilities/amenities
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE property_facilities (
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, facility_id)
);

-- ============================================================================
-- ROOMMATE LISTINGS
-- ============================================================================

CREATE TABLE roommate_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Location
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Preferences
    gender_preference gender_preference DEFAULT 'any',
    smoking_preference smoking_preference DEFAULT 'any',
    pet_preference pet_preference DEFAULT 'any',
    age_min INTEGER,
    age_max INTEGER,
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    
    -- Availability
    move_in_date DATE,
    lease_duration_months INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Roommate listing images
CREATE TABLE roommate_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES roommate_listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FAVORITES & SAVED ITEMS
-- ============================================================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    roommate_listing_id UUID REFERENCES roommate_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT favorite_target CHECK (
        (property_id IS NOT NULL AND roommate_listing_id IS NULL) OR
        (property_id IS NULL AND roommate_listing_id IS NOT NULL)
    ),
    UNIQUE(user_id, property_id),
    UNIQUE(user_id, roommate_listing_id)
);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES roommate_listings(id) ON DELETE SET NULL,
    
    -- Booking details
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Status
    status booking_status DEFAULT 'pending',
    
    -- Additional info
    special_requests TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    CONSTRAINT booking_target CHECK (
        (property_id IS NOT NULL AND roommate_listing_id IS NULL) OR
        (property_id IS NULL AND roommate_listing_id IS NOT NULL)
    )
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'paypal', etc.
    provider VARCHAR(50), -- 'visa', 'mastercard', etc.
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Payment details
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    
    -- Transaction info
    transaction_id VARCHAR(255),
    gateway_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    refunded_at TIMESTAMP
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    other_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES roommate_listings(id) ON DELETE SET NULL,
    
    -- Conversation info
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_conversation UNIQUE (user_id, other_user_id, property_id, roommate_listing_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status message_status DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES roommate_listings(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Review content
    title VARCHAR(255),
    content TEXT,
    
    -- Status
    is_visible BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT review_target CHECK (
        (property_id IS NOT NULL AND roommate_listing_id IS NULL) OR
        (property_id IS NULL AND roommate_listing_id IS NOT NULL)
    ),
    CONSTRAINT unique_review UNIQUE (user_id, property_id),
    CONSTRAINT unique_roommate_review UNIQUE (user_id, roommate_listing_id)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    -- Related entities
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEARCH HISTORY
-- ============================================================================

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for property listings with host info
CREATE VIEW property_listings_view AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.type,
    p.category,
    p.status,
    p.address,
    p.city,
    p.state,
    p.country,
    p.latitude,
    p.longitude,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.square_feet,
    p.rating_avg,
    p.review_count,
    p.host_id,
    p.host_name,
    p.host_phone,
    p.created_at,
    p.updated_at,
    pi.image_url as primary_image,
    u.email as host_email,
    u.full_name as host_full_name,
    u.avatar_url as host_avatar
FROM properties p
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
LEFT JOIN users u ON p.host_id = u.id
WHERE p.deleted_at IS NULL;

-- View for user's favorite properties
CREATE VIEW user_favorites_view AS
SELECT 
    f.id as favorite_id,
    f.user_id,
    f.property_id,
    f.roommate_listing_id,
    f.created_at as favorited_at,
    p.title as property_title,
    p.type as property_type,
    p.price,
    p.city,
    p.rating_avg,
    pi.image_url as property_image
FROM favorites f
LEFT JOIN properties p ON f.property_id = p.id
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
WHERE f.property_id IS NOT NULL;

-- View for conversation with user details
CREATE VIEW conversations_view AS
SELECT 
    c.id,
    c.user_id,
    c.other_user_id,
    c.property_id,
    c.roommate_listing_id,
    c.last_message,
    c.last_message_at,
    c.unread_count,
    c.created_at,
    c.updated_at,
    u1.full_name as user_name,
    u1.avatar_url as user_avatar,
    u2.full_name as other_user_name,
    u2.avatar_url as other_user_avatar,
    p.title as property_title,
    pi.image_url as property_image
FROM conversations c
JOIN users u1 ON c.user_id = u1.id
JOIN users u2 ON c.other_user_id = u2.id
LEFT JOIN properties p ON c.property_id = p.id
LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Device bindings indexes
CREATE INDEX idx_device_bindings_user_id ON device_bindings(user_id);
CREATE INDEX idx_device_bindings_device_id ON device_bindings(device_id);
CREATE INDEX idx_device_bindings_is_active ON device_bindings(is_active);

-- Properties indexes
CREATE INDEX idx_properties_host_id ON properties(host_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);
CREATE INDEX idx_properties_rating_avg ON properties(rating_avg);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_listed_at ON properties(listed_at);

-- Property images indexes
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_is_primary ON property_images(is_primary);

-- Roommate listings indexes
CREATE INDEX idx_roommate_listings_user_id ON roommate_listings(user_id);
CREATE INDEX idx_roommate_listings_city ON roommate_listings(city);
CREATE INDEX idx_roommate_listings_is_active ON roommate_listings(is_active);
CREATE INDEX idx_roommate_listings_location ON roommate_listings(latitude, longitude);
CREATE INDEX idx_roommate_listings_created_at ON roommate_listings(created_at);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);
CREATE INDEX idx_favorites_roommate_listing_id ON favorites(roommate_listing_id);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_other_user_id ON conversations(other_user_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX idx_conversations_property_id ON conversations(property_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Reviews indexes
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Search history indexes
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roommate_listings_updated_at BEFORE UPDATE ON roommate_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update property rating when review is added/updated
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.property_id IS NOT NULL THEN
        UPDATE properties 
        SET rating_avg = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM reviews 
            WHERE property_id = NEW.property_id AND is_visible = TRUE
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE property_id = NEW.property_id AND is_visible = TRUE
        )
        WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_rating_trigger AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_property_rating();

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR AS $$
DECLARE
    ref VARCHAR(20);
BEGIN
    LOOP
        ref := 'BK' || UPPER(encode(gen_random_bytes(4), 'hex'));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE reference = ref);
    END LOOP;
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to search properties with filters
CREATE OR REPLACE FUNCTION search_properties(
    p_type property_type DEFAULT NULL,
    p_category property_category DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_bedrooms INTEGER DEFAULT NULL,
    p_bathrooms DECIMAL DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_min_rating DECIMAL DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    type property_type,
    category property_category,
    price DECIMAL,
    city VARCHAR,
    rating_avg DECIMAL,
    primary_image TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.type,
        p.category,
        p.price,
        p.city,
        p.rating_avg,
        pi.image_url
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id AND pi.is_primary = TRUE
    WHERE 
        p.status = 'active'
        AND p.deleted_at IS NULL
        AND (p_type IS NULL OR p.type = p_type)
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_bedrooms IS NULL OR p.bedrooms = p_bedrooms)
        AND (p_bathrooms IS NULL OR p.bathrooms = p_bathrooms)
        AND (p_city IS NULL OR LOWER(p.city) = LOWER(p_city))
        AND (p_min_rating IS NULL OR p.rating_avg >= p_min_rating)
    ORDER BY p.listed_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE device_bindings IS 'Device-to-account bindings for security';
COMMENT ON TABLE user_preferences IS 'User application preferences and settings';
COMMENT ON TABLE properties IS 'Real estate property listings';
COMMENT ON TABLE property_images IS 'Images associated with properties';
COMMENT ON TABLE facilities IS 'Available property facilities/amenities';
COMMENT ON TABLE property_facilities IS 'Many-to-many relationship between properties and facilities';
COMMENT ON TABLE roommate_listings IS 'Roommate finder listings';
COMMENT ON TABLE roommate_images IS 'Images for roommate listings';
COMMENT ON TABLE favorites IS 'User favorites for properties and roommate listings';
COMMENT ON TABLE bookings IS 'Property and roommate booking records';
COMMENT ON TABLE payment_methods IS 'User payment methods';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE conversations IS 'Message conversations between users';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE reviews IS 'User reviews and ratings for properties and roommates';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE search_history IS 'User search query history';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
