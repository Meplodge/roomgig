const express = require('express');
const { supabase } = require('../supabase');
const { requireRole, invalidateAll } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const { asyncRoute, throwOnSupabaseError, badRequest, notFound } = require('../utils');

const router = express.Router();

const ROLES = ['super_admin', 'admin', 'moderator', 'analyst'];

router.get(
  '/',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, created_at, last_login_at, created_by')
      .order('created_at', { ascending: true });
    throwOnSupabaseError(error, 'listing admins');
    res.json({ data: data || [] });
  })
);

/**
 * Adds an admin. If no Supabase Auth user exists for the email, one is created
 * and an invite is sent so they can set their own password.
 */
router.post(
  '/',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const role = req.body.role || 'moderator';
    const fullName = (req.body.full_name || '').trim() || null;

    if (!email.includes('@')) throw badRequest('A valid email is required');
    if (!ROLES.includes(role)) throw badRequest('Invalid admin role');

    // listUsers has no email filter, so page through looking for a match.
    let authUser = null;
    for (let page = 1; page <= 20 && !authUser; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throwOnSupabaseError(error, 'looking up auth user');
      const match = (data?.users || []).find((u) => (u.email || '').toLowerCase() === email);
      if (match) authUser = match;
      if (!data?.users?.length || data.users.length < 200) break;
    }

    let invited = false;
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });
      if (error) {
        console.error('[admins] invite failed:', error.message);
        throw Object.assign(
          new Error(
            'Could not invite that email. Check that SMTP is configured in Supabase, or create the auth user first.'
          ),
          { status: 400 }
        );
      }
      authUser = data.user;
      invited = true;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        auth_user_id: authUser.id,
        email,
        full_name: fullName,
        role,
        created_by: req.admin.id,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single();
    // 23505 = unique_violation on auth_user_id / email
    if (error?.code === '23505') throw badRequest('That user is already an admin');
    throwOnSupabaseError(error, 'creating admin');

    await logAction(req, {
      action: 'admin.create',
      table: 'admin_users',
      id: data.id,
      after: data,
      reason: req.body.reason,
    });
    res.status(201).json({ data, invited });
  })
);

router.patch(
  '/:id',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const { data: before, error: loadError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', req.params.id)
      .maybeSingle();
    throwOnSupabaseError(loadError, 'loading admin');
    if (!before) throw notFound('Admin not found');

    const updates = {};
    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) throw badRequest('Invalid admin role');
      updates.role = req.body.role;
    }
    if (req.body.is_active !== undefined) updates.is_active = !!req.body.is_active;
    if (req.body.full_name !== undefined) updates.full_name = req.body.full_name;
    if (!Object.keys(updates).length) throw badRequest('Nothing to update');

    // Guard against locking everyone out of the dashboard.
    const losingSuperAdmin =
      before.role === 'super_admin' &&
      ((updates.role && updates.role !== 'super_admin') || updates.is_active === false);
    if (losingSuperAdmin) {
      const { count } = await supabase
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);
      if ((count || 0) <= 1) {
        throw badRequest('Cannot demote or deactivate the last active super admin');
      }
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, full_name, role, is_active')
      .single();
    throwOnSupabaseError(error, 'updating admin');

    invalidateAll();
    await logAction(req, {
      action: 'admin.update',
      table: 'admin_users',
      id: req.params.id,
      before,
      after: data,
      reason: req.body.reason,
    });
    res.json({ data });
  })
);

/** Removes dashboard access. The underlying auth user is left intact. */
router.delete(
  '/:id',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    if (req.params.id === req.admin.id) throw badRequest('You cannot remove your own access');

    const { data: before } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!before) throw notFound('Admin not found');

    const { error } = await supabase.from('admin_users').delete().eq('id', req.params.id);
    throwOnSupabaseError(error, 'removing admin');

    invalidateAll();
    await logAction(req, {
      action: 'admin.remove',
      table: 'admin_users',
      id: req.params.id,
      before,
      reason: req.body.reason,
    });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
