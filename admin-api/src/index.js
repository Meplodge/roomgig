require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { supabase } = require('./supabase');
const { requireAdmin } = require('./middleware/requireAdmin');
const { asyncRoute } = require('./utils');

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
