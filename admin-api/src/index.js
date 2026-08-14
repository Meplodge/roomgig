require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const { supabase } = require('./supabase');
const { requireAdmin, invalidateAll } = require('./middleware/requireAdmin');
const { logAction } = require('./audit');
const { asyncRoute } = require('./utils');

/**
 * Builds a throwaway Supabase client bound to the anon key, used only to verify
 * an admin's current password by signing in. This MUST stay isolated from the
 * shared service-role `supabase` client: supabase-js resolves the PostgREST
 * Authorization header from `auth.getSession()` first and only falls back to
 * the service key when there is no session. If we signed in on the shared
 * client, every subsequent `supabase.from(...)` call would ride the user's JWT
 * instead of the service-role key, RLS on admin_users would hide every row,
 * and the dashboard would lock everyone out with "Could not verify admin
 * access" until the process restarted.
 */
const anonClient = () =>
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }
  );

const analyticsRoutes = require('./routes/analytics');
const usersRoutes = require('./routes/users');
const propertiesRoutes = require('./routes/properties');
const roommateListingsRoutes = require('./routes/roommateListings');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
const reviewsRoutes = require('./routes/reviews');
const messagingRoutes = require('./routes/messaging');
const notificationsRoutes = require('./routes/notifications');
const adminsRoutes = require('./routes/admins');
const auditLogRoutes = require('./routes/auditLog');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Explicit origin allowlist - never '*', because these responses contain PII.
const allowedOrigins = (process.env.ADMIN_DASHBOARD_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

// Simple fixed-window rate limit on mutating requests, per admin token.
const RATE_LIMIT = { windowMs: 60_000, max: 120 };
const hits = new Map();
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  const key = (req.headers.authorization || req.ip || 'anon').slice(-40);
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + RATE_LIMIT.windowMs });
    return next();
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT.max) {
    return res.status(429).json({ error: 'Too many requests, slow down' });
  }
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'roomgig-admin-api' }));

// Everything below requires an active admin.
app.use('/api', requireAdmin);

app.get(
  '/api/me',
  asyncRoute(async (req, res) => {
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', req.admin.id);
    res.json({ data: req.admin });
  })
);

/**
 * Lets the signed-in admin change their own password. We verify the current
 * password by re-signing in with Supabase Auth before accepting the new one,
 * so a stolen dashboard session cannot silently take over the account.
 */
app.post(
  '/api/me/password',
  asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current one' });
    }

    // Verify the current password by signing in on an ISOLATED anon-key client.
    // See the anonClient() comment above for why this must not touch `supabase`.
    const verifier = anonClient();
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: req.admin.email,
      password: currentPassword,
    });
    if (signInError) {
      return res.status(403).json({ error: 'Current password is incorrect' });
    }
    // Drop the session immediately so it can never leak anywhere.
    await verifier.auth.signOut();

    // Update the password using the service-role admin API. updateUserById sends
    // the service-role key as Authorization and never consults the session, so
    // this is safe to run on the shared client.
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      req.admin.auth_user_id,
      { password: newPassword }
    );
    if (updateError) {
      console.error('[me] password update failed:', updateError.message);
      return res.status(500).json({ error: 'Could not update password' });
    }

    // The admin's existing dashboard session is still valid, but the password
    // that backs it has changed. Clear the requireAdmin cache so any in-flight
    // token re-validation starts fresh.
    invalidateAll();

    await logAction(req, {
      action: 'admin.change_password',
      table: 'admin_users',
      id: req.admin.id,
      reason: 'Self-service password change',
    });
    res.json({ data: { ok: true } });
  })
);

app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/roommate-listings', roommateListingsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/settings', settingsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Unknown endpoint' }));

// Central error handler: log the detail, return something safe.
app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) console.error('[error]', req.method, req.originalUrl, error);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`RoomGig admin API listening on port ${PORT}`);
  console.log(`Allowed dashboard origins: ${allowedOrigins.join(', ')}`);
});
