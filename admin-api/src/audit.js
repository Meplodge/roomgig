const { supabase } = require('./supabase');

const clientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.ip || null;
};

/**
 * Append a row to admin_audit_log. Never throws: a failed audit write must not
 * mask the outcome of the action the admin just took, but it is logged loudly.
 */
const logAction = async (req, { action, table, id, before, after, reason }) => {
  const admin = req.admin || {};
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_user_id: admin.id || null,
    admin_email: admin.email || null,
    action,
    target_table: table || null,
    target_id: id || null,
    before: before ?? null,
    after: after ?? null,
    reason: reason || null,
    ip: clientIp(req),
    user_agent: req.headers['user-agent'] || null,
  });

  if (error) console.error('[audit] failed to record action', action, error.message);
};

module.exports = { logAction };
