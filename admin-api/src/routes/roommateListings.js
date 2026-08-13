const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const {
  parsePaging,
  parseSort,
  escapeFilterValue,
  asyncRoute,
  throwOnSupabaseError,
  badRequest,
  notFound,
} = require('../utils');

const router = express.Router();

const LIST_COLUMNS = `
  id, title, city, state, age, occupation, budget_min, budget_max, move_in_date,
  lease_duration_months, gender_preference, smoking_preference, pet_preference,
  is_active, moderation_note, moderated_at, created_at, user_id,
  profiles:user_id (id, full_name, email, avatar_url, is_suspended),
  roommate_images (image_url, is_primary, display_order)
`;

const SORTABLE = ['created_at', 'budget_min', 'budget_max', 'age', 'title'];

const withThumbnail = (row) => {
  const images = row.roommate_images || [];
  const primary =
    images.find((i) => i.is_primary) ||
    [...images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];
  const { roommate_images, ...rest } = row;
  return { ...rest, thumbnail: primary?.image_url || null, image_count: images.length };
};

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('roommate_listings')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order(column, { ascending, nullsFirst: false })
      .range(from, to);

    if (req.query.active === 'true') query = query.eq('is_active', true);
    if (req.query.active === 'false') query = query.eq('is_active', false);
    if (req.query.city) query = query.ilike('city', `%${escapeFilterValue(req.query.city)}%`);
    if (req.query.userId) query = query.eq('user_id', req.query.userId);
    if (req.query.genderPreference) query = query.eq('gender_preference', req.query.genderPreference);
    if (req.query.smokingPreference) query = query.eq('smoking_preference', req.query.smokingPreference);
    if (req.query.petPreference) query = query.eq('pet_preference', req.query.petPreference);
    if (req.query.minBudget) query = query.gte('budget_max', req.query.minBudget);
    if (req.query.maxBudget) query = query.lte('budget_min', req.query.maxBudget);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);
    if (req.query.q) {
      const term = escapeFilterValue(req.query.q);
      if (term) {
        query = query.or(
          `title.ilike.%${term}%,city.ilike.%${term}%,occupation.ilike.%${term}%`
        );
      }
    }

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing roommate listings');
    res.json({ data: (data || []).map(withThumbnail), count: count || 0, page, pageSize });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('roommate_listings')
      .select(
        `*, profiles:user_id (id, full_name, email, phone, avatar_url, is_suspended, is_verified),
         roommate_images (id, image_url, is_primary, display_order, is_roommate_photo)`
      )
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(error, 'loading roommate listing');
    if (!data) throw notFound('Roommate listing not found');
    res.json({ data });
  })
);

const loadListing = async (id) => {
  const { data, error } = await supabase
    .from('roommate_listings')
    .select('id, title, is_active, moderation_note')
    .eq('id', id)
    .maybeSingle();
  throwOnSupabaseError(error, 'loading roommate listing');
  if (!data) throw notFound('Roommate listing not found');
  return data;
};

router.patch(
  '/:id',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const before = await loadListing(req.params.id);
    const updates = {};
    if (req.body.is_active !== undefined) updates.is_active = !!req.body.is_active;
    if (req.body.moderation_note !== undefined) updates.moderation_note = req.body.moderation_note;
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    updates.moderated_at = new Date().toISOString();
    updates.moderated_by = req.admin.id;

    const { data, error } = await supabase
      .from('roommate_listings')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, title, is_active, moderation_note, moderated_at')
      .single();
    throwOnSupabaseError(error, 'updating roommate listing');

    await logAction(req, {
      action: 'roommate_listing.update',
      table: 'roommate_listings',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/**
 * roommate_listings has no soft-delete column, so "remove" deactivates and
 * records why. Hard delete stays a super_admin action.
 */
router.delete(
  '/:id',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (!reason) throw badRequest('A reason is required to delete a listing');

    const before = await loadListing(req.params.id);
    const { error } = await supabase.from('roommate_listings').delete().eq('id', req.params.id);
    throwOnSupabaseError(error, 'deleting roommate listing');

    await logAction(req, {
      action: 'roommate_listing.delete',
      table: 'roommate_listings',
      id: req.params.id,
      before,
      reason,
    });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
