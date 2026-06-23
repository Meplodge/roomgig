-- ============================================================================
-- Real Estate App - Supabase Migration
-- Initial Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Create enum types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'host', 'agent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE property_type AS ENUM ('rent', 'sale', 'buy');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_category') THEN
        CREATE TYPE property_category AS ENUM ('apartment', 'villa', 'house', 'duplex', 'studio', 'condo', 'townhouse');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'rented', 'inactive', 'deleted');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'expired');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
        CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('booking', 'message', 'review', 'system', 'promotion');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_preference') THEN
        CREATE TYPE gender_preference AS ENUM ('any', 'male', 'female', 'non_binary');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'smoking_preference') THEN
        CREATE TYPE smoking_preference AS ENUM ('any', 'smoker', 'non_smoker');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pet_preference') THEN
        CREATE TYPE pet_preference AS ENUM ('any', 'pets_allowed', 'no_pets');
    END IF;
END $$;

-- ============================================================================
-- PUBLIC PROFILES (extends Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Device binding table for security
CREATE TABLE IF NOT EXISTS public.device_bindings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_manufacturer TEXT,
    device_model TEXT,
    os_version TEXT,
    platform TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    bound_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    unbound_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, device_id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    dark_mode_enabled BOOLEAN DEFAULT FALSE,
    location_enabled BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'en',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- PROPERTIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type property_type NOT NULL,
    category property_category NOT NULL,
    status listing_status DEFAULT 'active',
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property details
    price DECIMAL(12, 2) NOT NULL,
    bedrooms INTEGER,
    bathrooms DECIMAL(3, 1),
    square_feet INTEGER,
    year_built INTEGER,
    
    -- Host information
    host_name TEXT,
    host_phone TEXT,
    host_email TEXT,
    
    -- Ratings
    rating_avg DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Property images
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Property facilities/amenities
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.property_facilities (
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (property_id, facility_id)
);

-- ============================================================================
-- ROOMMATE LISTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.roommate_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Roommate listing images
CREATE TABLE IF NOT EXISTS public.roommate_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- FAVORITES & SAVED ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    roommate_listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE SET NULL,
    
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT booking_target CHECK (
        (property_id IS NOT NULL AND roommate_listing_id IS NULL) OR
        (property_id IS NULL AND roommate_listing_id IS NOT NULL)
    )
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    provider TEXT,
    last_four TEXT,
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    
    -- Payment details
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    
    -- Transaction info
    transaction_id TEXT,
    gateway_response TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    other_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE SET NULL,
    
    -- Conversation info
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT unique_conversation UNIQUE (user_id, other_user_id, property_id, roommate_listing_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    status message_status DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    roommate_listing_id UUID REFERENCES public.roommate_listings(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    
    -- Rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Review content
    title TEXT,
    content TEXT,
    
    -- Status
    is_visible BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
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

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    -- Related entities
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- SEARCH HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Device bindings indexes
CREATE INDEX IF NOT EXISTS idx_device_bindings_user_id ON public.device_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_device_bindings_device_id ON public.device_bindings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_bindings_is_active ON public.device_bindings(is_active);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_rating_avg ON public.properties(rating_avg);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_listed_at ON public.properties(listed_at);

-- Property images indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_is_primary ON public.property_images(is_primary);

-- Roommate listings indexes
CREATE INDEX IF NOT EXISTS idx_roommate_listings_user_id ON public.roommate_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_roommate_listings_city ON public.roommate_listings(city);
CREATE INDEX IF NOT EXISTS idx_roommate_listings_is_active ON public.roommate_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_roommate_listings_location ON public.roommate_listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_roommate_listings_created_at ON public.roommate_listings(created_at);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_roommate_listing_id ON public.favorites(roommate_listing_id);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON public.bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_other_user_id ON public.conversations(other_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_property_id ON public.conversations(property_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Search history indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS roommate_listings_updated_at ON public.roommate_listings;
CREATE TRIGGER roommate_listings_updated_at BEFORE UPDATE ON public.roommate_listings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update property rating when review is added/updated
CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.property_id IS NOT NULL THEN
        UPDATE public.properties 
        SET rating_avg = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.reviews 
            WHERE property_id = NEW.property_id AND is_visible = TRUE
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM public.reviews 
            WHERE property_id = NEW.property_id AND is_visible = TRUE
        )
        WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_property_rating_trigger ON public.reviews;
CREATE TRIGGER update_property_rating_trigger AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_property_rating();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
    ref TEXT;
BEGIN
    LOOP
        ref := 'BK' || UPPER(encode(gen_random_bytes(4), 'hex'));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE reference = ref);
    END LOOP;
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's unread notifications count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Device bindings policies
DROP POLICY IF EXISTS "Users can view own device bindings" ON public.device_bindings;
CREATE POLICY "Users can view own device bindings" ON public.device_bindings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own device bindings" ON public.device_bindings;
CREATE POLICY "Users can insert own device bindings" ON public.device_bindings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own device bindings" ON public.device_bindings;
CREATE POLICY "Users can update own device bindings" ON public.device_bindings
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Properties policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Hosts can view own properties" ON public.properties;
CREATE POLICY "Hosts can view own properties" ON public.properties
    FOR SELECT USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can insert properties" ON public.properties;
CREATE POLICY "Hosts can insert properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own properties" ON public.properties;
CREATE POLICY "Hosts can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own properties" ON public.properties;
CREATE POLICY "Hosts can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = host_id);

-- Property images policies
DROP POLICY IF EXISTS "Anyone can view property images" ON public.property_images;
CREATE POLICY "Anyone can view property images" ON public.property_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts can insert images for own properties" ON public.property_images;
CREATE POLICY "Hosts can insert images for own properties" ON public.property_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE id = property_id AND host_id = auth.uid()
        )
    );

-- Facilities policies
DROP POLICY IF EXISTS "Anyone can view facilities" ON public.facilities;
CREATE POLICY "Anyone can view facilities" ON public.facilities
    FOR SELECT USING (true);

-- Property facilities policies
DROP POLICY IF EXISTS "Anyone can view property facilities" ON public.property_facilities;
CREATE POLICY "Anyone can view property facilities" ON public.property_facilities
    FOR SELECT USING (true);

-- Roommate listings policies
DROP POLICY IF EXISTS "Anyone can view active roommate listings" ON public.roommate_listings;
CREATE POLICY "Anyone can view active roommate listings" ON public.roommate_listings
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can view own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can view own roommate listings" ON public.roommate_listings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can insert roommate listings" ON public.roommate_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can update own roommate listings" ON public.roommate_listings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own roommate listings" ON public.roommate_listings;
CREATE POLICY "Users can delete own roommate listings" ON public.roommate_listings
    FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert favorites" ON public.favorites;
CREATE POLICY "Users can insert favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Hosts can view bookings for their properties" ON public.bookings;
CREATE POLICY "Hosts can view bookings for their properties" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE id = property_id AND host_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
CREATE POLICY "Users can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods policies
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert payments" ON public.payments;
CREATE POLICY "Users can insert payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = other_user_id);

DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND (user_id = auth.uid() OR other_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Reviews policies
DROP POLICY IF EXISTS "Anyone can view visible reviews" ON public.reviews;
CREATE POLICY "Anyone can view visible reviews" ON public.reviews
    FOR SELECT USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
CREATE POLICY "Users can view own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
CREATE POLICY "Users can insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Search history policies
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert search history" ON public.search_history;
CREATE POLICY "Users can insert search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
CREATE POLICY "Users can delete own search history" ON public.search_history
    FOR DELETE USING (auth.uid() = user_id);
