import { supabase } from './supabase';

const BASE_URL = (import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000').replace(/\/$/, '');

/** Fires when the API rejects our token, so AuthContext can sign out. */
const unauthorizedListeners = new Set();
export const onUnauthorized = (listener) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildUrl = (path, params) => {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, value);
  }
  return url.toString();
};

const request = async (method, path, { params, body } = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(
      'Could not reach the admin API. Is it running, and is this origin allowed by CORS?',
      0
    );
  }

  if (response.status === 401) {
    for (const listener of unauthorizedListeners) listener();
    throw new ApiError('Your session expired. Please sign in again.', 401);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.error || `Request failed (${response.status})`, response.status);
  }
  return payload;
};

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path, body) => request('DELETE', path, { body }),
};
