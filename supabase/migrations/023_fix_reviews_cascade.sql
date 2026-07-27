-- Fix reviews FKs so deleting a property or roommate listing cascades instead of
-- setting the reference to NULL, which would violate the review_target check constraint.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'reviews'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name IN ('property_id', 'roommate_listing_id')
  LOOP
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', c.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_roommate_listing_id_fkey
  FOREIGN KEY (roommate_listing_id) REFERENCES public.roommate_listings(id) ON DELETE CASCADE;
