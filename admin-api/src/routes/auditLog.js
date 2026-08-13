const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { parsePaging, asyncRoute, throwOnSupabaseError } = require('../utils');

const router = express.Router();

router.get(
  '/',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    const { page, pageSize, from, to } = parsePaging(req.query);

    let query = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (req.query.adminId) query = query.eq('admin_user_id', req.query.adminId);
    if (req.query.action) query = query.ilike('action', `%${req.query.action}%`);
    if (req.query.table) query = query.eq('target_table', req.query.table);
    if (req.query.from) query = query.gte('created_at', req.query.from);
    if (req.query.to) query = query.lte('created_at', req.query.to);

    const { data, count, error } = await query;
    throwOnSupabaseError(error, 'listing audit log');
    res.json({ data: data || [], count: count || 0, page, pageSize });
  })
);

module.exports = router;
