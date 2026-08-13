const MAX_PAGE_SIZE = 200;

/** Reads ?page & ?pageSize into safe { page, pageSize, from, to } for .range() */
const parsePaging = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const requested = parseInt(query.pageSize, 10) || 25;
  const pageSize = Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
};

/** Resolves ?from & ?to into ISO strings, defaulting to the last 30 days. */
const parseRange = (query = {}) => {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw badRequest('Invalid from/to date');
  }
  return { from: from.toISOString(), to: to.toISOString() };
};

/** Escapes a user-supplied string for use inside a PostgREST or() filter. */
const escapeFilterValue = (value) => String(value).replace(/[,()\\]/g, ' ').trim();

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const notFound = (message = 'Not found') => Object.assign(new Error(message), { status: 404 });

/** Wraps an async route so rejected promises reach the error handler. */
const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/**
 * Supabase errors carry schema details we do not want to leak to the browser.
 * Log the real thing, surface a generic message.
 */
const throwOnSupabaseError = (error, context) => {
  if (!error) return;
  console.error(`[db] ${context}:`, error.message, error.details || '');
  throw Object.assign(new Error(`Database error while ${context}`), { status: 500 });
};

/** Sorting helper: only allows an explicit column allowlist. */
const parseSort = (query, allowed, fallback) => {
  const column = allowed.includes(query.sort) ? query.sort : fallback;
  const ascending = query.dir === 'asc';
  return { column, ascending };
};

module.exports = {
  parsePaging,
  parseRange,
  parseSort,
  escapeFilterValue,
  badRequest,
  notFound,
  asyncRoute,
  throwOnSupabaseError,
  MAX_PAGE_SIZE,
};
