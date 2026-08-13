const express = require('express');
const { supabase } = require('../supabase');
const {
  parsePaging,
  parseSort,
  escapeFilterValue,
  asyncRoute,
  throwOnSupabaseError,
  notFound,
} = require('../utils');

const router = express.Router();

const LIST_COLUMNS = `
  id, amount, currency, status, transaction_id, created_at, completed_at, refunded_at,
  user_id, booking_id, payment_method_id,
  profiles:user_id (id, full_name, email, avatar_url),
  bookings:booking_id (id, reference, status),
  payment_methods:payment_method_id (type, provider, last_four)
`;

const SORTABLE = ['created_at', 'amount', 'completed_at'];

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);
    const { column, ascending } = parseSort(req.query, SORTABLE, 'created_at');

    let query = supabase
      .from('payments')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order(column, { ascending, nullsFirst: false })
      .range(from, to);

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.userId) query = query.eq('user_id', req.query.userId);
    if (req.query.currency) query = query.eq('currency', req.query.currency);
    if (req.query.minAmount) query = query.gte('amount', req.query.minAmount);
    if (req.query.maxAmount) query = query.lte('amount', req.query.maxAmount);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);
    if (req.query.q) {
      const term = escapeFilterValue(req.query.q);
      if (term) query = query.ilike('transaction_id', `%${term}%`);
    }

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing payments');
    res.json({ data: data || [], count: count || 0, page, pageSize });
  })
);

router.get(
  '/summary',
  asyncRoute(async (req, res) => {
    let query = supabase.from('payments').select('status, amount, currency');
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);

    const { data, error } = await query;
    throwOnSupabaseError(error, 'summarising payments');

    const rows = data || [];
    const byStatus = { pending: 0, completed: 0, failed: 0, refunded: 0 };
    const amountByStatus = { pending: 0, completed: 0, failed: 0, refunded: 0 };
    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      amountByStatus[row.status] = (amountByStatus[row.status] || 0) + (Number(row.amount) || 0);
    }

    res.json({
      data: {
        total: rows.length,
        by_status: byStatus,
        amount_by_status: amountByStatus,
        collected: amountByStatus.completed,
        failure_rate: rows.length ? (byStatus.failed / rows.length) * 100 : 0,
      },
    });
  })
);

router.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('payments')
      .select(
        `*, profiles:user_id (id, full_name, email),
         bookings:booking_id (id, reference, status, total_amount),
         payment_methods:payment_method_id (type, provider, last_four, expiry_month, expiry_year)`
      )
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(error, 'loading payment');
    if (!data) throw notFound('Payment not found');
    res.json({ data });
  })
);

// NOTE: there is no payment gateway in this codebase, so payments are
// report-only. Refunds must be issued in the provider's own dashboard; the
// resulting status change then flows back into this table.

module.exports = router;
