const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing credentials. Requires EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  );
  console.error(
    'Get the service_role key from Supabase Dashboard -> Settings -> API. Keep it secret; never ship it in the app.'
  );
  process.exit(1);
}

// Admin client (service_role bypasses RLS and can manage storage buckets).
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const buckets = ['profile-images', 'property-images', 'roommate-images'];

async function setupStorage() {
  console.log(`Setting up storage buckets on ${supabaseUrl}...\n`);

  for (const id of buckets) {
    const { error } = await supabase.storage.createBucket(id, {
      public: true,
      fileSizeLimit: '10MB',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (error) {
      if (/already exists/i.test(error.message)) {
        // Ensure it is public even if it already existed.
        const { error: updateError } = await supabase.storage.updateBucket(id, {
          public: true,
        });
        if (updateError) {
          console.error(`✗ ${id}: exists but failed to set public - ${updateError.message}`);
        } else {
          console.log(`✓ ${id}: already existed, ensured public`);
        }
      } else {
        console.error(`✗ ${id}: ${error.message}`);
      }
    } else {
      console.log(`✓ ${id}: created (public)`);
    }
  }

  console.log('\n✅ Storage setup complete.');
}

setupStorage();
