const express = require('express');
const { randomBytes } = require('crypto');
const { supabase } = require('../supabase');
const { requireRole, invalidateAll } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const { asyncRoute, throwOnSupabaseError, badRequest, notFound } = require('../utils');

const router = express.Router();

const ROLES = ['super_admin', 'admin', 'moderator', 'analyst'];

/**
 * Sends the admin invite email (with a temporary password) through the
 * email-notifications microservice instead of relying on Supabase's built-in
 * email service. Failures are logged but never block admin creation, so the
 * super admin can still share the temp password out-of-band.
 */
const sendInviteEmail = async ({ email, fullName, role, tempPassword }) => {
  const emailApiUrl = (process.env.EMAIL_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const dashboardUrl = process.env.ADMIN_DASHBOARD_ORIGIN || 'http://localhost:5173';
  const name = fullName || 'there';

  const html = `<p>Hi ${name},</p>
<p>You have been added as a <strong>${role}</strong> on the RoomGig Admin Dashboard.</p>
<p>Sign in at <a href="${dashboardUrl}">${dashboardUrl}</a> with:</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Temporary password:</strong> <code>${tempPassword}</code></li>
</ul>
<p>Please change your password immediately after signing in (Settings &rarr; Change password).</p>
<p>&mdash; RoomGig</p>`;

  const text = `Hi ${name}, you have been added as a ${role} on the RoomGig Admin Dashboard. Sign in at ${dashboardUrl} with email: ${email} and temporary password: ${tempPassword}. Please change your password immediately after signing in.`;

  try {
    const response = await fetch(`${emailApiUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject: 'You are invited to the RoomGig Admin Dashboard', html, text }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[admins] invite email send failed:', response.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[admins] invite email send error:', err.message);
    return false;
  }
};

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
    let tempPassword = null;
    if (!authUser) {
      // Create the auth user directly with a temporary password and send the
      // invite email through our own email-notifications service, instead of
      // relying on Supabase's built-in invite email (which needs Supabase SMTP
      // to be configured separately).
      tempPassword = `Rg-${randomBytes(12).toString('base64url')}`;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        console.error('[admins] create user failed:', error.message);
        throw Object.assign(
          new Error('Could not create the auth user: ' + error.message),
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

    // Send the invite email (with temp password) through our email service.
    // Done after the row is committed so a failed email doesn't leave a
    // dangling admin_users row. The temp password is returned to the super
    // admin only if the email could not be sent, so they can share it
    // out-of-band.
    let emailSent = false;
    if (invited && tempPassword) {
      emailSent = await sendInviteEmail({ email, fullName, role, tempPassword });
    }

    res.status(201).json({
      data,
      invited,
      tempPassword: invited && !emailSent ? tempPassword : undefined,
    });
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
