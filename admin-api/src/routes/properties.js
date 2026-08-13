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
  id, title, type, category, status, price, city, state, country, address,
  bedrooms, bathrooms, square_feet, view_count, favorite_count, inquiry_count,
  rating_avg, review_count, is_featured, host_id, host_name, host_email, host_phone,
  moderation_note, moderated_at, created_at, listed_at, expires_at, deleted_at,
  profiles:host_id (id, full_name, email, avatar_url, is_suspended),
  property_images (image_url, is_primary, display_order)
`;

const SORTABLE = ['created_at', 'price', 'view_count', 'favorite_count', 'rating_avg', 'title'];

const withThumbnail = (row) => {
  const images = row.property_images || [];
  const primary =
    images.find((i) => i.is_primary) ||
    [...images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];
  const { property_images, ...rest } = row;
  return { ...rest, thumbnail: primary?.image_url || null, image_count: images.length };
};

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('properties')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order(column, { ascending, nullsFirst: false })
      .range(from, to);

    if (req.query.includeDeleted !== 'true') query = query.is('deleted_at', null);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.type) query = query.eq('type', req.query.type);
    if (req.query.category) query = query.eq('category', req.query.category);
    if (req.query.featured === 'true') query = query.eq('is_featured', true);
    if (req.query.hostId) query = query.eq('host_id', req.query.hostId);
    if (req.query.city) query = query.ilike('city', `%${escapeFilterValue(req.query.city)}%`);
    if (req.query.minPrice) query = query.gte('price', req.query.minPrice);
    if (req.query.maxPrice) query = query.lte('price', req.query.maxPrice);
    if (req.query.bedrooms) query = query.gte('bedrooms', req.query.bedrooms);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);
    if (req.query.q) {
      const term = escapeFilterValue(req.query.q);
      if (term) {
        query = query.or(`title.ilike.%${term}%,address.ilike.%${term}%,city.ilike.%${term}%`);
      }
    }

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing properties');
    res.json({ data: (data || []).map(withThumbnail), count: count || 0, page, pageSize });
  })
);

/**
 * Moderation queue: things a human should look at. Registered before '/:id' so
 * the literal path is not swallowed by the id parameter.
 */
router.get(
  '/moderation-queue',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('properties')
      .select(LIST_COLUMNS)
      .is('deleted_at', null)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(200);
    throwOnSupabaseError(error, 'loading moderation queue');

    const rows = (data || []).map(withThumbnail);
    const prices = rows
      .map((r) => Number(r.price) || 0)
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;

    const flagged = [];
    for (const row of rows) {
      const flags = [];
      if (row.status === 'pending') flags.push('Awaiting approval');
      if (!row.image_count) flags.push('No images');
      if (median && Number(row.price) > median * 5) flags.push('Price far above median');
      if (median && Number(row.price) > 0 && Number(row.price) < median / 10) {
        flags.push('Price far below median');
      }
      if (row.profiles?.is_suspended) flags.push('Host is suspended');
      if (!row.title || row.title.trim().length < 8) flags.push('Title looks incomplete');
      if (flags.length) flagged.push({ ...row, flags });
    }

    res.json({ data: flagged, count: flagged.length, median_price: median });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { data: property, error } = await supabase
      .from('properties')
      .select(
        `*, profiles:host_id (id, full_name, email, phone, avatar_url, is_suspended, is_verified),
         property_images (id, image_url, alt_text, is_primary, display_order),
         property_facilities (facilities (id, name, icon))`
      )
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(error, 'loading property');
    if (!property) throw notFound('Property not found');

    const [bookings, reviews, views] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, reference, status, total_amount, check_in_date, check_out_date, created_at, profiles:user_id (full_name, email)')
        .eq('property_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('reviews')
        .select('id, rating, title, content, is_visible, created_at, profiles:user_id (full_name, avatar_url)')
        .eq('property_id', req.params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('property_views')
        .select('viewed_at')
        .eq('property_id', req.params.id)
        .order('viewed_at', { ascending: false })
        .limit(1000),
    ]);

    res.json({
      data: {
        property,
        bookings: bookings.data || [],
        reviews: reviews.data || [],
        views: views.data || [],
      },
    });
  })
);

const loadProperty = async (id) => {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, status, is_featured, moderation_note, deleted_at')
    .eq('id', id)
    .maybeSingle();
  throwOnSupabaseError(error, 'loading property');
  if (!data) throw notFound('Property not found');
  return data;
};

const STATUSES = ['active', 'pending', 'sold', 'rented', 'inactive', 'deleted'];

router.patch(
  '/:id',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const before = await loadProperty(req.params.id);
    const updates = {};

    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) throw badRequest('Invalid status');
      updates.status = req.body.status;
    }
    if (req.body.is_featured !== undefined) updates.is_featured = !!req.body.is_featured;
    if (req.body.moderation_note !== undefined) updates.moderation_note = req.body.moderation_note;
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    updates.moderated_at = new Date().toISOString();
    updates.moderated_by = req.admin.id;

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, title, status, is_featured, moderation_note, moderated_at')
      .single();
    throwOnSupabaseError(error, 'updating property');

    await logAction(req, {
      action: 'property.update',
      table: 'properties',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/** approve -> active, reject -> inactive (reason required). */
router.post(
  '/:id/moderate',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const decision = req.body.decision;
    if (!['approve', 'reject'].includes(decision)) {
      throw badRequest("decision must be 'approve' or 'reject'");
    }
    const reason = (req.body.reason || '').trim();
    if (decision === 'reject' && !reason) throw badRequest('A reason is required to reject');

    const before = await loadProperty(req.params.id);
    const { data, error } = await supabase
      .from('properties')
      .update({
        status: decision === 'approve' ? 'active' : 'inactive',
        moderation_note: reason || null,
        moderated_at: new Date().toISOString(),
        moderated_by: req.admin.id,
      })
      .eq('id', req.params.id)
      .select('id, title, status, moderation_note, moderated_at')
      .single();
    throwOnSupabaseError(error, 'moderating property');

    await logAction(req, {
      action: `property.${decision}`,
      table: 'properties',
      id: req.params.id,
      before,
      after: data,
      reason,
    });
    res.json({ data });
  })
);

/** Soft delete: sets deleted_at + status so the mobile app stops serving it. */
router.delete(
  '/:id',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (!reason) throw badRequest('A reason is required to remove a listing');

    const before = await loadProperty(req.params.id);
    const { data, error } = await supabase
      .from('properties')
      .update({
        deleted_at: new Date().toISOString(),
        status: 'deleted',
        moderation_note: reason,
        moderated_at: new Date().toISOString(),
        moderated_by: req.admin.id,
      })
      .eq('id', req.params.id)
      .select('id, title, status, deleted_at')
      .single();
    throwOnSupabaseError(error, 'removing property');

    await logAction(req, {
      action: 'property.soft_delete',
      table: 'properties',
      id: req.params.id,
      before,
      after: data,
      reason,
    });
    res.json({ data });
  })
);

router.post(
  '/:id/restore',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const before = await loadProperty(req.params.id);
    const { data, error } = await supabase
      .from('properties')
      .update({ deleted_at: null, status: 'active' })
      .eq('id', req.params.id)
      .select('id, title, status, deleted_at')
      .single();
    throwOnSupabaseError(error, 'restoring property');

    await logAction(req, {
      action: 'property.restore',
      table: 'properties',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

module.exports = router;
