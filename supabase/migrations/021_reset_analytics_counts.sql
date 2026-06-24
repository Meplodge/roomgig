-- Reset all analytics counts to zero
UPDATE properties 
SET view_count = 0, 
    favorite_count = 0, 
    inquiry_count = 0;
