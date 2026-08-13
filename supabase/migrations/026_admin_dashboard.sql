-- ============================================================================
-- Admin Dashboard
-- ============================================================================
-- Adds the schema required by the web admin dashboard:
--   * admin_users      - allowlist of dashboard operators (decoupled from profiles)
--   * admin_audit_log  - immutable record of every mutating admin action
--   * admin_settings   - key/value config editable from the Settings page
--   * moderation columns on profiles / properties / roommate_listings
--   * admin_* analytics functions for platform-wide KPIs and time series
--
-- SECURITY MODEL
-- The dashboard never talks to Postgres directly. A separate Node service
-- (admin-api/) holds the service_role key, verifies the caller's JWT, checks
-- admin_users membership and then queries on their behalf. Because of that:
--   * admin_users / admin_audit_log / admin_settings have RLS enabled with NO
--     policies, so anon + authenticated clients (the mobile app) see nothing.
--   * the admin_* functions have EXECUTE revoked from anon + authenticated.
-- No admin policies are added to existing tables, so mobile app RLS is unchanged.
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'analyst');
    END IF;
END $$;

-- ============================================================================
-- ADMIN USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role admin_role NOT NULL DEFAULT 'moderator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON public.admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);

DROP TRIGGER IF EXISTS admin_users_updated_at ON public.admin_users;
CREATE TRIGGER admin_users_updated_at BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    admin_email TEXT,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    before JSONB,
    after JSONB,
    reason TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- ============================================================================
-- ADMIN SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.admin_settings (key, value, description) VALUES
    ('listing_expiry_days', '90'::jsonb, 'Days after which a listing is considered stale'),
    ('featured_listing_slots', '6'::jsonb, 'Maximum number of simultaneously featured listings'),
    ('moderation_require_approval', 'false'::jsonb, 'When true, new listings start as pending instead of active'),
    ('booking_completion_target', '80'::jsonb, 'Target booking completion rate (%) shown on the Overview gauge')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MODERATION COLUMNS
-- ============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS moderation_note TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

ALTER TABLE public.roommate_listings
    ADD COLUMN IF NOT EXISTS moderation_note TEXT,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON public.properties(is_featured);

COMMENT ON COLUMN public.profiles.is_suspended IS 'Set by an admin; blocks the user at mobile sign-in';
COMMENT ON COLUMN public.profiles.last_seen_at IS 'Updated on app open; powers active-user metrics';

-- Suspended users must not be able to clear their own suspension. The existing
-- "Users can update own profile" policy allows updating any column, so lock the
-- moderation columns down with a trigger instead of widening RLS.
CREATE OR REPLACE FUNCTION public.protect_profile_moderation_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- auth.uid() is NULL for the service role, which is how admins make changes.
    IF auth.uid() IS NOT NULL THEN
        NEW.is_suspended := OLD.is_suspended;
        NEW.suspended_at := OLD.suspended_at;
        NEW.suspension_reason := OLD.suspension_reason;
        NEW.role := OLD.role;
        NEW.is_verified := OLD.is_verified;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_protect_moderation ON public.profiles;
CREATE TRIGGER profiles_protect_moderation BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_moderation_columns();

-- ============================================================================
-- ROW LEVEL SECURITY - admin tables are service-role only
-- ============================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Intentionally no policies: with RLS enabled and zero policies, anon and
-- authenticated roles can neither read nor write. service_role bypasses RLS.
REVOKE ALL ON public.admin_users FROM anon, authenticated;
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
REVOKE ALL ON public.admin_settings FROM anon, authenticated;

-- ============================================================================
-- ANALYTICS: platform KPIs
-- ============================================================================

