const express = require('express');
const { supabase } = require('../supabase');
const { requireRole } = require('../middleware/requireAdmin');
const { logAction } = require('../audit');
const { asyncRoute, throwOnSupabaseError, badRequest } = require('../utils');

const router = express.Router();

const SETTING_KEY = 'email_config';

/**
 * Pushes the saved config to the email-notifications microservice so its
 * nodemailer transporter is rebuilt at runtime — no restart needed. Failures
 * are logged but never block the save (the config is already in the database,
 * and the email service will pick it up on its next restart / startup fetch).
 */
const pushConfigToEmailService = async (config) => {
  const emailApiUrl = (process.env.EMAIL_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  try {
    const response = await fetch(`${emailApiUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[email-config] push to email service failed:', response.status, body);
    } else {
      console.log('[email-config] pushed config to email service');
    }
  } catch (err) {
    console.error('[email-config] could not reach email service:', err.message);
  }
};

/**
 * Stored as a single JSONB row in admin_settings so the whole block can be
 * read/written in one round-trip. Sensitive fields (smtp_password) are masked
 * on read so they never reach the browser after being saved.
 */
const DEFAULTS = {
  from_name: 'RoomGig',
  from_email: 'no-reply@roomgig.com',
  reply_to: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_secure: true,
  enabled: false,
};

const PASSWORD_MASK = '••••••••';

/** Returns the merged config, with smtp_password masked when set. */
const readConfig = async () => {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', SETTING_KEY)
    .maybeSingle();
  throwOnSupabaseError(error, 'loading email config');

  const stored = data?.value || {};
  const merged = { ...DEFAULTS, ...stored };
  if (merged.smtp_password) merged.smtp_password = PASSWORD_MASK;
  return merged;
};

router.get(
  '/',
  asyncRoute(async (req, res) => {
    const config = await readConfig();
    res.json({ data: config });
  })
);

router.put(
  '/',
  requireRole('super_admin'),
  asyncRoute(async (req, res) => {
    const body = req.body || {};
    const current = await readConfig();

    // Build the update patch. Only known fields are accepted.
    const patch = { ...current };
    for (const key of Object.keys(DEFAULTS)) {
      if (body[key] === undefined) continue;
      if (key === 'smtp_password') {
        // Don't overwrite the stored password with the mask sentinel.
        if (body[key] === PASSWORD_MASK || body[key] === '') continue;
        patch.smtp_password = String(body[key]);
      } else if (key === 'smtp_port') {
        const port = Number(body[key]);
        patch.smtp_port = Number.isFinite(port) ? port : DEFAULTS.smtp_port;
      } else if (typeof DEFAULTS[key] === 'boolean') {
        patch[key] = !!body[key];
      } else {
        patch[key] = String(body[key] || '').trim();
      }
    }

    if (!patch.from_email.includes('@')) throw badRequest('A valid from email is required');
    if (patch.enabled && !patch.smtp_host) {
      throw badRequest('SMTP host is required when email is enabled');
    }

    const { data: before, error: loadError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .maybeSingle();
    throwOnSupabaseError(loadError, 'loading existing email config');

    const { data, error } = await supabase
      .from('admin_settings')
      .upsert(
        {
          key: SETTING_KEY,
          value: patch,
          description: 'SMTP and sender configuration for outgoing email',
          updated_by: req.admin.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select('value')
      .single();
    throwOnSupabaseError(error, 'saving email config');

    // Mask the password in the response and the audit trail.
    const safe = { ...data.value };
    if (safe.smtp_password) safe.smtp_password = PASSWORD_MASK;

    await logAction(req, {
      action: 'email_config.update',
      table: 'admin_settings',
      id: null,
      before: before?.value ? { ...before.value, smtp_password: before.value.smtp_password ? PASSWORD_MASK : '' } : null,
      after: safe,
      reason: body.reason,
    });

    // Push the full config (with the real password) to the email service so
    // its transporter is rebuilt immediately. `safe` has the password masked,
    // so we send `data.value` which has the real one.
    await pushConfigToEmailService(data.value);

    res.json({ data: safe });
  })
);

module.exports = router;
