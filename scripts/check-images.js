const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

async function main() {
  // 1) Do property_images rows exist at all? (service_role bypasses RLS)
  const { data: imgs, error: imgErr, count } = await admin
    .from('property_images')
    .select('id, property_id, image_url, is_primary', { count: 'exact' })
    .order('id', { ascending: false })
    .limit(5);
  console.log('=== property_images (service_role) ===');
  console.log('total rows:', count);
  console.log('sample:', JSON.stringify(imgs, null, 2));
  if (imgErr) console.error('admin error:', imgErr);

  // 2) Can the ANON role read the properties+images join? (what the app sees)
  const { data: joined, error: joinErr } = await anon
    .from('properties')
    .select('id, title, status, property_images(image_url, is_primary)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('listed_at', { ascending: false })
    .limit(3);
  console.log('\n=== properties + images (ANON role, app view) ===');
  console.log(JSON.stringify(joined, null, 2));
  if (joinErr) console.error('anon join error:', joinErr);
}

main();
