-- Backfill analytics data for existing properties

-- Update favorite_count based on existing favorites
UPDATE properties p
SET favorite_count = (
    SELECT COUNT(*) 
    FROM favorites f 
    WHERE f.property_id = p.id
)
WHERE favorite_count = 0;

-- Update inquiry_count based on existing conversations about properties
UPDATE properties p
SET inquiry_count = (
    SELECT COUNT(DISTINCT c.id)
    FROM conversations c
    WHERE c.property_id = p.id
)
WHERE inquiry_count = 0;

-- Set initial view_count based on property age (simulated data)
-- This gives older properties more views as a baseline
UPDATE properties p
SET view_count = GREATEST(
    FLOOR(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - p.created_at)) * 2 + 
           EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.created_at)) / 86400 * 0.5),
    10
)
WHERE view_count = 0;

-- Note: Actual view tracking will start from this point forward
-- as users view properties through the app
