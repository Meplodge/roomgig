const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const {
  parsePaging,
  parseSort,
  asyncRoute,
  throwOnSupabaseError,
  badRequest,
  notFound,
} = require('../utils');

const router = express.Router();

const LIST_COLUMNS = `
  id, rating, title, content, is_visible, is_verified, created_at,
  user_id, property_id, roommate_listing_id,
  profiles:user_id (id, full_name, avatar_url, email),
  properties:property_id (id, title, city)
`;

const SORTABLE = ['created_at', 'rating'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('reviews')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order(column, { ascending })
      .range(from, to);

    if (req.query.rating) query = query.eq('rating', req.query.rating);
    if (req.query.visible === 'true') query = query.eq('is_visible', true);
    if (req.query.visible === 'false') query = query.eq('is_visible', false);
    if (req.query.verified === 'true') query = query.eq('is_verified', true);
    if (req.query.propertyId) query = query.eq('property_id', req.query.propertyId);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing reviews');
    res.json({ data: data || [], count: count || 0, page, pageSize });
  })
);

/**
 * Toggling is_visible recalculates properties.rating_avg / review_count through
 * the update_property_rating_trigger added in 001_initial_schema.sql.
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const { data: before, error: loadError } = await supabase
      .from('reviews')
      .select('id, rating, is_visible, is_verified, property_id')
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(loadError, 'loading review');
    if (!before) throw notFound('Review not found');

    const updates = {};
    if (req.body.is_visible !== undefined) updates.is_visible = !!req.body.is_visible;
    if (req.body.is_verified !== undefined) updates.is_verified = !!req.body.is_verified;
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, rating, is_visible, is_verified')
      .single();
    throwOnSupabaseError(error, 'updating review');

    await logAction(req, {
      action: 'review.update',
      table: 'reviews',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

router.delete(
  '/:id',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (!reason) throw badRequest('A reason is required to delete a review');

    const { data: before } = await supabase
      .from('reviews')
      .select('id, rating, title, content, user_id, property_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!before) throw notFound('Review not found');

    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    throwOnSupabaseError(error, 'deleting review');

    await logAction(req, {
      action: 'review.delete',
      table: 'reviews',
      id: req.params.id,
      before,
      reason,
    });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
