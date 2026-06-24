-- Add analytics fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_properties_view_count ON properties(view_count);
CREATE INDEX IF NOT EXISTS idx_properties_favorite_count ON properties(favorite_count);

-- Create function to update favorite count when favorite is added/removed
CREATE OR REPLACE FUNCTION update_property_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.property_id IS NOT NULL THEN
        UPDATE properties 
        SET favorite_count = favorite_count + 1
        WHERE id = NEW.property_id;
    ELSIF TG_OP = 'DELETE' AND OLD.property_id IS NOT NULL THEN
        UPDATE properties 
        SET favorite_count = GREATEST(favorite_count - 1, 0)
        WHERE id = OLD.property_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite count updates
CREATE TRIGGER update_favorite_count_on_favorites
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW EXECUTE FUNCTION update_property_favorite_count();

-- Create table for property views tracking
CREATE TABLE IF NOT EXISTS property_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    user_id UUID,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255)
);

-- Create indexes for property views
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- Create function to update view count
CREATE OR REPLACE FUNCTION update_property_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties 
    SET view_count = view_count + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view count updates
DROP TRIGGER IF EXISTS update_view_count_on_view ON property_views;
CREATE TRIGGER update_view_count_on_view
AFTER INSERT ON property_views
FOR EACH ROW EXECUTE FUNCTION update_property_view_count();

-- Create table for property inquiries (messages about properties)
CREATE TABLE IF NOT EXISTS property_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for property inquiries
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON property_inquiries(user_id);

-- Create function to update inquiry count
CREATE OR REPLACE FUNCTION update_property_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties 
    SET inquiry_count = inquiry_count + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inquiry count updates
CREATE TRIGGER update_inquiry_count_on_inquiry
AFTER INSERT ON property_inquiries
FOR EACH ROW EXECUTE FUNCTION update_property_inquiry_count();
