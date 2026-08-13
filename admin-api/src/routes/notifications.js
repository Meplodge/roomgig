const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const {
  parsePaging,
  parseRange,
  asyncRoute,
  throwOnSupabaseError,
  badRequest,
} = require('../utils');

const router = express.Router();

router.get(
  '/stats',
  asyncRoute(async (req, res) => {
    const { from, to } = parseRange(req.query);

    const [rows, tokens] = await Promise.all([
      supabase
        .from('notifications')
        .select('type, is_read, push_sent, push_error')
        .gte('created_at', from)
        .lt('created_at', to),
      supabase.from('push_tokens').select('device_type, is_active'),
    ]);
    throwOnSupabaseError(rows.error, 'loading notification stats');

    const byType = {};
    const errorsByMessage = {};
    let read = 0;
    let pushSent = 0;
    let pushFailed = 0;

    for (const row of rows.data || []) {
      byType[row.type] = (byType[row.type] || 0) + 1;
      if (row.is_read) read += 1;
      if (row.push_sent) pushSent += 1;
      if (row.push_error) {
        pushFailed += 1;
        const key = String(row.push_error).slice(0, 120);
        errorsByMessage[key] = (errorsByMessage[key] || 0) + 1;
      }
    }

    const byDevice = {};
    let activeTokens = 0;
    for (const token of tokens.data || []) {
      const key = token.device_type || 'unknown';
      byDevice[key] = (byDevice[key] || 0) + 1;
      if (token.is_active) activeTokens += 1;
    }

    const total = (rows.data || []).length;
    res.json({
      data: {
        total,
        read,
        unread: total - read,
        read_rate: total ? (read / total) * 100 : 0,
        by_type: byType,
        push_sent: pushSent,
        push_failed: pushFailed,
        push_errors: Object.entries(errorsByMessage)
          .map(([message, count]) => ({ message, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        tokens_total: (tokens.data || []).length,
        tokens_active: activeTokens,
        tokens_by_device: byDevice,
      },
      range: { from, to },
    });
  })
);

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);

    let query = supabase
      .from('notifications')
      .select(
        'id, type, title, message, is_read, push_sent, push_error, created_at, user_id, profiles:user_id (full_name, email)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (req.query.type) query = query.eq('type', req.query.type);
    if (req.query.failed === 'true') query = query.not('push_error', 'is', null);
    if (req.query.read === 'false') query = query.eq('is_read', false);

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing notifications');
    res.json({ data: data || [], count: count || 0, page, pageSize });
  })
);

/**
 * Broadcast an in-app notification to a filtered audience. Rows are inserted
 * here; delivery to devices is handled by the existing Expo push pipeline that
 * reads the notifications table.
 */
router.post(
  '/broadcast',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const title = (req.body.title || '').trim();
    const message = (req.body.message || '').trim();
    const type = req.body.type || 'system';

    if (!title || !message) throw badRequest('title and message are required');
    if (!['system', 'promotion'].includes(type)) {
      throw badRequest("Broadcasts must be of type 'system' or 'promotion'");
    }

    let audience = supabase.from('profiles').select('id').eq('is_suspended', false);
    if (req.body.city) audience = audience.ilike('city', `%${req.body.city}%`);
    if (req.body.role) audience = audience.eq('role', req.body.role);

    const { data: recipients, error: audienceError } = await audience;
    throwOnSupabaseError(audienceError, 'resolving broadcast audience');
    if (!recipients?.length) throw badRequest('That audience matched zero users');

    const rows = recipients.map((r) => ({ user_id: r.id, type, title, message }));

    // Chunked so a large audience does not exceed the request size limit.
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from('notifications').insert(chunk);
      throwOnSupabaseError(error, 'inserting broadcast notifications');
      inserted += chunk.length;
    }

    await logAction(req, {
      action: 'notification.broadcast',
      table: 'notifications',
      after: { title, message, type, recipients: inserted, city: req.body.city || null },
      reason: req.body.reason,
    });

    res.json({ data: { recipients: inserted } });
  })
);

module.exports = router;