-- Returns one row of platform-wide counters for the window [p_from, p_to).
-- Cumulative figures (total_users, active_listings, ...) ignore the window;
-- "new_*" and money figures respect it.
CREATE OR REPLACE FUNCTION public.admin_kpis(
    p_from TIMESTAMP WITH TIME ZONE DEFAULT (now() - INTERVAL '30 days'),
    p_to   TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        -- users
        'total_users',            (SELECT COUNT(*) FROM public.profiles),
        'new_users',              (SELECT COUNT(*) FROM public.profiles WHERE created_at >= p_from AND created_at < p_to),
        'new_users_prev',         (SELECT COUNT(*) FROM public.profiles WHERE created_at >= p_from - (p_to - p_from) AND created_at < p_from),
        'verified_users',         (SELECT COUNT(*) FROM public.profiles WHERE is_verified),
        'suspended_users',        (SELECT COUNT(*) FROM public.profiles WHERE is_suspended),
        'hosts',                  (SELECT COUNT(DISTINCT host_id) FROM public.properties WHERE deleted_at IS NULL),
        'active_users',           (
            SELECT COUNT(*) FROM (
                SELECT user_id FROM public.property_views
                    WHERE user_id IS NOT NULL AND viewed_at >= p_from AND viewed_at < p_to
                UNION
                SELECT sender_id FROM public.messages WHERE created_at >= p_from AND created_at < p_to
                UNION
                SELECT user_id FROM public.search_history WHERE created_at >= p_from AND created_at < p_to
            ) AS activity
        ),

        -- properties
        'total_listings',         (SELECT COUNT(*) FROM public.properties WHERE deleted_at IS NULL),
        'active_listings',        (SELECT COUNT(*) FROM public.properties WHERE status = 'active' AND deleted_at IS NULL),
        'pending_listings',       (SELECT COUNT(*) FROM public.properties WHERE status = 'pending' AND deleted_at IS NULL),
        'inactive_listings',      (SELECT COUNT(*) FROM public.properties WHERE status = 'inactive' AND deleted_at IS NULL),
        'deleted_listings',       (SELECT COUNT(*) FROM public.properties WHERE deleted_at IS NOT NULL),
        'featured_listings',      (SELECT COUNT(*) FROM public.properties WHERE is_featured AND deleted_at IS NULL),
        'new_listings',           (SELECT COUNT(*) FROM public.properties WHERE created_at >= p_from AND created_at < p_to),
        'new_listings_prev',      (SELECT COUNT(*) FROM public.properties WHERE created_at >= p_from - (p_to - p_from) AND created_at < p_from),
        'avg_price',              (SELECT COALESCE(ROUND(AVG(price), 2), 0) FROM public.properties WHERE status = 'active' AND deleted_at IS NULL),

        -- roommate listings
        'roommate_listings',      (SELECT COUNT(*) FROM public.roommate_listings),
        'active_roommate_listings',(SELECT COUNT(*) FROM public.roommate_listings WHERE is_active),
        'new_roommate_listings',  (SELECT COUNT(*) FROM public.roommate_listings WHERE created_at >= p_from AND created_at < p_to),

        -- engagement (counters on properties are cumulative all-time)
        'total_views',            (SELECT COALESCE(SUM(view_count), 0) FROM public.properties WHERE deleted_at IS NULL),
        'total_favorites',        (SELECT COALESCE(SUM(favorite_count), 0) FROM public.properties WHERE deleted_at IS NULL),
        'total_inquiries',        (SELECT COALESCE(SUM(inquiry_count), 0) FROM public.properties WHERE deleted_at IS NULL),
        'views_in_range',         (SELECT COUNT(*) FROM public.property_views WHERE viewed_at >= p_from AND viewed_at < p_to),
        'views_prev',             (SELECT COUNT(*) FROM public.property_views WHERE viewed_at >= p_from - (p_to - p_from) AND viewed_at < p_from),
        'favorites_in_range',     (SELECT COUNT(*) FROM public.favorites WHERE created_at >= p_from AND created_at < p_to),
        'messages_in_range',      (SELECT COUNT(*) FROM public.messages WHERE created_at >= p_from AND created_at < p_to),
        'conversations_in_range', (SELECT COUNT(*) FROM public.conversations WHERE created_at >= p_from AND created_at < p_to),
        'searches_in_range',      (SELECT COUNT(*) FROM public.search_history WHERE created_at >= p_from AND created_at < p_to),

        -- bookings
        'total_bookings',         (SELECT COUNT(*) FROM public.bookings),
        'bookings_in_range',      (SELECT COUNT(*) FROM public.bookings WHERE created_at >= p_from AND created_at < p_to),
        'bookings_prev',          (SELECT COUNT(*) FROM public.bookings WHERE created_at >= p_from - (p_to - p_from) AND created_at < p_from),
        'bookings_pending',       (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending'),
        'bookings_confirmed',     (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed'),
        'bookings_cancelled',     (SELECT COUNT(*) FROM public.bookings WHERE status = 'cancelled'),
        'bookings_completed',     (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed'),
        'bookings_expired',       (SELECT COUNT(*) FROM public.bookings WHERE status = 'expired'),

        -- money (bookings.total_amount is the practical source; payments may be sparse)
        'gross_booking_value',    (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at >= p_from AND created_at < p_to),
        'gross_booking_value_prev',(SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE created_at >= p_from - (p_to - p_from) AND created_at < p_from),
        'completed_revenue',      (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE status = 'completed' AND created_at >= p_from AND created_at < p_to),
        'payments_collected',     (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed' AND created_at >= p_from AND created_at < p_to),
        'payments_pending',       (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'pending'),
        'payments_failed_count',  (SELECT COUNT(*) FROM public.payments WHERE status = 'failed'),

        -- reviews
        'total_reviews',          (SELECT COUNT(*) FROM public.reviews),
        'hidden_reviews',         (SELECT COUNT(*) FROM public.reviews WHERE NOT is_visible),
        'avg_rating',             (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM public.reviews WHERE is_visible),

        -- push health
        'push_failures',          (SELECT COUNT(*) FROM public.notifications WHERE push_error IS NOT NULL),
        'active_push_tokens',     (SELECT COUNT(*) FROM public.push_tokens WHERE is_active)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ANALYTICS: time series
-- ============================================================================

-- p_metric: signups | listings | roommate_listings | views | bookings | revenue
--           | messages | favorites | searches
-- p_bucket: hour | day | week | month
-- Empty buckets are returned as 0 so charts do not have gaps.
CREATE OR REPLACE FUNCTION public.admin_timeseries(
    p_metric TEXT,
    p_bucket TEXT DEFAULT 'day',
    p_from   TIMESTAMP WITH TIME ZONE DEFAULT (now() - INTERVAL '30 days'),
    p_to     TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (bucket TIMESTAMP WITH TIME ZONE, value NUMERIC) AS $$
DECLARE
    v_bucket TEXT;
    v_step   INTERVAL;
BEGIN
    v_bucket := lower(coalesce(p_bucket, 'day'));
    IF v_bucket NOT IN ('hour', 'day', 'week', 'month') THEN
        RAISE EXCEPTION 'Invalid bucket: %', p_bucket;
    END IF;
    v_step := ('1 ' || v_bucket)::INTERVAL;

    RETURN QUERY
    WITH series AS (
        SELECT generate_series(
            date_trunc(v_bucket, p_from),
            date_trunc(v_bucket, p_to),
            v_step
        ) AS b
    ),
    events AS (
        SELECT date_trunc(v_bucket, ts) AS b, SUM(amount) AS total
        FROM (
            SELECT created_at AS ts, 1::NUMERIC AS amount
                FROM public.profiles
                WHERE p_metric = 'signups' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.properties
                WHERE p_metric = 'listings' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.roommate_listings
                WHERE p_metric = 'roommate_listings' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            -- property_views.viewed_at is TIMESTAMP (no zone); treat it as UTC.
            SELECT (viewed_at AT TIME ZONE 'UTC'), 1::NUMERIC
                FROM public.property_views
                WHERE p_metric = 'views'
                  AND (viewed_at AT TIME ZONE 'UTC') >= p_from
                  AND (viewed_at AT TIME ZONE 'UTC') < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.bookings
                WHERE p_metric = 'bookings' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, COALESCE(total_amount, 0)
                FROM public.bookings
                WHERE p_metric = 'revenue' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.messages
                WHERE p_metric = 'messages' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.favorites
                WHERE p_metric = 'favorites' AND created_at >= p_from AND created_at < p_to
            UNION ALL
            SELECT created_at, 1::NUMERIC
                FROM public.search_history
                WHERE p_metric = 'searches' AND created_at >= p_from AND created_at < p_to
        ) AS raw
        GROUP BY 1
    )
    SELECT s.b, COALESCE(e.total, 0)
    FROM series s
    LEFT JOIN events e ON e.b = s.b
    ORDER BY s.b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ANALYTICS: breakdowns
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_top_cities(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (city TEXT, listings BIGINT, avg_price NUMERIC, total_views BIGINT) AS $$
    SELECT
        COALESCE(p.city, 'Unknown') AS city,
        COUNT(*)::BIGINT AS listings,
        COALESCE(ROUND(AVG(p.price), 2), 0) AS avg_price,
        COALESCE(SUM(p.view_count), 0)::BIGINT AS total_views
    FROM public.properties p
    WHERE p.deleted_at IS NULL
    GROUP BY COALESCE(p.city, 'Unknown')
    ORDER BY listings DESC, total_views DESC
    LIMIT GREATEST(p_limit, 1);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_top_listings(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    city TEXT,
    price NUMERIC,
    host_name TEXT,
    image_url TEXT,
    view_count INTEGER,
    favorite_count INTEGER,
    inquiry_count INTEGER,
    rating_avg NUMERIC,
    review_count INTEGER,
    revenue NUMERIC
) AS $$
    SELECT
        p.id,
        p.title,
        p.city,
        p.price,
        COALESCE(p.host_name, pr.full_name) AS host_name,
        (SELECT pi.image_url FROM public.property_images pi
          WHERE pi.property_id = p.id
          ORDER BY pi.is_primary DESC, pi.display_order ASC
          LIMIT 1) AS image_url,
        p.view_count,
        p.favorite_count,
        p.inquiry_count,
        p.rating_avg,
        p.review_count,
        COALESCE((SELECT SUM(b.total_amount) FROM public.bookings b
                   WHERE b.property_id = p.id AND b.status IN ('completed', 'confirmed')), 0) AS revenue
    FROM public.properties p
    LEFT JOIN public.profiles pr ON pr.id = p.host_id
    WHERE p.deleted_at IS NULL
    ORDER BY p.view_count DESC NULLS LAST, p.favorite_count DESC NULLS LAST
    LIMIT GREATEST(p_limit, 1);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Views bucketed by day-of-week (0 = Sunday), for the "busiest day" bar chart.
CREATE OR REPLACE FUNCTION public.admin_views_by_weekday(
    p_from TIMESTAMP WITH TIME ZONE DEFAULT (now() - INTERVAL '30 days'),
    p_to   TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (weekday INTEGER, value BIGINT) AS $$
    WITH days AS (SELECT generate_series(0, 6) AS d)
    SELECT
        days.d::INTEGER AS weekday,
        COALESCE(COUNT(v.id), 0)::BIGINT AS value
    FROM days
    LEFT JOIN public.property_views v
        ON EXTRACT(DOW FROM (v.viewed_at AT TIME ZONE 'UTC'))::INTEGER = days.d
       AND (v.viewed_at AT TIME ZONE 'UTC') >= p_from
       AND (v.viewed_at AT TIME ZONE 'UTC') < p_to
    GROUP BY days.d
    ORDER BY days.d;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Listing counts grouped by an enum-ish column: category | type | status
CREATE OR REPLACE FUNCTION public.admin_listing_breakdown(p_dimension TEXT DEFAULT 'category')
RETURNS TABLE (label TEXT, value BIGINT) AS $$
BEGIN
    IF p_dimension NOT IN ('category', 'type', 'status') THEN
        RAISE EXCEPTION 'Invalid dimension: %', p_dimension;
    END IF;

    RETURN QUERY EXECUTE format(
        'SELECT %I::TEXT AS label, COUNT(*)::BIGINT AS value
           FROM public.properties
          WHERE deleted_at IS NULL
          GROUP BY 1
          ORDER BY value DESC', p_dimension);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Top search queries + zero-result searches, from search_history.
CREATE OR REPLACE FUNCTION public.admin_top_searches(p_limit INTEGER DEFAULT 15)
RETURNS TABLE (query TEXT, searches BIGINT, avg_results NUMERIC, zero_results BIGINT) AS $$
    SELECT
        lower(trim(sh.query)) AS query,
        COUNT(*)::BIGINT AS searches,
        COALESCE(ROUND(AVG(sh.results_count), 1), 0) AS avg_results,
        COUNT(*) FILTER (WHERE COALESCE(sh.results_count, 0) = 0)::BIGINT AS zero_results
    FROM public.search_history sh
    WHERE sh.query IS NOT NULL AND trim(sh.query) <> ''
    GROUP BY lower(trim(sh.query))
    ORDER BY searches DESC
    LIMIT GREATEST(p_limit, 1);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Rating distribution for the reviews page histogram.
CREATE OR REPLACE FUNCTION public.admin_rating_distribution()
RETURNS TABLE (rating INTEGER, value BIGINT) AS $$
    WITH scale AS (SELECT generate_series(1, 5) AS r)
    SELECT scale.r::INTEGER, COALESCE(COUNT(rv.id), 0)::BIGINT
    FROM scale
    LEFT JOIN public.reviews rv ON rv.rating = scale.r AND rv.is_visible
    GROUP BY scale.r
    ORDER BY scale.r;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- LOCK DOWN FUNCTION EXECUTION
-- ============================================================================
-- These are SECURITY DEFINER and read every table, so only the service role
-- (used by admin-api) may execute them.

DO $$
DECLARE
    fn TEXT;
BEGIN
    FOREACH fn IN ARRAY ARRAY[
        'public.admin_kpis(timestamptz, timestamptz)',
        'public.admin_timeseries(text, text, timestamptz, timestamptz)',
        'public.admin_top_cities(integer)',
        'public.admin_top_listings(integer)',
        'public.admin_views_by_weekday(timestamptz, timestamptz)',
        'public.admin_listing_breakdown(text)',
        'public.admin_top_searches(integer)',
        'public.admin_rating_distribution()'
    ]
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END LOOP;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.admin_users IS 'Dashboard operator allowlist. Service-role access only.';
COMMENT ON TABLE public.admin_audit_log IS 'Append-only record of every mutating admin action.';
COMMENT ON TABLE public.admin_settings IS 'Key/value configuration editable from the dashboard Settings page.';
COMMENT ON FUNCTION public.admin_kpis IS 'Platform-wide KPI snapshot for a time window. Service role only.';
COMMENT ON FUNCTION public.admin_timeseries IS 'Bucketed time series for a named metric. Service role only.';
