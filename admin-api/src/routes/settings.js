const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const { asyncRoute, throwOnSupabaseError, badRequest, notFound } = require('../utils');

const router = express.Router();

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase.from('admin_settings').select('*').order('key');
    throwOnSupabaseError(error, 'loading settings');
    res.json({ data: data || [] });
  })
);

router.patch(
  '/:key',
  requireRole('super_admin', 'admin'),
  asyncRoute(async (req, res) => {
    if (req.body.value === undefined) throw badRequest('value is required');

    const { data: before, error: loadError } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', req.params.key)
      .maybeSingle();
    throwOnSupabaseError(loadError, 'loading setting');
    if (!before) throw notFound('Unknown setting');

    const { data, error } = await supabase
      .from('admin_settings')
      .update({
        value: req.body.value,
        updated_by: req.admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq('key', req.params.key)
      .select()
      .single();
    throwOnSupabaseError(error, 'updating setting');

    await logAction(req, {
      action: 'settings.update',
      table: 'admin_settings',
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/** Health of the pieces the dashboard depends on, for the sidebar status card. */
router.get(
  '/system/health',
  asyncRoute(async (req, res) => {
    const checks = {};

    const started = Date.now();
    const { error: dbError } = await supabase
      .from('admin_settings')
      .select('key', { head: true, count: 'exact' });
    checks.database = {
      ok: !dbError,
      latency_ms: Date.now() - started,
      message: dbError ? 'Unreachable' : 'Connected',
    };

    const emailUrl = process.env.EMAIL_API_URL;
    if (emailUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${emailUrl.replace(/\/$/, '')}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        checks.email = { ok: response.ok, message: response.ok ? 'Reachable' : `HTTP ${response.status}` };
      } catch (error) {
        checks.email = { ok: false, message: 'Unreachable' };
      }
    } else {
      checks.email = { ok: null, message: 'Not configured' };
    }

    const { count: pushFailures } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .not('push_error', 'is', null);
    checks.push = {
      ok: (pushFailures || 0) === 0,
      message: pushFailures ? `${pushFailures} failed sends` : 'No failures',
    };

    res.json({ data: checks });
  })
);

module.exports = router;
