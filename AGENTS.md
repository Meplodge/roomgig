# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Admin Dashboard

Two new top-level workspaces back the web admin dashboard:

- `admin-api/` — Express service that holds `SUPABASE_SERVICE_ROLE_KEY` and exposes `/api` routes.
- `admin-dashboard/` — Vite + React SPA that talks to `admin-api` only (never to Supabase directly).

## Required environment

Copy `admin-api/.env.example` to `admin-api/.env` and `admin-dashboard/.env.example` to `admin-dashboard/.env`, then fill in the values. The service-role key must never ship to the browser; the dashboard uses a separate Supabase auth flow and an HTTP-only session cookie from `admin-api`.

## Common commands

- `cd admin-api && npm install && npm run dev`
- `cd admin-dashboard && npm install && npm run dev`
- `cd admin-api && npm run create-admin` — seed the first `admin_users` row.

## Mobile suspension enforcement

Suspended users are blocked at sign-in in `src/context/AuthContext.js` via `getCurrentUserProfile()` from `src/services/supabaseApi.js`.
