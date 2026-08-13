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

const PROFILE_COLUMNS = `
  id, email, full_name, avatar_url, phone, role, is_verified, is_suspended,
  suspended_at, suspension_reason, city, occupation, company_name, work_location,
  gender, nationality, date_of_birth, preferred_location, bio, last_seen_at,
  created_at, updated_at
`;

const SORTABLE = ['created_at', 'full_name', 'email', 'last_seen_at'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('profiles')
      .select(PROFILE_COLUMNS, { count: 'exact' })
      .order(column, { ascending })
      .range(from, to);

    if (req.query.q) {
      const term = escapeFilterValue(req.query.q);
      if (term) {
        query = query.or(
          `full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`
        );
      }
    }
    if (req.query.role) query = query.eq('role', req.query.role);
    if (req.query.suspended === 'true') query = query.eq('is_suspended', true);
    if (req.query.suspended === 'false') query = query.eq('is_suspended', false);
    if (req.query.verified === 'true') query = query.eq('is_verified', true);
    if (req.query.verified === 'false') query = query.eq('is_verified', false);
    if (req.query.city) query = query.ilike('city', `%${escapeFilterValue(req.query.city)}%`);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing users');

    // Per-user listing/booking counts, fetched in two grouped queries rather
    // than N+1 per row.
    const ids = (data || []).map((u) => u.id);
    const counts = {};
    if (ids.length) {
      const [props, bookings] = await Promise.all([
        supabase.from('properties').select('host_id').in('host_id', ids).is('deleted_at', null),
        supabase.from('bookings').select('user_id').in('user_id', ids),
      ]);
      for (const row of props.data || []) {
        counts[row.host_id] = counts[row.host_id] || { listings: 0, bookings: 0 };
        counts[row.host_id].listings += 1;
      }
      for (const row of bookings.data || []) {
        counts[row.user_id] = counts[row.user_id] || { listings: 0, bookings: 0 };
        counts[row.user_id].bookings += 1;
      }
    }

    res.json({
      data: (data || []).map((u) => ({
        ...u,
        listings_count: counts[u.id]?.listings || 0,
        bookings_count: counts[u.id]?.bookings || 0,
      })),
      count: count || 0,
      page,
      pageSize,
    });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    throwOnSupabaseError(error, 'loading user');
    if (!profile) throw notFound('User not found');

    const [
      properties,
      roommateListings,
      bookings,
      hostBookings,
      payments,
      paymentMethods,
      devices,
      pushTokens,
      preferences,
      reviewsWritten,
      searches,
      favorites,
      conversations,
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('id, title, status, price, city, view_count, favorite_count, inquiry_count, rating_avg, is_featured, created_at, deleted_at')
        .eq('host_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('roommate_listings')
        .select('id, title, city, budget_min, budget_max, is_active, move_in_date, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('id, reference, status, total_amount, check_in_date, check_out_date, created_at, property_id')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('bookings')
        .select('id, reference, status, total_amount, created_at, property_id, properties!inner(host_id)')
        .eq('properties.host_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('payments')
        .select('id, amount, currency, status, transaction_id, created_at, completed_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('payment_methods')
        .select('id, type, provider, last_four, expiry_month, expiry_year, is_default, is_active')
        .eq('user_id', id),
      supabase
        .from('device_bindings')
        .select('id, device_name, device_manufacturer, device_model, os_version, platform, is_active, bound_at, last_used_at')
        .eq('user_id', id)
        .order('last_used_at', { ascending: false }),
      supabase
        .from('push_tokens')
        .select('id, device_type, device_name, is_active, created_at, last_used_at')
        .eq('user_id', id),
      supabase.from('user_preferences').select('*').eq('user_id', id).maybeSingle(),
      supabase
        .from('reviews')
        .select('id, rating, title, content, is_visible, created_at, property_id')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('search_history')
        .select('id, query, filters, results_count, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('favorites')
        .select('id, property_id, roommate_listing_id, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('conversations')
        .select('id, last_message_at, unread_count, created_at', { count: 'exact' })
        .or(`user_id.eq.${id},other_user_id.eq.${id}`)
        .order('last_message_at', { ascending: false })
        .limit(25),
    ]);

    res.json({
      data: {
        profile,
        properties: properties.data || [],
        roommate_listings: roommateListings.data || [],
        bookings: bookings.data || [],
        host_bookings: hostBookings.data || [],
        payments: payments.data || [],
        payment_methods: paymentMethods.data || [],
        devices: devices.data || [],
        push_tokens: pushTokens.data || [],
        preferences: preferences.data || null,
        reviews: reviewsWritten.data || [],
        searches: searches.data || [],
        favorites: favorites.data || [],
        conversations: conversations.data || [],
        conversation_count: conversations.count || 0,
      },
    });
  })
);

const loadProfile = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_verified, is_suspended')
    .eq('id', id)
    .maybeSingle();
  throwOnSupabaseError(error, 'loading user');
  if (!data) throw notFound('User not found');
  return data;
};

/** Update role / verification. */
router.patch(
  '/:id',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const before = await loadProfile(req.params.id);
    const updates = {};

    if (req.body.role !== undefined) {
      if (!['user', 'admin', 'host', 'agent'].includes(req.body.role)) {
        throw badRequest('Invalid role');
      }
      updates.role = req.body.role;
    }
    if (req.body.is_verified !== undefined) updates.is_verified = !!req.body.is_verified;
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, full_name, role, is_verified, is_suspended')
      .single();
    throwOnSupabaseError(error, 'updating user');

    await logAction(req, {
      action: 'user.update',
      table: 'profiles',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

router.post(
  '/:id/suspend',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (!reason) throw badRequest('A reason is required to suspend a user');

    const before = await loadProfile(req.params.id);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: reason,
      })
      .eq('id', req.params.id)
      .select('id, email, full_name, is_suspended, suspended_at, suspension_reason')
      .single();
    throwOnSupabaseError(error, 'suspending user');

    // Revoke active sessions so the suspension takes effect immediately rather
    // than whenever their current token expires.
    const { error: signOutError } = await supabase.auth.admin.signOut(req.params.id, 'global');
    if (signOutError) console.warn('[users] could not revoke sessions:', signOutError.message);

    await logAction(req, {
      action: 'user.suspend',
      table: 'profiles',
      id: req.params.id,
      before,
      after: data,
      reason,
    });
    res.json({ data });
  })
);

router.post(
  '/:id/unsuspend',
  requireRole('super_admin', 'admin', 'moderator'),
  asyncRoute(async (req, res) => {
    const before = await loadProfile(req.params.id);
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_suspended: false, suspended_at: null, suspension_reason: null })
      .eq('id', req.params.id)
      .select('id, email, full_name, is_suspended')
      .single();
    throwOnSupabaseError(error, 'unsuspending user');

    await logAction(req, {
      action: 'user.unsuspend',
      table: 'profiles',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/** Force sign-out without suspending. */
router.post(
  '/:id/sign-out',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const { error } = await supabase.auth.admin.signOut(req.params.id, 'global');
    if (error) throwOnSupabaseError(error, 'revoking sessions');
    await logAction(req, {
      action: 'user.force_sign_out',
      table: 'profiles',
      id: req.params.id,
      reason: req.body.reason,
    });
    res.json({ data: { ok: true } });
  })
);

router.post(
  '/:id/devices/:deviceId/unbind',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('device_bindings')
      .update({ is_active: false, unbound_at: new Date().toISOString() })
      .eq('id', req.params.deviceId)
      .eq('user_id', req.params.id)
      .select()
      .maybeSingle();
    throwOnSupabaseError(error, 'unbinding device');
    if (!data) throw notFound('Device binding not found');

    await logAction(req, {
      action: 'user.unbind_device',
      table: 'device_bindings',
      id: req.params.deviceId,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/**
 * Hard delete. Cascades to listings, bookings, messages and reviews via the
 * FKs defined in 001_initial_schema.sql. super_admin only.
 */
router.delete(
  '/:id',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const reason = (req.body.reason || '').trim();
    if (!reason) throw badRequest('A reason is required to delete a user');

    const before = await loadProfile(req.params.id);
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throwOnSupabaseError(error, 'deleting user');

    await logAction(req, {
      action: 'user.delete',
      table: 'profiles',
      id: req.params.id,
      before,
      reason,
    });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
