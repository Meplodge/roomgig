const https = require('https');
require('dotenv').config({ path: '.env' });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// PostgREST exposes the full schema (columns per table) via its OpenAPI root.
const endpoint = `${url}/rest/v1/`;

https
  .get(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } }, (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      try {
        const spec = JSON.parse(body);
        const def = spec.definitions?.roommate_listings;
        if (!def) {
          console.log('roommate_listings not found in schema. Tables:', Object.keys(spec.definitions || {}));
          return;
        }
        console.log('=== roommate_listings columns ===');
        Object.entries(def.properties).forEach(([name, meta]) => {
          console.log(`${name}: ${meta.format || meta.type}`);
        });
      } catch (e) {
        console.error('Parse error:', e.message, '\nRaw:', body.slice(0, 300));
      }
    });
  })
  .on('error', (e) => console.error('Request error:', e.message));
