const { supabase } = require('../supabase');

// Small in-process cache so we don't hit auth + admin_users on every request.
const CACHE_TTL_MS = 30_000;
const cache = new Map();

const invalidate = (token) => cache.delete(token);
const invalidateAll = () => cache.clear();

const bearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length ? token : null;
};

/**
 * Verifies the Supabase access token, then requires an active row in
 * admin_users. Attaches req.admin = { id, email, full_name, role }.
 */
const requireAdmin = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const cached = cache.get(token);
  if (cached && cached.expires > Date.now()) {
    req.admin = cached.admin;
    return next();
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    invalidate(token);
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();

  if (adminError) {
    console.error('[auth] admin lookup failed', adminError.message);
    return res.status(500).json({ error: 'Could not verify admin access' });
  }
  if (!admin) return res.status(403).json({ error: 'This account is not an administrator' });
  if (!admin.is_active) return res.status(403).json({ error: 'This admin account is deactivated' });

  req.admin = {
    id: admin.id,
    email: admin.email,
    full_name: admin.full_name,
    role: admin.role,
    auth_user_id: userData.user.id,
  };
  cache.set(token, { admin: req.admin, expires: Date.now() + CACHE_TTL_MS });
  next();
};

/** Route guard for privileged actions. Usage: requireRole('super_admin', 'admin') */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.admin) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.admin.role)) {
      return res
        .status(403)
        .json({ error: `Requires one of the following roles: ${roles.join(', ')}` });
    }
    next();
  };

module.exports = { requireAdmin, requireRole, invalidateAll };
