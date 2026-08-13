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
  id, reference, status, check_in_date, check_out_date, guests, total_amount,
  special_requests, created_at, confirmed_at, cancelled_at, completed_at,
  user_id, property_id, roommate_listing_id,
  profiles:user_id (id, full_name, email, avatar_url),
  properties:property_id (id, title, city, price, host_id),
  roommate_listings:roommate_listing_id (id, title, city)
`;

const SORTABLE = ['created_at', 'check_in_date', 'total_amount', 'reference'];
const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'expired'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('bookings')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order(column, { ascending, nullsFirst: false })
      .range(from, to);

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.userId) query = query.eq('user_id', req.query.userId);
    if (req.query.propertyId) query = query.eq('property_id', req.query.propertyId);
    if (req.query.minAmount) query = query.gte('total_amount', req.query.minAmount);
    if (req.query.maxAmount) query = query.lte('total_amount', req.query.maxAmount);

    const dateField = req.query.dateField === 'check_in_date' ? 'check_in_date' : 'created_at';
    if (req.query.from) query = query.gte(dateField, req.query.from);
    if (req.query.to) query = query.lte(dateField, req.query.to);

    if (req.query.q) {
      const term = escapeFilterValue(req.query.q);
      if (term) query = query.ilike('reference', `%${term}%`);
    }

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing bookings');
    res.json({ data: data || [], count: count || 0, page, pageSize });
  })
);

/** Aggregate strip shown above the bookings table. */
router.get(
  '/summary',
  asyncRoute(async (req, res) => {
    let query = supabase.from('bookings').select('status, total_amount, created_at');
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);

    const { data, error } = await query;
    throwOnSupabaseError(error, 'summarising bookings');

    const rows = data || [];
    const total = rows.length;
    const byStatus = {};
    for (const status of STATUSES) byStatus[status] = 0;
    let gross = 0;
    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      gross += Number(row.total_amount) || 0;
    }

    res.json({
      data: {
        total,
        by_status: byStatus,
        gross_value: gross,
        average_value: total ? gross / total : 0,
        cancellation_rate: total ? (byStatus.cancelled / total) * 100 : 0,
        completion_rate: total ? (byStatus.completed / total) * 100 : 0,
      },
    });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        `*, profiles:user_id (id, full_name, email, phone, avatar_url, is_suspended),
         properties:property_id (id, title, city, address, price, host_id, host_name, host_email),
         roommate_listings:roommate_listing_id (id, title, city)`
      )
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(error, 'loading booking');
    if (!booking) throw notFound('Booking not found');

    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, currency, status, transaction_id, created_at, completed_at, refunded_at')
      .eq('booking_id', req.params.id)
      .order('created_at', { ascending: false });

    res.json({ data: { booking, payments: payments || [] } });
  })
);

/**
 * Changing status fires the existing notify_booking_status_change trigger, so
 * the guest receives an in-app notification automatically.
 */
router.patch(
  '/:id',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    if (!STATUSES.includes(req.body.status)) throw badRequest('Invalid booking status');

    const { data: before, error: loadError } = await supabase
      .from('bookings')
      .select('id, reference, status')
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(loadError, 'loading booking');
    if (!before) throw notFound('Booking not found');

    const now = new Date().toISOString();
    const updates = { status: req.body.status };
    if (req.body.status === 'confirmed') updates.confirmed_at = now;
    if (req.body.status === 'cancelled') updates.cancelled_at = now;
    if (req.body.status === 'completed') updates.completed_at = now;

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, reference, status, confirmed_at, cancelled_at, completed_at')
      .single();
    throwOnSupabaseError(error, 'updating booking');

    await logAction(req, {
      action: 'booking.status_change',
      table: 'bookings',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

module.exports = router;
